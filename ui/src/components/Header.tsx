import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useSyncContext } from '../contexts/SyncContext';

export function Header() {
  const { isCoordinatorMode, cacheInfo, isSubmoduleStale } = useAppContext();
  const { syncStatus, triggerSync } = useSyncContext();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              SpecDeck
            </Link>
            {isCoordinatorMode && (
              <div className="ml-6 text-sm">
                {syncStatus.isSyncing ? (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin mr-2">⟳</div>
                    Syncing...
                  </div>
                ) : cacheInfo.isCached ? (
                  <div className="flex items-center">
                    <span className="text-gray-600">
                      Synced {cacheInfo.ageDescription}
                    </span>
                    {cacheInfo.isStale && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        Stale ({'>'}24h)
                      </span>
                    )}
                    <button
                      onClick={() => triggerSync()}
                      className="ml-2 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-600">
                    <span>No sync yet</span>
                    <button
                      onClick={() => triggerSync()}
                      className="ml-2 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                    >
                      Sync Now
                    </button>
                  </div>
                )}
                {syncStatus.error && (
                  <div className="mt-1 text-red-600 text-xs">
                    Error: {syncStatus.error}
                  </div>
                )}
                {isSubmoduleStale && (
                  <div className="mt-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-orange-800 text-xs">
                    <div className="font-medium">⚠ Submodules may be outdated</div>
                    <div className="text-orange-700">Run <code className="bg-orange-100 px-1 rounded">git submodule update --remote</code> in terminal</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <nav className="flex space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/releases"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Releases
            </Link>
            <Link
              to="/features"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Features
            </Link>
            <Link
              to="/stories"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Stories
            </Link>
            {isCoordinatorMode && (
              <Link
                to="/overlays"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Overlays
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
