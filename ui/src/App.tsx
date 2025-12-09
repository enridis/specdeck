import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReleasesPage } from './pages/ReleasesPage';
import { ReleaseDetailPage } from './pages/ReleaseDetailPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { FeatureDetailPage } from './pages/FeatureDetailPage';
import { StoriesPage } from './pages/StoriesPage';
import { AutocompleteProvider } from './contexts/AutocompleteContext';

function App() {
  return (
    <AutocompleteProvider>
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AutocompleteProvider>
  );
}

export default App;
