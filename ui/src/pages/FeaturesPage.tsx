import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFeatures, useStories } from '../hooks/useData';
import { FeatureForm } from '../components/features/FeatureForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../services/api.service';

export function FeaturesPage() {
  const { data: features, loading, error, refetch } = useFeatures();
  const { data: allStories } = useStories();
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await api.features.delete(id);
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
        <h1 className="text-3xl font-bold text-gray-900">Features</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          New Feature
        </button>
      </div>

      <div className="space-y-4">
        {features.map((feature) => {
          const featureStories = allStories.filter(s => s.feature === feature.id);
          const doneCount = featureStories.filter(s => s.status === 'done').length;
          const inProgressCount = featureStories.filter(s => s.status === 'in_progress').length;
          const totalCount = featureStories.length;
          const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
          
          return (
            <div
              key={feature.id}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4"
              style={{
                borderLeftColor: 
                  progress === 100 ? '#10b981' :
                  inProgressCount > 0 ? '#3b82f6' :
                  totalCount === 0 ? '#9ca3af' :
                  '#f59e0b'
              }}
            >
              <Link to={`/features/${feature.id}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h2>
                    {feature.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">{feature.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4 flex-wrap">
                      {feature.release && (
                        <div className="text-sm text-gray-500">
                          Release: <span className="font-medium">{feature.release}</span>
                        </div>
                      )}
                      {totalCount > 0 && (
                        <>
                          <div className="text-sm text-gray-500">•</div>
                          <div className="text-sm text-gray-500">
                            {totalCount} {totalCount === 1 ? 'story' : 'stories'}
                          </div>
                          <div className="text-sm text-gray-500">•</div>
                          <div className="text-sm font-medium text-green-600">
                            {doneCount} done
                          </div>
                          {inProgressCount > 0 && (
                            <>
                              <div className="text-sm text-gray-500">•</div>
                              <div className="text-sm font-medium text-blue-600">
                                {inProgressCount} in progress
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {totalCount > 0 && (
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFeature(feature);
                    setShowForm(true);
                  }}
                  className="flex-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(feature.id);
                  }}
                  className="flex-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {features.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No features found</p>
        </div>
      )}

      <FeatureForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingFeature(null);
        }}
        onSuccess={refetch}
        feature={editingFeature}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Feature"
        message="Are you sure you want to delete this feature? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
