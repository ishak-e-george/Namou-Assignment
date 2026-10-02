import { z } from 'zod';

const positiveInteger = z.number().int().positive().safe();

export const cartItemIdSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'Cart item ID must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().positive().safe()),
});

export const addCartItemSchema = z.object({
  variantId: positiveInteger,
  quantity: positiveInteger,
});

export const updateCartItemSchema = z.object({
  quantity: positiveInteger.optional(),
  variantId: positiveInteger.optional(),
}).refine((value) => value.quantity !== undefined || value.variantId !== undefined, {
  message: 'At least one cart item field is required',
});
