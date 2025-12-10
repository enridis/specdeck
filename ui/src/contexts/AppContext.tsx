import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api.service';

interface CoordinatorInfo {
  submoduleCount: number;
  cacheDir?: string;
  overlaysDir?: string;
}

interface CacheInfo {
  isCached: boolean;
  isStale: boolean;
  syncedAt?: string;
  ageInHours?: number;
  ageDescription?: string;
}

interface SubmoduleStatus {
  name: string;
  isStale: boolean;
  currentCommit: string;
  remoteCommit: string;
  message: string;
}

interface AppContextType {
  isCoordinatorMode: boolean;
  coordinator: CoordinatorInfo | null;
  cacheInfo: CacheInfo;
  submoduleStatus: SubmoduleStatus[];
  isSubmoduleStale: boolean;
  jiraBaseUrl: string;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isCoordinatorMode, setIsCoordinatorMode] = useState(false);
  const [coordinator, setCoordinator] = useState<CoordinatorInfo | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    isCached: false,
    isStale: false,
  });
  const [submoduleStatus, setSubmoduleStatus] = useState<SubmoduleStatus[]>([]);
  const [isSubmoduleStale, setIsSubmoduleStale] = useState(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState('https://jira.example.com');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = await api.config.get();
      setIsCoordinatorMode(config.isCoordinatorMode);
      setCoordinator(config.coordinator);
      setJiraBaseUrl(config.jiraBaseUrl || 'https://jira.example.com');

      // Calculate cache age if synced
      if (config.syncedAt) {
        const syncedTime = new Date(config.syncedAt);
        const now = new Date();
        const ageInHours = (now.getTime() - syncedTime.getTime()) / (1000 * 60 * 60);
        const isStale = ageInHours > 24;

        let ageDescription = '';
        if (ageInHours < 1) {
          const minutes = Math.round(ageInHours * 60);
          ageDescription = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        } else if (ageInHours < 24) {
          const hours = Math.round(ageInHours);
          ageDescription = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        } else {
          const days = Math.round(ageInHours / 24);
          ageDescription = `${days} day${days !== 1 ? 's' : ''} ago`;
        }

        setCacheInfo({
          isCached: true,
          isStale,
          syncedAt: config.syncedAt,
          ageInHours,
          ageDescription,
        });
      }

      // Check submodule status if in coordinator mode
      if (config.isCoordinatorMode) {
        try {
          const submoduleResult = await api.config.getSubmoduleStatus();
          setSubmoduleStatus(submoduleResult.statuses || []);
          setIsSubmoduleStale(submoduleResult.anyStale || false);
        } catch {
          // Submodule check failed, don't block config load
          setSubmoduleStatus([]);
          setIsSubmoduleStale(false);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load config';
      setError(message);
      console.error('Error loading config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load config on mount
  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <AppContext.Provider value={{ isCoordinatorMode, coordinator, cacheInfo, submoduleStatus, isSubmoduleStale, jiraBaseUrl, isLoading, error, refreshConfig }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
