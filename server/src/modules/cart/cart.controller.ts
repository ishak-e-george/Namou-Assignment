import type { RequestHandler } from 'express';
import { requireUser } from '../../shared/types.js';
import { cartService } from './cart.service.js';

export const cartController = {
  get: ((req, res) => {
    res.status(200).json({ cart: cartService.getCart(requireUser(req).id) });
  }) satisfies RequestHandler,

  add: ((req, res) => {
    const { variantId, quantity } = req.body as { variantId: number; quantity: number };
    res.status(200).json({ cart: cartService.addItem(requireUser(req).id, variantId, quantity) });
  }) satisfies RequestHandler,

  update: ((req, res) => {
    const { id } = req.params as unknown as { id: number };
    const changes = req.body as { quantity?: number; variantId?: number };
    res.status(200).json({ cart: cartService.updateItem(requireUser(req).id, id, changes) });
  }) satisfies RequestHandler,

  remove: ((req, res) => {
    const { id } = req.params as unknown as { id: number };
    res.status(200).json({ cart: cartService.removeItem(requireUser(req).id, id) });
  }) satisfies RequestHandler,
};
