import { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { useAppContext } from '../contexts/AppContext';
import type { Story } from '../types';

interface JiraMapping {
  storyId: string;
  jiraTicket: string;
}

interface Overlay {
  featureId: string;
  jiraMappings: JiraMapping[];
}

export function OverlaysPage() {
  const { isCoordinatorMode, jiraBaseUrl } = useAppContext();
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [storySearchTerm, setStorySearchTerm] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryDropdown, setShowStoryDropdown] = useState(false);
  const [newJiraTicket, setNewJiraTicket] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCoordinatorMode) {
      setError('Overlays feature is only available in coordinator mode');
      setIsLoading(false);
      return;
    }

    loadData();
  }, [isCoordinatorMode]);

  useEffect(() => {
    // Filter stories based on search term
    if (storySearchTerm.trim() === '') {
      setFilteredStories([]);
    } else {
      const term = storySearchTerm.toLowerCase();
      const filtered = allStories.filter(
        (story) =>
          story.id.toLowerCase().includes(term) ||
          story.title.toLowerCase().includes(term)
      );
      setFilteredStories(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [storySearchTerm, allStories]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overlaysData, storiesData] = await Promise.all([
        api.overlays.list(),
        api.stories.list(),
      ]);
      setOverlays(overlaysData);
      setAllStories(storiesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStory || !newJiraTicket) {
      setAddError('Story and Jira ticket are required');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    try {
      await api.overlays.addMapping(selectedStory.feature || selectedStory.id.split('-')[1], selectedStory.id, newJiraTicket);
      setStorySearchTerm('');
      setSelectedStory(null);
      setNewJiraTicket('');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add mapping';
      setAddError(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setStorySearchTerm(story.id);
    setShowStoryDropdown(false);
  };

  const handleStoryInputChange = (value: string) => {
    setStorySearchTerm(value);
    setSelectedStory(null);
    setShowStoryDropdown(true);
  };

  if (!isCoordinatorMode) {
    return (
      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800">
            Overlays feature is only available in coordinator mode. Initialize coordinator mode first.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading overlays...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Jira Overlays</h1>

        {/* Add New Mapping Form */}
        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Jira Mapping</h2>
          <form onSubmit={handleAddMapping} className="space-y-4">
            {addError && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">{addError}</p>
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Story
              </label>
              <input
                type="text"
                value={storySearchTerm}
                onChange={(e) => handleStoryInputChange(e.target.value)}
                onFocus={() => setShowStoryDropdown(true)}
                placeholder="Search by story ID or title..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
              {showStoryDropdown && filteredStories.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  {filteredStories.map((story) => (
                    <div
                      key={story.id}
                      className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                      onClick={() => handleStorySelect(story)}
                    >
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{story.id}</span>
                        <span className="ml-2 text-gray-500 truncate">{story.title}</span>
                      </div>
                      {story.feature && (
                        <div className="text-xs text-gray-400 mt-1">Feature: {story.feature}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {selectedStory && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{selectedStory.id}</span> - {selectedStory.title}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jira Ticket
              </label>
              <input
                type="text"
                value={newJiraTicket}
                onChange={(e) => setNewJiraTicket(e.target.value)}
                placeholder="e.g., PROJ-123"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isAdding || !selectedStory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add Mapping'}
              </button>
            </div>
          </form>
        </div>

        {/* Overlays List */}
        <div className="space-y-6">
          {overlays.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <p className="text-gray-600">No overlays yet. Create a feature and add Jira mappings.</p>
            </div>
          ) : (
            overlays.map((overlay) => (
              <div key={overlay.featureId} className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{overlay.featureId}</h3>

                {overlay.jiraMappings.length === 0 ? (
                  <p className="text-gray-600 text-sm">No Jira mappings yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Story ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Story Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jira Ticket
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {overlay.jiraMappings.map((mapping) => {
                          const story = allStories.find(s => s.id === mapping.storyId);
                          return (
                            <tr key={mapping.storyId}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {mapping.storyId}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {story?.title || <span className="text-gray-400 italic">Story not found</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                <a
                                  href={`${jiraBaseUrl}/browse/${mapping.jiraTicket}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  {mapping.jiraTicket}
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
