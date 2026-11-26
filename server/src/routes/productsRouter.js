import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
    consumeProduct, createProduct, deactivateProduct, getProductById, getProductOptions,
    getProducts, updateProduct,
} from '../controllers/products/productsControllers.js';

const productsRouter = express.Router();
productsRouter.use(authenticate);
productsRouter.get('/', getProducts);
productsRouter.get('/options', getProductOptions);
productsRouter.get('/:id', getProductById);
productsRouter.post('/:id/consume', authorize('ADMIN', 'MANAGER', 'CASHIER'), consumeProduct);
productsRouter.post('/', authorize('ADMIN', 'MANAGER'), createProduct);
productsRouter.patch('/:id', authorize('ADMIN', 'MANAGER'), updateProduct);
productsRouter.delete('/:id', authorize('ADMIN', 'MANAGER'), deactivateProduct);

export default productsRouter;
