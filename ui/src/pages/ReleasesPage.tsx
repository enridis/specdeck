import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useReleases } from '../hooks/useData';
import { ReleaseForm } from '../components/releases/ReleaseForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../services/api.service';

export function ReleasesPage() {
  const { data: releases, loading, error, refetch } = useReleases();
  const [showForm, setShowForm] = useState(false);
  const [editingRelease, setEditingRelease] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await api.releases.delete(id);
    await refetch();
  };

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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Releases</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          New Release
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {releases.map((release) => (
          <div
            key={release.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <Link to={`/releases/${release.id}`} className="block">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{release.title}</h2>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    release.status === 'released'
                      ? 'bg-green-100 text-green-800'
                      : release.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : release.status === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {release.status}
                </span>
              </div>
              {release.version && (
                <div className="text-sm text-gray-500 mb-2">v{release.version}</div>
              )}
              {release.description && (
                <p className="text-gray-600 text-sm line-clamp-3">{release.description}</p>
              )}
              {release.releaseDate && (
                <div className="mt-4 text-sm text-gray-500">
                  Release Date: {new Date(release.releaseDate).toLocaleDateString()}
                </div>
              )}
            </Link>
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingRelease(release);
                  setShowForm(true);
                }}
                className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(release.id);
                }}
                className="flex-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {releases.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No releases found</p>
        </div>
      )}

      <ReleaseForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingRelease(null);
        }}
        onSuccess={refetch}
        release={editingRelease}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Release"
        message="Are you sure you want to delete this release? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
