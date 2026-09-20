import { z } from "zod";

export const instrumentIdSchema = z.string().trim().min(1).max(100);
export const quantitySchema = z.string().trim().min(1).max(40);
export const idempotencySchema = z.string().uuid();

/** Reject extra market fields: price and FX are always resolved by the server. */
export const tradeInputSchema = z.object({
  instrumentId: instrumentIdSchema,
  quantity: quantitySchema,
  clientIdempotencyKey: idempotencySchema,
}).strict();
