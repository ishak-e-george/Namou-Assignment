import type { RequestHandler } from 'express';
import { requireUser } from '../../shared/types.js';
import { ordersService } from './orders.service.js';

export const ordersController = {
  place: ((req, res) => {
    res.status(201).json({ order: ordersService.placeOrder(requireUser(req).id) });
  }) satisfies RequestHandler,
  get: ((req, res) => {
    const { id } = req.params as unknown as { id: number };
    res.status(200).json({ order: ordersService.getOrder(requireUser(req).id, id) });
  }) satisfies RequestHandler,
};
