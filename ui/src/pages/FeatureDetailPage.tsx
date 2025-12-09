import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFeature, useStories, useStats } from '../hooks/useData';
import { api } from '../services/api.service';
import { StoryForm } from '../components/stories/StoryForm';
import { InlineEditableCell } from '../components/common/InlineEditableCell';
import { InlineEditableSelect } from '../components/common/InlineEditableSelect';
import { InlineEditableNumber } from '../components/common/InlineEditableNumber';
import type { Story } from '../types';

export function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: feature, loading, error } = useFeature(id);
  const { data: stories, refetch: refetchStories } = useStories({ feature: id });
  const { data: stats } = useStats('feature', id);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | undefined>();

  const handleCreateStory = () => {
    setEditingStory(undefined);
    setIsStoryFormOpen(true);
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setIsStoryFormOpen(true);
  };

  const handleStorySuccess = () => {
    setIsStoryFormOpen(false);
    setEditingStory(undefined);
    refetchStories();
  };

  const handleFieldUpdate = async (storyId: string, field: 'assignee' | 'milestone', value: string) => {
    try {
      await api.stories.update(storyId, { [field]: value });
      refetchStories();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(`Error updating ${field}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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

  const handleComplexityUpdate = async (storyId: string, complexity: string) => {
    try {
      await api.stories.update(storyId, { complexity: complexity as any });
      refetchStories();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(`Error updating complexity: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handlePointsUpdate = async (storyId: string, points: number | undefined) => {
    try {
      await api.stories.update(storyId, { points });
      refetchStories();
    } catch (err) {
      console.error('Error updating story:', err);
      alert(`Error updating points: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  if (!feature) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Feature not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link to="/features" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Features
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{feature.title}</h1>
        {feature.description && <p className="text-gray-600 mt-4">{feature.description}</p>}
        {feature.release && (
          <div className="mt-4">
            <Link
              to={`/releases/${feature.release}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Release: {feature.release}
            </Link>
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
          <h2 className="text-2xl font-semibold text-gray-900">Stories</h2>
          <button
            onClick={handleCreateStory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            New Story
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Story
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complexity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Milestone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stories.map((story) => (
                <tr 
                  key={story.id} 
                  className="hover:bg-gray-50 border-l-4"
                  style={{
                    borderLeftColor: 
                      story.status === 'done' ? '#10b981' :
                      story.status === 'in_progress' ? '#3b82f6' :
                      story.status === 'in_review' ? '#a855f7' :
                      story.status === 'blocked' ? '#ef4444' :
                      '#9ca3af'
                  }}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEditStory(story)}
                      className="text-left text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <div className="text-sm font-medium">{story.id}</div>
                      <div className="text-sm text-gray-500">{story.title}</div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4">
                    <InlineEditableSelect
                      value={story.complexity}
                      onSave={(value) => handleComplexityUpdate(story.id, value)}
                      options={[
                        { value: 'XS', label: 'XS - Extra Small' },
                        { value: 'S', label: 'S - Small' },
                        { value: 'M', label: 'M - Medium' },
                        { value: 'L', label: 'L - Large' },
                        { value: 'XL', label: 'XL - Extra Large' },
                      ]}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <InlineEditableNumber
                      value={story.points}
                      onSave={(value) => handlePointsUpdate(story.id, value)}
                      placeholder="-"
                      min={0}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <InlineEditableCell
                      value={story.assignee || ''}
                      onSave={(value) => handleFieldUpdate(story.id, 'assignee', value)}
                      type="assignee"
                      placeholder="Unassigned"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <InlineEditableCell
                      value={story.milestone || ''}
                      onSave={(value) => handleFieldUpdate(story.id, 'milestone', value)}
                      type="milestone"
                      placeholder="No milestone"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEditStory(story)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No stories found</p>
          </div>
        )}
      </div>

      <StoryForm
        isOpen={isStoryFormOpen}
        onClose={() => setIsStoryFormOpen(false)}
        onSuccess={handleStorySuccess}
        story={editingStory}
        featureId={id}
      />
    </div>
  );
}
