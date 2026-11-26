import express from 'express';
import { createInvoice } from '../controllers/billing/billingControllers.js';
import { getPosProducts, getSales } from '../controllers/sales/salesControllers.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const salesRouter = express.Router();
salesRouter.use(authenticate, authorize('ADMIN', 'MANAGER', 'CASHIER', 'EMPLOYEE'));
salesRouter.get('/products', getPosProducts);
salesRouter.get('/', getSales);

// Compatibilidad del POS legado: todas las ventas se convierten en facturas consumidor final.
salesRouter.post('/', (req, _res, next) => {
    const sourceDetails = req.body.details ?? req.body.items;
    if (Array.isArray(sourceDetails)) {
        req.body = {
            documentType: req.body.documentType ?? 'CONSUMER',
            customerName: req.body.customerName ?? null,
            customerNit: req.body.customerNit ?? null,
            customerNrc: req.body.customerNrc ?? null,
            paymentMethod: req.body.paymentMethod,
            details: sourceDetails.map(({ productId, quantity }) => ({ productId: Number(productId), quantity: String(quantity) })),
        };
    }
    next();
}, createInvoice);

export default salesRouter;
