import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api.service';
import { useAppContext } from './AppContext';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt?: string;
  error?: string;
  progress?: string;
}

interface SyncContextType {
  syncStatus: SyncStatus;
  triggerSync: (dryRun?: boolean) => Promise<void>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { refreshConfig } = useAppContext();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
  });

  const triggerSync = async (dryRun = false) => {
    setSyncStatus({ isSyncing: true, progress: 'Syncing stories...' });

    try {
      await api.sync.trigger({ dryRun });

      setSyncStatus({
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      });

      // Refresh config to update cache timestamp
      await refreshConfig();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      setSyncStatus({
        isSyncing: false,
        error: message,
      });
    }
  };

  const clearError = () => {
    setSyncStatus((prev) => ({ ...prev, error: undefined }));
  };

  return (
    <SyncContext.Provider value={{ syncStatus, triggerSync, clearError }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}
