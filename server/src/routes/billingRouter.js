import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { createInvoice, getBillingData } from '../controllers/billing/billingControllers.js';

const billingRouter = express.Router();

billingRouter.use(authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER'));
billingRouter.get('/', getBillingData);
billingRouter.post('/', createInvoice);

export default billingRouter;
