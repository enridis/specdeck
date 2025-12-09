import { useState, type FormEvent, useEffect } from 'react';
import { Modal } from '../Modal';
import { api } from '../../services/api.service';
import { useReleases } from '../../hooks/useData';
import type { Feature } from '../../types';

type FeatureStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

interface FeatureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  feature?: Feature;
  releaseId?: string;
}

export function FeatureForm({ isOpen, onClose, onSuccess, feature, releaseId }: FeatureFormProps) {
  const { data: releases } = useReleases();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: feature?.id || '',
    title: feature?.title || '',
    releaseId: feature?.release || releaseId || '',
    status: feature?.status || 'pending' as FeatureStatus,
    description: feature?.description || '',
    priority: '',
    owner: '',
  });

  useEffect(() => {
    if (feature) {
      setFormData({
        id: feature.id,
        title: feature.title,
        releaseId: feature.release || '',
        status: (feature.status as FeatureStatus) || 'pending',
        description: feature.description || '',
        priority: '',
        owner: '',
      });
    } else if (releaseId) {
      setFormData(prev => ({ ...prev, releaseId }));
    }
  }, [feature, releaseId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (feature) {
        // Update existing feature
        await api.features.update(feature.id, formData);
      } else {
        // Create new feature
        if (!formData.id) {
          setError('Feature ID is required');
          setLoading(false);
          return;
        }
        if (!formData.releaseId) {
          setError('Release is required');
          setLoading(false);
          return;
        }
        // Send data in the format expected by backend
        await api.features.create({
          id: formData.id,
          title: formData.title,
          description: formData.description,
          releaseId: formData.releaseId,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={feature ? 'Edit Feature' : 'Create Feature'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID {!feature && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            disabled={!!feature}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="FEAT-01"
            required={!feature}
          />
          <p className="mt-1 text-xs text-gray-500">
            Must match the markdown filename (e.g., FEAT-01)
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
            placeholder="Feature title"
            required
          />
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
                {release.title} {release.version ? `(v${release.version})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as FeatureStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <input
            type="text"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="high, medium, low"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
          <input
            type="text"
            value={formData.owner}
            onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Owner name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Feature description..."
          />
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
            {loading ? 'Saving...' : feature ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
