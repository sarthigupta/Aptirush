import { prisma } from '../../lib/prisma.js';
import fs from 'fs';

export const AdminService = {
  async processDocumentUpload(file: Express.Multer.File) {
    // 1. Create a DocumentJob in the database
    const job = await prisma.documentJob.create({
      data: {
        filename: file.originalname,
        status: 'PENDING',
      },
    });

    // 2. Mocking S3 Upload
    console.log(`Mocking S3 upload for ${file.originalname} (Job ID: ${job.id})`);

    // 3. Mocking Pipeline Trigger
    console.log(`Mocking textract pipeline trigger for job ${job.id}`);

    // Clean up local multer file
    fs.unlinkSync(file.path);

    return job;
  }
};
