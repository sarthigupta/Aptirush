import { FacultyService } from './src/modules/faculty/faculty.service.js';
import { prisma } from './src/lib/prisma.js';

async function main() {
  const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
  const question = await prisma.question.findFirst();
  
  if (!faculty || !question) throw new Error("Missing data");
  
  try {
    const res = await FacultyService.createCustomTest(faculty.id, "Test API", [question.id]);
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  }
}
main().finally(() => prisma.$disconnect());
