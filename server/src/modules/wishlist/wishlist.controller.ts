import type { RequestHandler } from 'express';
import { requireUser } from '../../shared/types.js';
import { wishlistService } from './wishlist.service.js';

export const wishlistController = {
  get: ((req, res) => {
    res.status(200).json({ wishlist: wishlistService.getWishlist(requireUser(req).id) });
  }) satisfies RequestHandler,

  add: ((req, res) => {
    const { productId } = req.body as { productId: number };
    res.status(200).json({ wishlist: wishlistService.addProduct(requireUser(req).id, productId) });
  }) satisfies RequestHandler,

  remove: ((req, res) => {
    const { productId } = req.params as unknown as { productId: number };
    res.status(200).json({ wishlist: wishlistService.removeProduct(requireUser(req).id, productId) });
  }) satisfies RequestHandler,
};
