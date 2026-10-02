import { AppError } from '../../shared/errors.js';
import { productsRepository } from '../products/products.repository.js';
import { wishlistRepository } from './wishlist.repository.js';

export const wishlistService = {
  getWishlist(userId: number) {
    return wishlistRepository.list(userId);
  },

  addProduct(userId: number, productId: number) {
    if (!productsRepository.findById(productId)) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    wishlistRepository.add(userId, productId);
    return wishlistRepository.list(userId);
  },

  removeProduct(userId: number, productId: number) {
    wishlistRepository.remove(userId, productId);
    return wishlistRepository.list(userId);
  },
};
