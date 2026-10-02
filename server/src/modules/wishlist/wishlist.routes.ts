import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { wishlistController } from './wishlist.controller.js';
import { addWishlistSchema, wishlistProductIdSchema } from './wishlist.schema.js';

export const wishlistRouter = Router();

wishlistRouter.get('/', wishlistController.get);
wishlistRouter.post('/', validate({ body: addWishlistSchema }), wishlistController.add);
wishlistRouter.delete('/:productId', validate({ params: wishlistProductIdSchema }), wishlistController.remove);
