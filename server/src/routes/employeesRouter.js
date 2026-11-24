import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { createEmployee, getBranches, getEmployees, updateEmployee } from '../controllers/employees/employeesControllers.js';

const employeesRouter = express.Router();

employeesRouter.use(authenticate, authorize('ADMIN', 'MANAGER'));
employeesRouter.get('/branches', getBranches);
employeesRouter.get('/', getEmployees);
employeesRouter.post('/', createEmployee);
employeesRouter.patch('/:id', updateEmployee);

export default employeesRouter;
