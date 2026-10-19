import express from 'express';
import { getTeam, inviteMember, updateMemberRole } from '../controllers/teamController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTeam);
router.post('/invite', authorize('Admin', 'Manager'), inviteMember);
router.put('/members/:id/role', authorize('Admin'), updateMemberRole);

export default router;
