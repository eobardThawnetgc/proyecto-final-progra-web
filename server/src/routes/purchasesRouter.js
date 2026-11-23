import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
    getBranches, getSuppliers, createSupplier, updateSupplier,
    getPurchases, createPurchase, updatePaidAmount,
} from '../controllers/purchases/purchasesControllers.js';

const purchasesRouter = express.Router();

purchasesRouter.use(authenticate, authorize('ADMIN', 'MANAGER'));
purchasesRouter.get('/branches', getBranches);
purchasesRouter.get('/suppliers', getSuppliers);
purchasesRouter.post('/suppliers', createSupplier);
purchasesRouter.put('/suppliers/:id', updateSupplier);
purchasesRouter.get('/', getPurchases);
purchasesRouter.post('/', createPurchase);
purchasesRouter.patch('/:id/payment', updatePaidAmount);

export default purchasesRouter;
