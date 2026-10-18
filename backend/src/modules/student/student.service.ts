import { prisma } from '../../lib/prisma.js';

export const StudentService = {
  async getModules(userId: string) {
    return prisma.module.findMany({
      include: {
        _count: {
          select: { questions: { where: { status: 'PUBLISHED' } } }
        },
        testAttempts: {
          where: { userId },
          take: 1
        }
      }
    });
  },

  async getModuleQuiz(moduleId: string) {
    let quiz: any = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          where: { status: 'PUBLISHED' },
        }
      }
    });

    if (!quiz) {
      quiz = await prisma.customTest.findUnique({
        where: { id: moduleId },
        include: {
          questions: true
        }
      });
    }

    return quiz;
  },

  async saveTestAttempt(userId: string, moduleId: string | null, score: number, total: number, customTestId: string | null = null, durationMs: number = 0, mistakes: {questionId: string, userAnswer: string}[] = []) {
    // 1. Update Streak
    const user = await prisma.user.findUnique({ where: { id: userId }});
    if (user) {
      const now = new Date();
      const lastActive = new Date(user.lastActiveAt);
      
      const isToday = now.toDateString() === lastActive.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = yesterday.toDateString() === lastActive.toDateString();
      
      let newStreak = user.currentStreak;
      if (isYesterday) {
        newStreak += 1;
      } else if (!isToday) {
        newStreak = 1; // Reset streak if missed a day
      }
      
      // Ensure they get a streak of at least 1 for playing today
      if (newStreak === 0) {
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: { 
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
          lastActiveAt: now 
        }
      });
    }

    // 2. Save Test Attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        ...(moduleId ? { moduleId } : {}),
        ...(customTestId ? { customTestId } : {}),
        score,
        total,
        durationMs
      }
    });

    // 3. Log Mistakes
    if (mistakes && mistakes.length > 0) {
      await prisma.mistake.createMany({
        data: mistakes.map(m => ({
          userId,
          attemptId: attempt.id,
          questionId: m.questionId,
          userAnswer: m.userAnswer
        }))
      });
    }

    return attempt;
  },

  async getAssignedTests(userId: string) {
    const student = await prisma.user.findUnique({ where: { id: userId }});
    if (!student?.facultyId) return [];
    
    return prisma.customTest.findMany({
      where: { facultyId: student.facultyId },
      include: {
        questions: true,
        attempts: {
          where: { userId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getDashboardStats(userId: string) {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId },
      include: { module: true, customTest: true },
      orderBy: { createdAt: 'desc' }
    });

    const totalCompleted = attempts.length;
    let avgScore = 0;
    if (totalCompleted > 0) {
      const sum = attempts.reduce((acc, curr) => acc + (curr.score / curr.total), 0);
      avgScore = Math.round((sum / totalCompleted) * 100);
    }

    const recentTests = attempts.slice(0, 5).map(a => {
      const title = a.module ? a.module.title : (a.customTest ? a.customTest.title : 'Unknown Test');
      return {
        title,
        score: `${Math.round((a.score / a.total) * 100)}%`,
        date: new Date(a.createdAt).toLocaleDateString(),
        status: (a.score / a.total) >= 0.7 ? 'Passed' : 'Needs Review'
      };
    });

    return {
      stats: {
        testsCompleted: totalCompleted.toString(),
        averageScore: `${avgScore}%`,
        timeSpent: 'N/A'
      },
      recentTests
    };
  },

  async getLeaderboard() {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        elo: true,
        faculty: { select: { name: true } },
        battlesWon: { select: { id: true } },
        battlesAsP1: { select: { id: true } },
        battlesAsP2: { select: { id: true } },
        testAttempts: { select: { score: true, total: true, durationMs: true } }
      },
      orderBy: { elo: 'desc' },
      take: 100
    });

    return students.map(s => {
      const totalBattles = s.battlesAsP1.length + s.battlesAsP2.length;
      const winRate = totalBattles > 0 ? (s.battlesWon.length / totalBattles) * 100 : 0;
      
      let avgSpeed = 0;
      let accuracy = 0;

      if (s.testAttempts.length > 0) {
        const sumAccuracy = s.testAttempts.reduce((acc, curr) => acc + (curr.score / curr.total), 0);
        accuracy = (sumAccuracy / s.testAttempts.length) * 100;

        let totalQuestionsAnswered = 0;
        let totalTimeMs = 0;
        s.testAttempts.forEach(attempt => {
          totalTimeMs += attempt.durationMs;
          totalQuestionsAnswered += attempt.total;
        });

        if (totalQuestionsAnswered > 0 && totalTimeMs > 0) {
          avgSpeed = (totalTimeMs / totalQuestionsAnswered) / 1000; // Average seconds per question
        } else {
          avgSpeed = Math.max(10, 25 - (s.elo - 1000) / 100); // Fallback
        }
      } else {
        avgSpeed = Math.max(10, 25 - (s.elo - 1000) / 100); // Fallback if no attempts
      }

      return {
        id: s.id,
        name: s.name,
        affiliation: s.faculty?.name || 'Independent',
        elo: s.elo,
        winRate: winRate.toFixed(1) + '%',
        avgSpeed: avgSpeed.toFixed(1) + 's',
        accuracy: accuracy.toFixed(1) + '%'
      };
    });
  },

  async getMistakeVault(userId: string) {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const mistakes = await prisma.mistake.findMany({
      where: { 
        userId,
        createdAt: { gte: threeHoursAgo }
      },
      include: {
        question: {
          select: { questionText: true, options: true, correctAnswer: true, type: true }
        },
        attempt: {
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return mistakes.map(m => ({
      id: m.id,
      questionText: m.question.questionText,
      options: m.question.options,
      correctAnswer: m.question.correctAnswer,
      userAnswer: m.userAnswer,
      date: m.attempt?.createdAt || m.createdAt,
      type: m.question.type
    }));
  },

  async getPerformanceAnalytics(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        eloHistory: {
          orderBy: { createdAt: 'asc' }
        },
        mistakes: {
          include: { question: true }
        },
        testAttempts: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) return null;

    // Determine Weakness based on mistakes
    const categoryMistakes: Record<string, number> = {
      'Quantitative': 0,
      'Logical': 0,
      'Verbal': 0,
      'Data Interpretation': 0
    };

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentMistakes = user.mistakes.filter(m => new Date(m.createdAt) >= threeHoursAgo);

    recentMistakes.forEach(m => {
      // Mock category assignment based on question type or text
      if (m.question.questionText.toLowerCase().includes('data') || m.question.questionText.includes('%')) {
        categoryMistakes['Data Interpretation']++;
      } else if (m.question.questionText.toLowerCase().includes('if') || m.question.questionText.includes('logic')) {
        categoryMistakes['Logical']++;
      } else if (m.question.type === 'TITA') {
        categoryMistakes['Quantitative']++;
      } else {
        categoryMistakes['Verbal']++;
      }
    });

    let topWeakness = 'None';
    let maxMistakes = 0;
    for (const [cat, count] of Object.entries(categoryMistakes)) {
      if (count > maxMistakes) {
        maxMistakes = count;
        topWeakness = cat;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const testsCompletedToday = await prisma.testAttempt.count({
      where: {
        userId,
        createdAt: {
          gte: today
        }
      }
    });

    const dailyActivity: Record<string, number> = {};
    if (user.testAttempts) {
      user.testAttempts.forEach((attempt) => {
        const d = attempt.createdAt.toISOString().slice(0, 10);
        dailyActivity[d] = (dailyActivity[d] || 0) + 1;
      });
    }

    if (user.currentStreak > 0) {
      const now = new Date();
      for (let i = 0; i < user.currentStreak; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (!dailyActivity[key]) {
          dailyActivity[key] = 1;
        }
      }
    }

    return {
      elo: user.elo,
      eloHistory: user.eloHistory,
      weakness: maxMistakes > 0 ? topWeakness : 'Keep practicing to uncover weaknesses!',
      mistakeCount: recentMistakes.length,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      testsCompletedToday,
      dailyActivity
    };
  }
};
