import express from 'express';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  convertActionItemToTask,
  getTaskStats,
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.post('/', createTask);
router.post('/convert-action-item', convertActionItemToTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
