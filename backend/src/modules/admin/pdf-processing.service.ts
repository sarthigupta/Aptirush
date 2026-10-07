import { prisma } from '../../lib/prisma.js';
import { DocumentStatus, QuestionStatus, QuestionType } from '../../generated/prisma/client.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const PdfProcessingService = {
  async fetchAndProcessFromS3(jobId: string) {
    try {
      // NOTE: Ensure your AWS pipeline saves the output JSON to this key pattern:
      const s3Key = `bedrock/input/${jobId}.json`;
      
      console.log(`Fetching processed JSON from S3: s3://${process.env.AWS_S3_BUCKET}/${s3Key}`);
      
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
      }));
      
      if (!response.Body) throw new Error('S3 response body is empty');
      
      const strPayload = await response.Body.transformToString();
      const payload = JSON.parse(strPayload);

      return await this.processPipelineWebhook(jobId, payload);
    } catch (error: any) {
      console.error(`Failed to fetch JSON for job ${jobId}:`, error.message);
      if (error.name === 'NoSuchKey') {
        return { success: false, message: 'Processing not finished yet. JSON not found in S3.' };
      }
      throw error;
    }
  },
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
