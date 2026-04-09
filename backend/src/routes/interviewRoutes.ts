import { Router } from 'express';
import { interviewController } from '../controllers/interviewController';

const router = Router();

router.post('/', interviewController.create);
router.get('/', interviewController.getAll);
router.get('/stats', interviewController.getStats);
router.get('/:id', interviewController.getById);
router.post('/:id/complete', interviewController.complete);

export default router;