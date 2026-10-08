import { prisma } from './src/lib/prisma.js';

async function main() {
  const updated = await prisma.question.updateMany({
    where: { status: 'NEEDS_REVIEW' },
    data: { status: 'PUBLISHED' }
  });

  console.log(`✅ Successfully published ${updated.count} questions!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
