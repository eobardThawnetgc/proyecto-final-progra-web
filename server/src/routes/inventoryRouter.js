import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import {
    getItems, getStockAlerts, getItemById,
    createItem, updateItem, adjustStock, deleteItem
} from '../controllers/inventory/inventoryControllers.js';

const inventoryRouter = express.Router();

inventoryRouter.use(authenticate);

inventoryRouter.get('/', getItems);
inventoryRouter.get('/alerts', getStockAlerts); // antes de /:id
inventoryRouter.get('/:id', getItemById);

inventoryRouter.post('/', authorize('ADMIN', 'MANAGER'), createItem);
inventoryRouter.patch('/:id', authorize('ADMIN', 'MANAGER'), updateItem);
inventoryRouter.patch('/:id/stock', authorize('ADMIN', 'MANAGER'), adjustStock);
inventoryRouter.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteItem);

export default inventoryRouter;