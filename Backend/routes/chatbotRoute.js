import express from 'express';
import { processMessage, processAdminChatbotMessage } from '../controllers/chatbotController.js';
import adminAuth from '../middleware/adminAuth.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/message', processMessage);
chatbotRouter.post('/admin/message', adminAuth, processAdminChatbotMessage);

export default chatbotRouter;