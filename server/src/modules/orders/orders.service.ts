import { withTransaction } from '../../db/database.js';
import { AppError, ConflictError } from '../../shared/errors.js';
import { ordersRepository } from './orders.repository.js';

export const ordersService = {
  placeOrder(userId: number) {
    return withTransaction(() => {
      // withTransaction uses BEGIN IMMEDIATE; the cart snapshot is read only after acquiring the write lock.
      const lines = ordersRepository.getCheckoutLines(userId);
      if (lines.length === 0) throw new AppError(400, 'CART_EMPTY', 'Your cart is empty');

      const stockProblems = lines
        .filter((line) => line.quantity < 1 || line.quantity > line.stock)
        .map((line) => ({ variantId: line.variantId, requested: line.quantity, available: line.stock }));
      if (stockProblems.length > 0) {
        throw new ConflictError('Stock changed before checkout', { items: stockProblems }, 'OUT_OF_STOCK');
      }

      const totalCents = lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);
      for (const line of lines) {
        if (!ordersRepository.decrementStock(line.variantId, line.quantity)) {
          throw new ConflictError('Stock changed before checkout', {
            items: [{ variantId: line.variantId, requested: line.quantity, available: line.stock }],
          }, 'OUT_OF_STOCK');
        }
      }

      const orderId = ordersRepository.insertOrder(userId, totalCents);
      ordersRepository.insertOrderItems(orderId, lines);
      ordersRepository.clearCart(userId);
      const order = ordersRepository.findOwnedOrder(userId, orderId);
      if (!order) throw new Error('Created order could not be read');
      return order;
    });
  },

  getOrder(userId: number, orderId: number) {
    const order = ordersRepository.findOwnedOrder(userId, orderId);
    if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    return order;
  },
};
