import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { productsController } from './products.controller.js';
import { productIdSchema } from './products.schema.js';

export const productsRouter = Router();

productsRouter.get('/', productsController.list);
productsRouter.get('/:id', validate({ params: productIdSchema }), productsController.getById);
