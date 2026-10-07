import { prisma } from '../../lib/prisma.js';
import { DocumentStatus, QuestionStatus, QuestionType } from '../../generated/prisma/client.js';

export const PdfProcessingService = {
  async processPipelineWebhook(jobId: string, payload: any) {
    try {
      const moduleMap = new Map<string, string>();

      // 1. Insert all Sections as Modules
      if (payload.sections && Array.isArray(payload.sections)) {
        for (const section of payload.sections) {
          const newModule = await prisma.module.create({
            data: {
              title: section.chapter_name || `Chapter ${section.chapter_number}`,
              chapterNumber: section.chapter_number,
            },
          });
          moduleMap.set(section.section_id, newModule.id);
        }
      }

      // 2. Prepare Questions for Bulk Insert
      if (payload.questions && Array.isArray(payload.questions)) {
        const questionsData = payload.questions.map((q: any) => {
          const dbModuleId = moduleMap.get(q.section_id);
          if (!dbModuleId) throw new Error(`Missing module for section ${q.section_id}`);

          let status: QuestionStatus = QuestionStatus.PUBLISHED;
          if (q.validation_status === 'NEEDS_REVIEW' || q.validation_status === 'VALID_WITH_WARNINGS') {
            status = QuestionStatus.NEEDS_REVIEW;
          }

          return {
            moduleId: dbModuleId,
            questionText: q.question,
            options: q.options || {}, 
            correctAnswer: q.answer || '',
            type: q.question_type === 'MCQ' ? QuestionType.MCQ : QuestionType.TITA,
            status: status,
            documentJobId: jobId
          };
        });

        // 3. Bulk Insert all Questions
        if (questionsData.length > 0) {
          await prisma.question.createMany({
            data: questionsData,
          });
        }
      }

      // 4. Update the DocumentJob status
      await prisma.documentJob.update({
        where: { id: jobId },
        data: { status: DocumentStatus.COMPLETED },
      });

      console.log(`Job ${jobId} successfully processed and saved to DB.`);
      return { success: true };
    } catch (error) {
      console.error('Failed to process pipeline webhook:', error);
      
      await prisma.documentJob.update({
        where: { id: jobId },
        data: { status: DocumentStatus.FAILED },
      });
      
      throw error;
    }
  }
};
