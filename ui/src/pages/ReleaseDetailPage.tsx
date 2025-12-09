import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRelease, useFeatures, useStats, useStories } from '../hooks/useData';
import { api } from '../services/api.service';
import { StoryForm } from '../components/stories/StoryForm';
import { FeatureForm } from '../components/features/FeatureForm';
import { InlineEditableCell } from '../components/common/InlineEditableCell';
import { InlineEditableSelect } from '../components/common/InlineEditableSelect';
import type { Story } from '../types';

export function ReleaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: release, loading, error } = useRelease(id);
  const { data: features, refetch: refetchFeatures } = useFeatures(id);
  const { data: stats } = useStats('release', id);
  const { data: allStories, refetch: refetchStories } = useStories({ release: id });
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | undefined>();
  const [isFeatureFormOpen, setIsFeatureFormOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setIsStoryFormOpen(true);
  };

  const handleStorySuccess = () => {
    setIsStoryFormOpen(false);
    setEditingStory(undefined);
    refetchStories();
  };

  const handleFeatureSuccess = () => {
    setIsFeatureFormOpen(false);
    setEditingFeature(null);
    refetchFeatures();
  };

  const handleStatusUpdate = async (storyId: string, status: string) => {
    try {
      await api.stories.update(storyId, { status: status as any });
      refetchStories();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(`Error updating status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAssigneeUpdate = async (storyId: string, assignee: string) => {
    try {
      await api.stories.update(storyId, { assignee });
      refetchStories();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(`Error updating assignee: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

  if (!release) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Release not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/releases" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Releases
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{release.title}</h1>
            {release.version && (
              <div className="text-lg text-gray-500">Version {release.version}</div>
            )}
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${
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
        {release.description && (
          <p className="text-gray-600 mt-4">{release.description}</p>
        )}
        {release.releaseDate && (
          <div className="mt-4 text-sm text-gray-500">
            Release Date: {new Date(release.releaseDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Stories</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Done</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.byStatus?.done || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.byStatus?.in_progress || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Total Points</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPoints}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Points Done</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.pointsByStatus?.done || 0}
            </div>
          </div>
        </div>
      )}

      {stats && stats.pointsByStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Points In Progress</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.pointsByStatus.in_progress || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Points In Review</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.pointsByStatus.in_review || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500">Points To Plan</div>
            <div className="text-2xl font-bold text-gray-600">
              {stats.pointsByStatus.planned || 0}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Features</h2>
          <button 
            onClick={() => setIsFeatureFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            New Feature
          </button>
        </div>

        <div className="space-y-6">
          {features.map((feature) => {
            const featureStories = allStories.filter(s => s.feature === feature.id);
            const doneCount = featureStories.filter(s => s.status === 'done').length;
            const totalCount = featureStories.length;
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
            
            return (
              <div
                key={feature.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <Link to={`/features/${feature.id}`} className="block p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      {feature.description && (
                        <p className="text-gray-600 text-sm mt-2">{feature.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="text-sm text-gray-500">
                          {totalCount} {totalCount === 1 ? 'story' : 'stories'}
                        </div>
                        <div className="text-sm text-gray-500">•</div>
                        <div className="text-sm font-medium text-green-600">
                          {doneCount} done
                        </div>
                        {totalCount > 0 && (
                          <>
                            <div className="text-sm text-gray-500">•</div>
                            <div className="text-sm text-gray-500">
                              {Math.round(progress)}% complete
                            </div>
                          </>
                        )}
                      </div>
                      {totalCount > 0 && (
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                
                {featureStories.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="space-y-2">
                      {featureStories.map((story) => (
                        <div
                          key={story.id}
                          className="flex items-center justify-between p-3 bg-white rounded hover:bg-gray-50 transition-colors border-l-4"
                          style={{
                            borderLeftColor: 
                              story.status === 'done' ? '#10b981' :
                              story.status === 'in_progress' ? '#3b82f6' :
                              story.status === 'in_review' ? '#a855f7' :
                              story.status === 'blocked' ? '#ef4444' :
                              '#9ca3af'
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div 
                              onClick={() => handleEditStory(story)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500">{story.id}</span>
                                <span className="text-xs text-gray-500 uppercase">{story.complexity}</span>
                              </div>
                              <div className="text-sm text-gray-900 mt-1">{story.title}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="w-32">
                              <InlineEditableSelect
                                value={story.status}
                                onSave={(value) => handleStatusUpdate(story.id, value)}
                                options={[
                                  { value: 'planned', label: 'Planned' },
                                  { value: 'in_progress', label: 'In Progress' },
                                  { value: 'in_review', label: 'In Review' },
                                  { value: 'blocked', label: 'Blocked' },
                                  { value: 'done', label: 'Done' },
                                ]}
                              />
                            </div>
                            <div className="w-32">
                              <InlineEditableCell
                                value={story.assignee || ''}
                                onSave={(value) => handleAssigneeUpdate(story.id, value)}
                                type="assignee"
                                placeholder="Unassigned"
                              />
                            </div>
                            {story.points && (
                              <div className="text-xs font-medium text-gray-700">
                                {story.points} pts
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {features.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No features found</p>
          </div>
        )}
      </div>

      <StoryForm
        isOpen={isStoryFormOpen}
        onClose={() => setIsStoryFormOpen(false)}
        onSuccess={handleStorySuccess}
        story={editingStory}
      />

      <FeatureForm
        isOpen={isFeatureFormOpen}
        onClose={() => setIsFeatureFormOpen(false)}
        onSuccess={handleFeatureSuccess}
        feature={editingFeature}
        releaseId={id}
      />
    </div>
  );
}
