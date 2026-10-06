import { Request, Response } from 'express';
import { AdminService } from '../admin/admin.service.js';

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
  }
};
