import { z } from 'zod';

// Feature ID pattern: [A-Z]+-\d+ or similar
export const FeatureIdSchema = z
  .string()
  .regex(/^[A-Z]+-[A-Z0-9]+(-[A-Z0-9]+)*$/, 'Feature ID must match pattern: PREFIX-NUMBER');

// Main Feature schema
export const FeatureSchema = z.object({
  id: FeatureIdSchema,
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().optional(),
  releaseId: z.string(),
  openspecChange: z.string().optional(),
  repos: z.array(z.string()).default([]),
  storyCount: z.number().default(0),
});

// Type inference
export type Feature = z.infer<typeof FeatureSchema>;
