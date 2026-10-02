import { z } from 'zod';

const positiveId = z.number().int().positive().safe();
export const addWishlistSchema = z.object({ productId: positiveId });
export const wishlistProductIdSchema = z.object({
  productId: z.string().regex(/^[1-9]\d*$/, 'Product ID must be a positive integer')
    .transform(Number)
    .pipe(positiveId),
});
