import { z } from 'zod';

// Story status enum
export const StoryStatusSchema = z.enum(['planned', 'in_progress', 'in_review', 'blocked', 'done']);

// Story complexity enum
export const StoryComplexitySchema = z.enum(['XS', 'S', 'M', 'L', 'XL']);

// Story ID pattern: [A-Z]+-[A-Z0-9]+-\d+
export const StoryIdSchema = z
  .string()
  .regex(/^[A-Z]+-[A-Z0-9]+-\d+$/, 'Story ID must match pattern: PREFIX-FEATURE-NUMBER');

// Main Story schema
export const StorySchema = z.object({
  id: StoryIdSchema,
  title: z.string().min(1, 'Title cannot be empty'),
  featureId: z.string().min(1, 'Feature ID is required'), // Explicit hierarchy link
  releaseId: z.string().min(1, 'Release ID is required'), // Explicit hierarchy link
  status: StoryStatusSchema,
  complexity: StoryComplexitySchema,
  estimate: z.number().optional(),
  owner: z.string().optional(),
  jira: z.string().optional(),
  openspec: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  milestone: z.string().optional(),
});

// Type inference
export type StoryStatus = z.infer<typeof StoryStatusSchema>;
export type StoryComplexity = z.infer<typeof StoryComplexitySchema>;
export type Story = z.infer<typeof StorySchema>;
