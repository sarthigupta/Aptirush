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
    return prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          where: { status: 'PUBLISHED' },
        }
      }
    });
  },

  async saveTestAttempt(userId: string, moduleId: string, score: number, total: number) {
    return prisma.testAttempt.create({
      data: {
        userId,
        moduleId,
        score,
        total,
      }
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
  }
};
