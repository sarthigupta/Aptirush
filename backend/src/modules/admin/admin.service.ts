import { prisma } from '../../lib/prisma.js';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

export const AdminService = {
  async getDocumentJobs() {
    return prisma.documentJob.findMany({
      orderBy: { created_at: 'desc' }
    });
  },

  async processDocumentUpload(file: Express.Multer.File) {
    // 1. Create a DocumentJob in the database
    const job = await prisma.documentJob.create({
      data: {
        filename: file.originalname,
        status: 'PENDING',
      },
    });

    const fileStream = fs.createReadStream(file.path);
    const key = `input/pdfs/${job.id}-${file.originalname}`;

    // 2. Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Successfully uploaded ${file.originalname} to S3.`);
    console.log(`S3 Location: s3://${process.env.AWS_S3_BUCKET}/${key}`);


    // Clean up local multer file
    fs.unlinkSync(file.path);

    return job;
  }
};
