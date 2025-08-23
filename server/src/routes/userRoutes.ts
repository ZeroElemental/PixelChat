import { Router } from 'express';
import { getAllUsers } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// This route is protected by our 'protect' middleware
router.get('/', protect, getAllUsers);

export default router;