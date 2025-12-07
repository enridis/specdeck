import { z } from 'zod';

// Repository configuration
export const RepoConfigSchema = z.object({
  name: z.string(),
  path: z.string(),
});

// Defaults configuration
export const DefaultsSchema = z.object({
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  status: z.enum(['planned', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
});

// Main configuration schema
export const ConfigSchema = z.object({
  openspecDir: z.string().default('./openspec'),
  repos: z.array(RepoConfigSchema).default([]),
  defaults: DefaultsSchema.optional(),
});

// Type inference
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type Defaults = z.infer<typeof DefaultsSchema>;
export type Config = z.infer<typeof ConfigSchema>;
