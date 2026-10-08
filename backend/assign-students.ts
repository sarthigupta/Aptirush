import { prisma } from './src/lib/prisma.js';

async function main() {
  const faculty = await prisma.user.findUnique({ where: { email: 'faculty@gmail.com' }});
  if (!faculty) {
    console.log('Faculty not found');
    return;
  }

  const updated = await prisma.user.updateMany({
    where: { role: 'STUDENT' },
    data: { facultyId: faculty.id }
  });

  console.log(`✅ Assigned ${updated.count} students to faculty@gmail.com`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
