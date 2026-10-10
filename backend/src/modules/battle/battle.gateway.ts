import { Server, Socket } from 'socket.io';
import { prisma } from '../../lib/prisma.js';

// Simple in-memory queue
let waitingPlayer: { socket: Socket; userId: string } | null = null;

// Map to track private rooms
const privateRooms = new Map<string, { socket: Socket; userId: string }>();
const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Map to track active battles
const activeBattles = new Map<string, { p1: string; p2: string; questions: any[] }>();

export const setupBattleGateway = (io: Server) => {
  io.on('connection', (socket) => {
    console.log(`User connected to Battle Gateway: ${socket.id}`);

    socket.on('join_queue', async (data) => {
      const { userId } = data;
      if (!userId) return;

      console.log(`User ${userId} joined queue`);

      if (waitingPlayer && waitingPlayer.userId !== userId) {
        // Match found!
        const player1 = waitingPlayer;
        const player2 = { socket, userId };
        waitingPlayer = null; // Clear queue

        // Get 5 random published questions
        const questions = await prisma.question.findMany({
          where: { status: 'PUBLISHED' },
          take: 5
        });

        // Create battle in DB
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

        activeBattles.set(battle.id, { p1: player1.userId, p2: player2.userId, questions });

        // Join both to a socket room
        player1.socket.join(battle.id);
        player2.socket.join(battle.id);

        // Notify both players
        io.to(battle.id).emit('match_found', {
          battleId: battle.id,
          opponentId: player2.userId, // for p1
          questions
        });
      } else {
        // Join queue
        waitingPlayer = { socket, userId };
      }
    });

    socket.on('leave_queue', () => {
      if (waitingPlayer && waitingPlayer.socket.id === socket.id) {
        waitingPlayer = null;
      }
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

      const questions = await prisma.question.findMany({
        where: { status: 'PUBLISHED' },
        take: 5
      });

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

      activeBattles.set(battle.id, { p1: player1.userId, p2: player2.userId, questions });

      player1.socket.join(battle.id);
      player2.socket.join(battle.id);

      io.to(battle.id).emit('match_found', {
        battleId: battle.id,
        opponentId: player2.userId,
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
      const { battleId } = data;
      socket.join(battleId);
    });

    socket.on('join_test_room', async (data) => {
      const { customTestId } = data;
      if (!customTestId) return;

      const roomName = `test_${customTestId}`;
      socket.join(roomName);

      const topAttempts = await prisma.testAttempt.findMany({
        where: { customTestId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { score: 'desc' },
        take: 10
      });

      const initialLeaderboard = topAttempts.map(a => ({
        userId: a.user.id,
        name: a.user.name,
        score: a.score,
        isFinished: true
      }));

      socket.emit('initial_leaderboard', { leaderboard: initialLeaderboard });
    });

    socket.on('test_progress', (data) => {
      const { customTestId, userId, name, score, isFinished } = data;
      socket.to(`test_${customTestId}`).emit('leaderboard_update', {
        userId,
        name,
        score,
        isFinished
      });
    });

    socket.on('submit_answer', (data) => {
      const { battleId, userId, score } = data;
      // Notify the other player
      socket.to(battleId).emit('opponent_progress', { score });
    });

    socket.on('battle_over', async (data) => {
      const { battleId, userId, score } = data;
      socket.to(battleId).emit('opponent_finished', { score });
      
      // We can handle final DB logic via REST API or here.
      // For now, let the frontend send a REST call to finalize the battle.
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      if (waitingPlayer && waitingPlayer.socket.id === socket.id) {
        waitingPlayer = null;
      }
    });
  });
};
