import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { ordersController } from './orders.controller.js';
import { orderIdSchema } from './orders.schema.js';

export const ordersRouter = Router();

ordersRouter.post('/', ordersController.place);
ordersRouter.get('/:id', validate({ params: orderIdSchema }), ordersController.get);
