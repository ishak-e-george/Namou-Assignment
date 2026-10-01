import { z } from 'zod';

export const productIdSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'Product ID must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().safe()),
});
