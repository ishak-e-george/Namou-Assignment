import { z } from 'zod';

export const orderIdSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'Order ID must be a positive integer')
    .transform(Number)
    .pipe(z.number().int().positive().safe()),
});
