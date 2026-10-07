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
  }
};
