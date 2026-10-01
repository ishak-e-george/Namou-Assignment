import type { RequestHandler } from 'express';
import { productsService } from './products.service.js';

export const productsController = {
  list: ((_req, res) => {
    res.status(200).json({ products: productsService.listProducts() });
  }) satisfies RequestHandler,

  getById: ((req, res) => {
    const { id } = req.params as unknown as { id: number };
    res.status(200).json({ product: productsService.getProduct(id) });
  }) satisfies RequestHandler,
};
