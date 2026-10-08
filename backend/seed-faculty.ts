import { prisma } from './src/lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@gmail.com' },
    update: {
      password_hash: hashedPassword,
      role: 'FACULTY',
    },
    create: {
      name: 'Faculty User',
      email: 'faculty@gmail.com',
      password_hash: hashedPassword,
      role: 'FACULTY',
      is_active: true
    }
  });
  
  console.log('✅ Faculty seeded successfully:', faculty.email);
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
