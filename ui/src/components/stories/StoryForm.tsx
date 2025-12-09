import { useState, type FormEvent, useEffect } from 'react';
import { Modal } from '../Modal';
import { api } from '../../services/api.service';
import { useFeatures, useReleases } from '../../hooks/useData';
import { useAutocomplete } from '../../contexts/AutocompleteContext';
import { AutocompleteInput } from '../common/AutocompleteInput';
import type { Story, StoryStatus, StoryComplexity } from '../../types';

interface StoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  story?: Story;
  featureId?: string;
}

export function StoryForm({ isOpen, onClose, onSuccess, story, featureId }: StoryFormProps) {
  const { data: features } = useFeatures();
  const { data: releases } = useReleases();
  const { assignees, milestones, addAssignee, addMilestone } = useAutocomplete();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criteriaInput, setCriteriaInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formData, setFormData] = useState({
    id: story?.id || '',
    title: story?.title || '',
    featureId: story?.feature || featureId || '',
    releaseId: story?.release || '',
    status: story?.status || 'planned' as StoryStatus,
    complexity: story?.complexity || 'M' as StoryComplexity,
    description: story?.description || '',
    acceptanceCriteria: [] as string[],
    tags: story?.tags || [],
    assignee: story?.assignee || '',
    milestone: story?.milestone || '',
  });

  useEffect(() => {
    if (story) {
      setFormData({
        id: story.id,
        title: story.title,
        featureId: story.feature || '',
        releaseId: story.release || '',
        status: story.status,
        complexity: story.complexity || 'M',
        description: story.description || '',
        acceptanceCriteria: [],
        tags: story.tags || [],
        assignee: story.assignee || '',
        milestone: story.milestone || '',
      });
      setTagsInput(story.tags?.join(', ') || '');
    } else if (featureId) {
      setFormData(prev => ({ ...prev, featureId }));
    }
  }, [story, featureId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Map frontend fields to backend format
      const payload = {
        id: formData.id,
        title: formData.title,
        featureId: formData.featureId,
        releaseId: formData.releaseId,
        status: formData.status,
        complexity: formData.complexity,
        owner: formData.assignee, // Map assignee to owner
        milestone: formData.milestone,
        tags,
        description: formData.description,
      };

      if (story) {
        // Update existing story
        await api.stories.update(story.id, payload);
      } else {
        // Create new story
        if (!payload.id) {
          setError('Story ID is required');
          setLoading(false);
          return;
        }
        if (!payload.featureId) {
          setError('Feature is required');
          setLoading(false);
          return;
        }
        if (!payload.releaseId) {
          setError('Release is required');
          setLoading(false);
          return;
        }
        await api.stories.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  const addCriteria = () => {
    if (criteriaInput.trim()) {
      setFormData({
        ...formData,
        acceptanceCriteria: [...formData.acceptanceCriteria, criteriaInput.trim()],
      });
      setCriteriaInput('');
    }
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      acceptanceCriteria: formData.acceptanceCriteria.filter((_: string, i: number) => i !== index),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={story ? 'Edit Story' : 'Create Story'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID {!story && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            disabled={!!story}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="S-001"
            required={!story}
          />
          <p className="mt-1 text-xs text-gray-500">
            Story identifier (e.g., S-001, STORY-123)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Story title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Feature <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.featureId}
            onChange={(e) => setFormData({ ...formData, featureId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a feature...</option>
            {features.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {feature.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Release <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.releaseId}
            onChange={(e) => setFormData({ ...formData, releaseId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a release...</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StoryStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
            <select
              value={formData.complexity}
              onChange={(e) => setFormData({ ...formData, complexity: e.target.value as StoryComplexity })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="XS">XS - Extra Small</option>
              <option value="S">S - Small</option>
              <option value="M">M - Medium</option>
              <option value="L">L - Large</option>
              <option value="XL">XL - Extra Large</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Story description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AutocompleteInput
            label="Assignee"
            value={formData.assignee}
            onChange={(value) => setFormData({ ...formData, assignee: value })}
            suggestions={assignees}
            onAddNew={addAssignee}
            placeholder="Select or add assignee"
          />

          <AutocompleteInput
            label="Milestone"
            value={formData.milestone}
            onChange={(value) => setFormData({ ...formData, milestone: value })}
            suggestions={milestones}
            onAddNew={addMilestone}
            placeholder="Select or add milestone"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acceptance Criteria
          </label>
          <div className="space-y-2">
            {formData.acceptanceCriteria.map((criteria: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-50 rounded text-sm">
                  {criteria}
                </div>
                <button
                  type="button"
                  onClick={() => removeCriteria(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={criteriaInput}
                onChange={(e) => setCriteriaInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add acceptance criteria..."
              />
              <button
                type="button"
                onClick={addCriteria}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="frontend, api, urgent (comma-separated)"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : story ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
