import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useStories, useFeatures, useReleases } from '../hooks/useData';
import { StoryForm } from '../components/stories/StoryForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../services/api.service';
import { useAutocomplete } from '../contexts/AutocompleteContext';
import type { StoryStatus, StoryComplexity } from '../types';

export function StoriesPage() {
  const [statusFilter, setStatusFilter] = useState<StoryStatus | ''>('');
  const [complexityFilter, setComplexityFilter] = useState<StoryComplexity | ''>('');
  const [featureFilter, setFeatureFilter] = useState<string>('');
  const [releaseFilter, setReleaseFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: features } = useFeatures();
  const { data: releases } = useReleases();
  const { assignees } = useAutocomplete();

  const { data: allStories, loading, error, refetch } = useStories({
    status: statusFilter || undefined,
    complexity: complexityFilter || undefined,
    feature: featureFilter || undefined,
    release: releaseFilter || undefined,
  });

  // Client-side filter for assignee since backend might not support it
  const stories = assigneeFilter
    ? allStories.filter(story => story.assignee === assigneeFilter)
    : allStories;

  const handleDelete = async (id: string) => {
    await api.stories.delete(id);
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
        <h1 className="text-3xl font-bold text-gray-900">Stories</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          New Story
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StoryStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
            <select
              value={complexityFilter}
              onChange={(e) => setComplexityFilter(e.target.value as StoryComplexity | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Complexities</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Feature</label>
            <select
              value={featureFilter}
              onChange={(e) => setFeatureFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Features</option>
              {features.map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Release</label>
            <select
              value={releaseFilter}
              onChange={(e) => setReleaseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Releases</option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </div>
        </div>
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
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Release
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <Link to={`/stories/${story.id}`} className="text-blue-600 hover:text-blue-700">
                    <div className="text-sm font-medium">{story.id}</div>
                    <div className="text-sm text-gray-500">{story.title}</div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      story.status === 'done'
                        ? 'bg-green-100 text-green-800'
                        : story.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : story.status === 'in_review'
                        ? 'bg-purple-100 text-purple-800'
                        : story.status === 'blocked'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {story.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{story.complexity}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{story.points || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{story.feature || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{story.release || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{story.assignee || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingStory(story);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(story.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No stories found</p>
        </div>
      )}

      <StoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingStory(null);
        }}
        onSuccess={refetch}
        story={editingStory}
      />

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
