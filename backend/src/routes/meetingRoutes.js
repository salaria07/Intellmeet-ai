import express from 'express';
import {
  getMeetings,
  getMeetingByCode,
  createInstantMeeting,
  scheduleMeeting,
  joinMeeting,
  leaveMeeting,
  endMeeting,
  cancelMeeting,
  addTranscriptSegment,
  generateSummary,
} from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All meeting routes require authentication

router.get('/', getMeetings);
router.post('/instant', createInstantMeeting);
router.post('/schedule', scheduleMeeting);
router.get('/:code', getMeetingByCode);
router.post('/:code/join', joinMeeting);
router.post('/:code/leave', leaveMeeting);
router.put('/:code/end', endMeeting);
router.delete('/:id', cancelMeeting);
router.post('/:code/transcript', addTranscriptSegment);
router.post('/:code/summary', generateSummary);

export default router;
