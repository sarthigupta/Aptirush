import { Request, Response } from 'express';
import { AdminService } from '../admin/admin.service.js';
import { PdfProcessingService } from './pdf-processing.service.js';

export const AdminController = {
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      const job = await AdminService.processDocumentUpload(req.file);
      res.status(202).json({ message: 'Document uploaded successfully', job });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const jobs = await AdminService.getDocumentJobs();
      res.json(jobs);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  },

  async syncDocumentJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params as { jobId: string };
      if (!jobId) {
        res.status(400).json({ error: 'Missing jobId' });
        return;
      }

      const result = await PdfProcessingService.fetchAndProcessFromS3(jobId);
      if (!result.success) {
        res.status(202).json(result);
        return;
      }

      res.status(200).json({ message: 'Document synchronized successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};
