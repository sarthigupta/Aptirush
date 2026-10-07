import { Router } from 'express';
import { WebhookController } from './webhook.controller.js';

const router = Router();

router.post('/pdf-processed', WebhookController.handlePipelineWebhook);

export default router;
