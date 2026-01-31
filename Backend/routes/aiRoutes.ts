import express from 'express';
import { chatWithAI } from '../controllers/aiController';
import isAuth from '../middleware/isAuth';

const router = express.Router();

router.post('/chat', isAuth, chatWithAI);

export default router;