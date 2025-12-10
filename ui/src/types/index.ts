export type StoryStatus = 'planned' | 'in_progress' | 'in_review' | 'blocked' | 'done';
export type StoryComplexity = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type ReleaseStatus = 'planned' | 'active' | 'released' | 'archived';

export interface Story {
  id: string;
  title: string;
  description?: string;
  status: StoryStatus;
  complexity: StoryComplexity;
  points?: number;
  assignee?: string;
  dependencies?: string[];
  tags?: string[];
  milestone?: string;
  createdAt?: string;
  updatedAt?: string;
  feature?: string;
  release?: string;
  requirementLinks?: string[];
  jira?: string;
  repo?: string;
}

export interface Feature {
  id: string;
  title: string;
  description?: string;
  status?: string;
  stories?: Story[];
  release?: string;
}

export interface Release {
  id: string;
  title: string;
  version?: string;
  status: ReleaseStatus;
  description?: string;
  releaseDate?: string;
  features?: Feature[];
}

export interface Stats {
  total: number;
  byStatus: Record<StoryStatus, number>;
  byComplexity: Record<StoryComplexity, number>;
  totalPoints: number;
  pointsByStatus?: {
    done: number;
    in_progress: number;
    planned: number;
    in_review: number;
    blocked: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}
