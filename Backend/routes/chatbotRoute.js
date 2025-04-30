import express from 'express';
import { processMessage } from '../controllers/chatbotController.js';

const chatbotRouter = express.Router();

chatbotRouter.post('/message', processMessage);

export default chatbotRouter;