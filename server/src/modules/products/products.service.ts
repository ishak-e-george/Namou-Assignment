import { AppError } from '../../shared/errors.js';
import { productsRepository } from './products.repository.js';

export const productsService = {
  listProducts() {
    return productsRepository.list();
  },
  getProduct(id: number) {
    const product = productsRepository.findById(id);
    if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    return product;
  },
};
