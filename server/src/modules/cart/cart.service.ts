import { withTransaction } from '../../db/database.js';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { cartRepository } from './cart.repository.js';

function ensureStock(variantId: number, requested: number, available: number): void {
  if (requested > available) {
    throw new ConflictError(`Only ${available} left in stock`, { variantId, requested, available }, 'OUT_OF_STOCK');
  }
}

function requireVariant(variantId: number) {
  const variant = cartRepository.findVariant(variantId);
  if (!variant) throw new AppError(404, 'VARIANT_NOT_FOUND', 'Product variant not found');
  return variant;
}

function requireLine(userId: number, itemId: number) {
  const line = cartRepository.findLine(userId, itemId);
  if (!line) throw new NotFoundError('Cart item not found');
  return line;
}

export const cartService = {
  getCart(userId: number) {
    return cartRepository.getCart(userId);
  },

  addItem(userId: number, variantId: number, quantity: number) {
    return withTransaction(() => {
      const variant = requireVariant(variantId);
      const current = cartRepository.findLineByVariant(userId, variantId);
      const requestedTotal = quantity + (current?.quantity ?? 0);
      const available = Math.max(variant.stock - (current?.quantity ?? 0), 0);
      ensureStock(variantId, quantity, available);
      if (current) cartRepository.updateQuantity(userId, current.cart_item_id, requestedTotal);
      else cartRepository.insertLine(userId, variantId, quantity);
      return cartRepository.getCart(userId);
    });
  },

  updateItem(userId: number, itemId: number, changes: { quantity?: number; variantId?: number }) {
    return withTransaction(() => {
      const source = requireLine(userId, itemId);
      const quantity = changes.quantity ?? source.quantity;
      const targetVariantId = changes.variantId ?? source.variant_id;
      const targetVariant = requireVariant(targetVariantId);

      if (targetVariant.product_id !== source.product_id) {
        throw new ValidationError('Variant must belong to the same product');
      }

      if (targetVariantId === source.variant_id) {
        ensureStock(targetVariantId, quantity, targetVariant.stock);
        if (changes.quantity !== undefined) cartRepository.updateQuantity(userId, itemId, quantity);
        return cartRepository.getCart(userId);
      }

      const targetLine = cartRepository.findLineByVariant(userId, targetVariantId);
      if (targetLine) {
        const mergedQuantity = targetLine.quantity + quantity;
        ensureStock(targetVariantId, quantity, Math.max(targetVariant.stock - targetLine.quantity, 0));
        cartRepository.updateQuantity(userId, targetLine.cart_item_id, mergedQuantity);
        cartRepository.deleteLine(userId, itemId);
      } else {
        ensureStock(targetVariantId, quantity, targetVariant.stock);
        cartRepository.updateVariant(userId, itemId, targetVariantId, quantity);
      }

      return cartRepository.getCart(userId);
    });
  },

  removeItem(userId: number, itemId: number) {
    return withTransaction(() => {
      requireLine(userId, itemId);
      cartRepository.deleteLine(userId, itemId);
      return cartRepository.getCart(userId);
    });
  },
};
