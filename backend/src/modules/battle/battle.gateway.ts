import { Server, Socket } from 'socket.io';
import { prisma } from '../../lib/prisma.js';

// Matchmaking queue
let queue: { socket: Socket; userId: string; elo: number; joinedAt: number }[] = [];

// Map to track private rooms
const privateRooms = new Map<string, { socket: Socket; userId: string }>();
const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Active battles state map
interface ActiveBattle {
  battleId: string;
  p1: { userId: string; score: number };
  p2: { userId: string; score: number };
  questions: any[];
  currentQIndex: number;
  questionClaimed: boolean;
  claimedBy: string | null;
  wrongAttempts: Set<string>;
  advanceTimeout?: NodeJS.Timeout;
}

const activeBattles = new Map<string, ActiveBattle>();

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function getRandomBattleQuestions(count: number = 5) {
  let candidates = await prisma.question.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true }
  });

  if (candidates.length === 0) {
    candidates = await prisma.question.findMany({
      select: { id: true }
    });
  }

  if (candidates.length === 0) {
    return [];
  }

  const selectedIds = shuffleArray(candidates)
    .slice(0, count)
    .map(c => c.id);

  const questions = await prisma.question.findMany({
    where: { id: { in: selectedIds } }
  });

  return shuffleArray(questions);
}

async function finalizeBattle(battleId: string, battle: ActiveBattle, io: Server) {
  try {
    if (battle.advanceTimeout) {
      clearTimeout(battle.advanceTimeout);
    }

    let winnerId: string | null = null;
    if (battle.p1.score > battle.p2.score) {
      winnerId = battle.p1.userId;
    } else if (battle.p2.score > battle.p1.score) {
      winnerId = battle.p2.userId;
    }

    // Update Battle record in DB
    await prisma.battle.update({
      where: { id: battleId },
      data: {
        status: 'COMPLETED',
        winnerId: winnerId || undefined
      }
    });

    // Update ELO and streaks using dynamic Elo formula
    const winnerData = winnerId
      ? await prisma.user.findUnique({
          where: { id: winnerId },
          select: { elo: true, currentStreak: true, longestStreak: true }
        })
      : null;

    const loserId = winnerId
      ? (winnerId === battle.p1.userId ? battle.p2.userId : battle.p1.userId)
      : null;

    const loserData = loserId
      ? await prisma.user.findUnique({
          where: { id: loserId },
          select: { elo: true }
        })
      : null;

    let winnerEloChange = 0;
    let loserEloChange = 0;

    if (winnerId && winnerData && loserId && loserData) {
      const K = 32; // base K-factor
      const totalQs = battle.questions.length || 5;
      const winnerScore = winnerId === battle.p1.userId ? battle.p1.score : battle.p2.score;
      const loserScore = winnerId === battle.p1.userId ? battle.p2.score : battle.p1.score;

      // Expected win probability (standard Elo formula)
      const expectedWin = 1 / (1 + Math.pow(10, (loserData.elo - winnerData.elo) / 400));

      // Margin bonus: dominating 5-0 earns more than scraping 3-2
      const marginBonus = (winnerScore - loserScore) / totalQs; // 0 to 1

      // Streak multiplier: 5% extra per consecutive win (capped at 50%)
      const streak = (winnerData.currentStreak || 0);
      const streakMultiplier = 1 + Math.min(streak * 0.05, 0.5);

      // Winner gains: higher when beating stronger opponents, with margin & streak bonuses
      winnerEloChange = Math.round(K * (1 - expectedWin) * (1 + marginBonus) * streakMultiplier);
      winnerEloChange = Math.max(5, Math.min(winnerEloChange, 60)); // clamp [5, 60]

      // Loser loses: more when losing to a weaker opponent
      loserEloChange = Math.round(K * (0 - expectedWin) * (1 + marginBonus * 0.5));
      loserEloChange = Math.max(-40, Math.min(loserEloChange, -3)); // clamp [-40, -3]

      // Update winner
      const newWinnerElo = winnerData.elo + winnerEloChange;
      const newStreak = streak + 1;
      await prisma.user.update({
        where: { id: winnerId },
        data: {
          elo: newWinnerElo,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, winnerData.longestStreak || 0),
          lastActiveAt: new Date()
        }
      });
      await prisma.eloHistory.create({
        data: { userId: winnerId, elo: newWinnerElo }
      });

      // Update loser (floor at 1000)
      const newLoserElo = Math.max(1000, loserData.elo + loserEloChange);
      loserEloChange = newLoserElo - loserData.elo; // recalculate in case of floor
      await prisma.user.update({
        where: { id: loserId },
        data: {
          elo: newLoserElo,
          currentStreak: 0,
          lastActiveAt: new Date()
        }
      });
      await prisma.eloHistory.create({
        data: { userId: loserId, elo: newLoserElo }
      });
    }

    io.to(battleId).emit('battle_completed', {
      battleId,
      p1Score: battle.p1.score,
      p2Score: battle.p2.score,
      winnerId,
      isDraw: battle.p1.score === battle.p2.score,
      eloChanges: {
        [battle.p1.userId]: winnerId === battle.p1.userId ? winnerEloChange : loserEloChange,
        [battle.p2.userId]: winnerId === battle.p2.userId ? winnerEloChange : loserEloChange,
      }
    });

    activeBattles.delete(battleId);
  } catch (err) {
    console.error('Error finalizing battle:', err);
  }
}

export const setupBattleGateway = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`User connected to Battle Gateway: ${socket.id}`);

    socket.on('join_queue', async (data) => {
      const { userId } = data;
      if (!userId) return;

      console.log(`User ${userId} joined queue`);

      if (queue.find(p => p.userId === userId)) return;

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { elo: true } });
      const userElo = user?.elo || 1000;

      const opponentIndex = queue.findIndex(p => Math.abs(p.elo - userElo) <= 250 && p.userId !== userId);

      if (opponentIndex !== -1) {
        const player1 = queue.splice(opponentIndex, 1)[0];
        const player2 = { socket, userId, elo: userElo, joinedAt: Date.now() };

        const questions = await getRandomBattleQuestions(5);

        const battle = await prisma.battle.create({
          data: {
            player1Id: player1.userId,
            player2Id: player2.userId,
            status: 'IN_PROGRESS',
            questions: {
              connect: questions.map(q => ({ id: q.id }))
            }
          }
        });

        const battleState: ActiveBattle = {
          battleId: battle.id,
          p1: { userId: player1.userId, score: 0 },
          p2: { userId: player2.userId, score: 0 },
          questions,
          currentQIndex: 0,
          questionClaimed: false,
          claimedBy: null,
          wrongAttempts: new Set<string>()
        };

        activeBattles.set(battle.id, battleState);

        player1.socket.join(battle.id);
        player2.socket.join(battle.id);

        io.to(battle.id).emit('match_found', {
          battleId: battle.id,
          p1Id: player1.userId,
          p2Id: player2.userId,
          questions
        });
      } else {
        queue.push({ socket, userId, elo: userElo, joinedAt: Date.now() });
      }
    });

    socket.on('leave_queue', () => {
      queue = queue.filter(p => p.socket.id !== socket.id);
    });

    socket.on('create_private_room', (data) => {
      const { userId } = data;
      if (!userId) return;

      const roomId = generateShortId();
      privateRooms.set(roomId, { socket, userId });
      socket.emit('private_room_created', { roomId });
    });

    socket.on('join_private_room', async (data) => {
      const { userId, roomId } = data;
      if (!userId || !roomId) return;

      const host = privateRooms.get(roomId);
      if (!host) {
        socket.emit('room_error', { message: 'Room not found or already started.' });
        return;
      }
      if (host.userId === userId) {
        socket.emit('room_error', { message: 'You cannot join your own room.' });
        return;
      }

      const player1 = host;
      const player2 = { socket, userId };
      privateRooms.delete(roomId);

      const questions = await getRandomBattleQuestions(5);

      const battle = await prisma.battle.create({
        data: {
          player1Id: player1.userId,
          player2Id: player2.userId,
          status: 'IN_PROGRESS',
          questions: {
            connect: questions.map(q => ({ id: q.id }))
          }
        }
      });

      const battleState: ActiveBattle = {
        battleId: battle.id,
        p1: { userId: player1.userId, score: 0 },
        p2: { userId: player2.userId, score: 0 },
        questions,
        currentQIndex: 0,
        questionClaimed: false,
        claimedBy: null,
        wrongAttempts: new Set<string>()
      };

      activeBattles.set(battle.id, battleState);

      player1.socket.join(battle.id);
      player2.socket.join(battle.id);

      io.to(battle.id).emit('match_found', {
        battleId: battle.id,
        p1Id: player1.userId,
        p2Id: player2.userId,
        questions
      });
    });

    socket.on('cancel_private_room', (data) => {
      const { roomId } = data;
      if (privateRooms.has(roomId)) {
        privateRooms.delete(roomId);
      }
    });

    socket.on('join_battle', (data) => {
      const { battleId, userId } = data;
      if (!battleId) return;
      socket.join(battleId);

      const battle = activeBattles.get(battleId);
      if (battle) {
        socket.emit('battle_sync', {
          currentQIndex: battle.currentQIndex,
          p1Score: battle.p1.score,
          p2Score: battle.p2.score,
          p1Id: battle.p1.userId,
          p2Id: battle.p2.userId,
          questionClaimed: battle.questionClaimed,
          claimedBy: battle.claimedBy,
          isLocked: battle.questionClaimed || battle.wrongAttempts.has(userId)
        });
      }
    });

    socket.on('submit_answer', async (data) => {
      const { battleId, userId, optionKey, questionIndex } = data;
      const battle = activeBattles.get(battleId);
      if (!battle) return;

      // Ignore if question index doesn't match or question already claimed
      if (questionIndex !== battle.currentQIndex || battle.questionClaimed) {
        return;
      }

      // Ignore if this user already missed this question
      if (battle.wrongAttempts.has(userId)) {
        return;
      }

      const currentQuestion = battle.questions[battle.currentQIndex];
      if (!currentQuestion) return;

      const isCorrect = optionKey === currentQuestion.correctAnswer;

      if (isCorrect) {
        // Player answered CORRECT first -> claims the point immediately!
        battle.questionClaimed = true;
        battle.claimedBy = userId;

        if (userId === battle.p1.userId) {
          battle.p1.score += 1;
        } else if (userId === battle.p2.userId) {
          battle.p2.score += 1;
        }

        // Emit IMMEDIATELY so score reflects on both screens right away
        io.to(battleId).emit('question_resolved', {
          questionIndex: battle.currentQIndex,
          claimedBy: userId,
          isCorrect: true,
          correctAnswer: currentQuestion.correctAnswer,
          selectedOption: optionKey,
          p1Score: battle.p1.score,
          p2Score: battle.p2.score
        });

        // Advance to next question after 1.5 seconds
        battle.advanceTimeout = setTimeout(async () => {
          const currentBattle = activeBattles.get(battleId);
          if (!currentBattle) return;

          currentBattle.currentQIndex += 1;
          currentBattle.questionClaimed = false;
          currentBattle.claimedBy = null;
          currentBattle.wrongAttempts.clear();

          if (currentBattle.currentQIndex < currentBattle.questions.length) {
            io.to(battleId).emit('next_question', {
              currentQIndex: currentBattle.currentQIndex,
              p1Score: currentBattle.p1.score,
              p2Score: currentBattle.p2.score
            });
          } else {
            await finalizeBattle(battleId, currentBattle, io);
          }
        }, 1500);

      } else {
        // Player answered INCORRECT -> locked out of this question!
        battle.wrongAttempts.add(userId);

        // Notify the answering player that their answer was wrong
        socket.emit('answer_incorrect', {
          questionIndex: battle.currentQIndex,
          selectedOption: optionKey
        });

        // Notify opponent that the challenger missed, point is still up for grabs
        socket.to(battleId).emit('opponent_missed', {
          questionIndex: battle.currentQIndex
        });

        // If both players attempted and missed, reveal correct answer and advance
        if (battle.wrongAttempts.size >= 2) {
          battle.questionClaimed = true;
          io.to(battleId).emit('question_resolved', {
            questionIndex: battle.currentQIndex,
            claimedBy: null,
            isCorrect: false,
            correctAnswer: currentQuestion.correctAnswer,
            selectedOption: optionKey,
            p1Score: battle.p1.score,
            p2Score: battle.p2.score
          });

          battle.advanceTimeout = setTimeout(async () => {
            const currentBattle = activeBattles.get(battleId);
            if (!currentBattle) return;

            currentBattle.currentQIndex += 1;
            currentBattle.questionClaimed = false;
            currentBattle.claimedBy = null;
            currentBattle.wrongAttempts.clear();

            if (currentBattle.currentQIndex < currentBattle.questions.length) {
              io.to(battleId).emit('next_question', {
                currentQIndex: currentBattle.currentQIndex,
                p1Score: currentBattle.p1.score,
                p2Score: currentBattle.p2.score
              });
            } else {
              await finalizeBattle(battleId, currentBattle, io);
            }
          }, 1500);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      queue = queue.filter(p => p.socket.id !== socket.id);
    });
  });
};
