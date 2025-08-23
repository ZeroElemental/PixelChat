import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/:id', protect, getMessages);
router.post('/', protect, sendMessage);

export default router;