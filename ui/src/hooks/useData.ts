import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import type {
  Release,
  Feature,
  Story,
  Stats,
  StoryStatus,
  StoryComplexity,
} from '../types';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseListResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReleases(): UseListResult<Release> {
  const [data, setData] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.releases.list();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch releases');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useRelease(id: string | undefined): UseDataResult<Release> {
  const [data, setData] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const result = await api.releases.get(id);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch release');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useFeatures(releaseId?: string): UseListResult<Feature> {
  const [data, setData] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.features.list(releaseId);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch features');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [releaseId, refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useFeature(id: string | undefined): UseDataResult<Feature> {
  const [data, setData] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const result = await api.features.get(id);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch feature');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useStories(filters?: {
  status?: StoryStatus;
  complexity?: StoryComplexity;
  feature?: string;
  milestone?: string;
  release?: string;
}): UseListResult<Story> {
  const [data, setData] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.stories.list(filters);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch stories');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [
    filters?.status,
    filters?.complexity,
    filters?.feature,
    filters?.milestone,
    filters?.release,
    refetchCounter,
  ]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useStory(id: string | undefined): UseDataResult<Story> {
  const [data, setData] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const result = await api.stories.get(id);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch story');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}

export function useStats(
  type: 'overall' | 'release' | 'feature',
  id?: string
): UseDataResult<Stats> {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let result: Stats;
        if (type === 'overall') {
          result = await api.stats.overall();
        } else if (type === 'release' && id) {
          result = await api.stats.byRelease(id);
        } else if (type === 'feature' && id) {
          result = await api.stats.byFeature(id);
        } else {
          throw new Error('Invalid stats type or missing id');
        }
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch stats');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [type, id, refetchCounter]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchCounter((c) => c + 1),
  };
}
