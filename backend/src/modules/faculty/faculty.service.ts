import { prisma } from '../../lib/prisma.js';

export const FacultyService = {
  async getMyStudents(facultyId: string) {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        facultyId: facultyId
      },
      include: {
        testAttempts: true
      },
      orderBy: { created_at: 'desc' }
    });

    return students.map(student => {
      const attempts = student.testAttempts;
      const totalTests = attempts.length;
      let avgScore = 0;
      if (totalTests > 0) {
        const sum = attempts.reduce((acc, curr) => acc + (curr.score / curr.total), 0);
        avgScore = Math.round((sum / totalTests) * 100);
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        totalTests,
        avgScore: `${avgScore}%`
      };
    });
  }
};
