import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReleasesPage } from './pages/ReleasesPage';
import { ReleaseDetailPage } from './pages/ReleaseDetailPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { FeatureDetailPage } from './pages/FeatureDetailPage';
import { StoriesPage } from './pages/StoriesPage';
import { OverlaysPage } from './pages/OverlaysPage';
import { AutocompleteProvider } from './contexts/AutocompleteContext';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { SyncProvider, useSyncContext } from './contexts/SyncContext';

function AppWithSync() {
  const { isCoordinatorMode } = useAppContext();
  const { triggerSync, syncStatus } = useSyncContext();

  // Auto-sync on load if in coordinator mode
  useEffect(() => {
    if (isCoordinatorMode && !syncStatus.isSyncing && !syncStatus.lastSyncedAt) {
      triggerSync();
    }
  }, [isCoordinatorMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="releases" element={<ReleasesPage />} />
          <Route path="releases/:id" element={<ReleaseDetailPage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="features/:id" element={<FeatureDetailPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="stories/:id" element={<StoriesPage />} />
          <Route path="overlays" element={<OverlaysPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <SyncProvider>
        <AutocompleteProvider>
          <AppWithSync />
        </AutocompleteProvider>
      </SyncProvider>
    </AppProvider>
  );
}

export default App;
