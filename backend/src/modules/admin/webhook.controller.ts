import { Request, Response } from 'express';
import { PdfProcessingService } from './pdf-processing.service.js';

export const WebhookController = {
  async handlePipelineWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { jobId, payload } = req.body;
      
      if (!jobId || !payload) {
        res.status(400).json({ error: 'Missing jobId or payload' });
        return;
      }

      // Process asynchronously so we don't timeout the webhook
      PdfProcessingService.processPipelineWebhook(jobId, payload).catch(console.error);

      res.status(202).json({ message: 'Processing started' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
};
