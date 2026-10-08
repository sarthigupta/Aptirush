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

  async saveTestAttempt(userId: string, moduleId: string | null, score: number, total: number, customTestId: string | null = null) {
    return prisma.testAttempt.create({
      data: {
        userId,
        ...(moduleId ? { moduleId } : {}),
        ...(customTestId ? { customTestId } : {}),
        score,
        total
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
  }
};
