import { prisma } from './src/lib/prisma.js';

async function main() {
  const modules = await prisma.module.findMany();
  const questions = await prisma.question.findMany();
  const publishedQs = questions.filter(q => q.status === 'PUBLISHED');
  
  console.log(`Modules count: ${modules.length}`);
  console.log(`Total questions: ${questions.length}`);
  console.log(`Published questions: ${publishedQs.length}`);
  
  const testFetch = await prisma.module.findMany({
      include: {
        questions: {
          where: { status: 'PUBLISHED' }
        }
      }
  });
  
  console.log(`Test fetch result:`, JSON.stringify(testFetch, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
