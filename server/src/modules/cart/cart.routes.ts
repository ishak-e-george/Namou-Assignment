import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { cartController } from './cart.controller.js';
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from './cart.schema.js';

export const cartRouter = Router();

cartRouter.get('/', cartController.get);
cartRouter.post('/items', validate({ body: addCartItemSchema }), cartController.add);
cartRouter.patch('/items/:id', validate({ params: cartItemIdSchema, body: updateCartItemSchema }), cartController.update);
cartRouter.delete('/items/:id', validate({ params: cartItemIdSchema }), cartController.remove);
