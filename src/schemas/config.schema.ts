import { z } from 'zod';

// Repository configuration
export const RepoConfigSchema = z.object({
  name: z.string(),
  path: z.string(),
});

// Submodule configuration (coordinator mode)
export const SubmoduleConfigSchema = z.object({
  name: z.string().describe('Submodule name (e.g., "backend", "frontend")'),
  path: z.string().describe('Relative path to submodule (e.g., "./submodules/backend")'),
  visibility: z.enum(['public', 'private', 'on-premises']).default('private').optional(),
});

// Coordinator configuration
export const CoordinatorConfigSchema = z.object({
  enabled: z.boolean().default(false),
  submodules: z.array(SubmoduleConfigSchema).default([]),
  overlaysDir: z
    .string()
    .default('./specdeck/overlays')
    .describe('Directory containing overlay files'),
  cacheDir: z.string().default('./.specdeck-cache').describe('Directory for synced cache'),
});

// Defaults configuration
export const DefaultsSchema = z.object({
  complexity: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  status: z.enum(['planned', 'in_progress', 'in_review', 'blocked', 'done']).optional(),
});

// Main configuration schema
export const ConfigSchema = z.object({
  openspecDir: z.string().optional(), // Optional: only needed if using OpenSpec integration
  specdeckDir: z.string().default('./specdeck'),
  repos: z.array(RepoConfigSchema).default([]),
  coordinator: CoordinatorConfigSchema.optional(),
  defaults: DefaultsSchema.optional(),
  jiraBaseUrl: z
    .string()
    .optional()
    .describe('Base URL for Jira instance (e.g., "https://jira.company.com")'),
});

// Type inference
export type SubmoduleConfig = z.infer<typeof SubmoduleConfigSchema>;
export type CoordinatorConfig = z.infer<typeof CoordinatorConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type Defaults = z.infer<typeof DefaultsSchema>;
export type Config = z.infer<typeof ConfigSchema>;
