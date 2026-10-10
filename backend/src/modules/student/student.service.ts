import { prisma } from '../../lib/prisma.js';

export const StudentService = {
  async getModules() {
    return prisma.module.findMany({
      include: {
        _count: {
          select: { questions: { where: { status: 'PUBLISHED' } } }
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

  async saveTestAttempt(userId: string, moduleId: string | null, score: number, total: number, customTestId: string | null = null, durationMs: number = 0) {
    return prisma.testAttempt.create({
      data: {
        userId,
        ...(moduleId ? { moduleId } : {}),
        ...(customTestId ? { customTestId } : {}),
        score,
        total,
        durationMs
      }
    });
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
  }
};
