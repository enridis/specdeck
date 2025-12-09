import type {
  Release,
  Feature,
  Story,
  StoryStatus,
  StoryComplexity,
} from '../types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: any;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'API request failed');
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

export const api = {
  // Releases
  releases: {
    list: () => fetchApi<Release[]>('/releases'),
    get: (id: string) => fetchApi<Release>(`/releases/${id}`),
    create: (data: Omit<Release, 'id'>) =>
      fetchApi<Release>('/releases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Release>) =>
      fetchApi<Release>(`/releases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/releases/${id}`, {
        method: 'DELETE',
      }),
  },

  // Features
  features: {
    list: (releaseId?: string) => {
      const query = releaseId ? `?release=${releaseId}` : '';
      return fetchApi<Feature[]>(`/features${query}`);
    },
    get: (id: string) => fetchApi<Feature>(`/features/${id}`),
    create: (data: any) =>
      fetchApi<Feature>('/features', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Feature>) =>
      fetchApi<Feature>(`/features/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/features/${id}`, {
        method: 'DELETE',
      }),
  },

  // Stories
  stories: {
    list: (filters?: {
      status?: StoryStatus;
      complexity?: StoryComplexity;
      feature?: string;
      milestone?: string;
      release?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchApi<Story[]>(`/stories${query}`);
    },
    get: (id: string) => fetchApi<Story>(`/stories/${id}`),
    create: (data: Omit<Story, 'id'>) =>
      fetchApi<Story>('/stories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Story>) =>
      fetchApi<Story>(`/stories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/stories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Stats
  stats: {
    overall: async () => {
      const response = await fetchApi<any>('/stats');
      // Handle nested response structure from backend
      if (response.stories) {
        return {
          total: response.stories.total || 0,
          byStatus: response.stories.byStatus || {},
          byComplexity: response.stories.byComplexity || {},
          totalPoints: response.stories.totalPoints || 0,
          pointsByStatus: response.stories.pointsByStatus || {},
        };
      }
      return response;
    },
    byRelease: async (releaseId: string) => {
      const response = await fetchApi<any>(`/stats/releases/${releaseId}`);
      // Handle nested response structure from backend
      if (response.stories) {
        return {
          total: response.stories.total || 0,
          byStatus: response.stories.byStatus || {},
          byComplexity: response.stories.byComplexity || {},
          totalPoints: response.stories.totalPoints || 0,
          pointsByStatus: response.stories.pointsByStatus || {},
        };
      }
      return response;
    },
    byFeature: async (featureId: string) => {
      const response = await fetchApi<any>(`/stats/features/${featureId}`);
      // Handle nested response structure from backend
      if (response.stories) {
        return {
          total: response.stories.total || 0,
          byStatus: response.stories.byStatus || {},
          byComplexity: response.stories.byComplexity || {},
          totalPoints: response.stories.totalPoints || 0,
          pointsByStatus: response.stories.pointsByStatus || {},
        };
      }
      return response;
    },
  },
};
