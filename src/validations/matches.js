// src/validation/matches.js

import { z } from 'zod';

/**
 * Match status constants
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

/**
 * Query schema for listing matches
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

/**
 * Route params schema for match ID
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * Helper to validate ISO date strings
 */
const isValidIsoDateString = (value) => {
  const isoDateTimeWithZone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

  if(!isoDateTimeWithZone.test(value)) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

/**
 * Schema for creating a match
 */
export const createMatchSchema = z
  .object({
    sport: z.string().trim().min(1, 'Sport is required'),
    homeTeam: z.string().trim().min(1, 'Home team is required'),
    awayTeam: z.string().trim().min(1, 'Away team is required'),

    startTime: z
      .string()
      .refine(isValidIsoDateString, {
        message: 'startTime must be a valid ISO date string',
      }),

    endTime: z
      .string()
      .refine(isValidIsoDateString, {
        message: 'endTime must be a valid ISO date string',
      }),

    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be after startTime',
      });
    }
  });

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});