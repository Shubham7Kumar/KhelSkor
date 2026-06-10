// src/validation/commentary.js

import { z } from 'zod';

/**
 * Query params validation for listing commentary
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

/**
 * Validation schema for creating commentary entries
 */
export const createCommentarySchema = z.object({
  minute: z
    .number()
    .int()
    .nonnegative(),

  sequence: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  period: z
    .string()
    .trim()
    .optional(),

  eventType: z
    .string()
    .trim()
    .optional(),

  actor: z
    .string()
    .trim()
    .optional(),

  team: z
    .string()
    .trim()
    .optional(),

  message: z
    .string()
    .trim()
    .min(1, 'Message is required'),

  metadata: z
    .record(z.string(), z.any())
    .optional(),

  tags: z
    .array(z.string().trim())
    .optional(),
});