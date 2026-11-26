import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
    closeSession, getCurrentSession, getSessions, openSession,
} from '../controllers/cash/cashControllers.js';

const cashRouter = express.Router();

cashRouter.use(authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'));
cashRouter.get('/current', getCurrentSession);
cashRouter.get('/sessions', getSessions);
cashRouter.post('/sessions', openSession);
cashRouter.post('/sessions/:id/close', closeSession);

export default cashRouter;
