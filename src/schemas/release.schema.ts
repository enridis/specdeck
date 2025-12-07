import { z } from 'zod';

// Release ID schema (kebab-case or R1-format)
export const ReleaseIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/, 'Release ID must be kebab-case or R1-format');

// Main Release schema
export const ReleaseSchema = z.object({
  id: ReleaseIdSchema,
  title: z.string().min(1, 'Title cannot be empty'),
  timeframe: z.string().optional(),
  objectives: z.array(z.string()).default([]),
  successMetrics: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
});

// Type inference
export type Release = z.infer<typeof ReleaseSchema>;
