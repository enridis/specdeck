import { useStats } from '../hooks/useData';

export function Dashboard() {
  const { data: stats, loading, error } = useStats('overall');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Provide default values for empty stats
  const byStatus = stats.byStatus || {};
  const byComplexity = stats.byComplexity || {};

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Stories</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Total Points</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPoints}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {byStatus.done || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-2">In Progress</div>
          <div className="text-3xl font-bold text-blue-600">
            {byStatus.in_progress || 0}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By Status</h2>
          <div className="space-y-3">
            {Object.entries(byStatus).length > 0 ? (
              Object.entries(byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize">
                    {status.replace('-', ' ')}
                  </span>
                  <span className="text-gray-900 font-medium">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No stories yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By Complexity</h2>
          <div className="space-y-3">
            {Object.entries(byComplexity).length > 0 ? (
              Object.entries(byComplexity).map(([complexity, count]) => (
                <div key={complexity} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize">{complexity}</span>
                  <span className="text-gray-900 font-medium">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No stories yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
