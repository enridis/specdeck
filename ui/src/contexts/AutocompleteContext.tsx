import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useStories } from '../hooks/useData';

interface AutocompleteContextType {
  assignees: string[];
  milestones: string[];
  addAssignee: (assignee: string) => void;
  addMilestone: (milestone: string) => void;
}

const AutocompleteContext = createContext<AutocompleteContextType | undefined>(undefined);

export function AutocompleteProvider({ children }: { children: ReactNode }) {
  const { data: stories } = useStories();
  const [assignees, setAssignees] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<string[]>([]);

  // Extract unique assignees and milestones from existing stories
  useEffect(() => {
    if (stories.length > 0) {
      const uniqueAssignees = Array.from(
        new Set(stories.map(s => s.assignee).filter((a): a is string => !!a))
      ).sort();
      
      const uniqueMilestones = Array.from(
        new Set(stories.map(s => s.milestone).filter((m): m is string => !!m))
      ).sort();

      setAssignees(uniqueAssignees);
      setMilestones(uniqueMilestones);
    }
  }, [stories]);

  const addAssignee = (assignee: string) => {
    const trimmed = assignee.trim();
    if (trimmed && !assignees.includes(trimmed)) {
      setAssignees(prev => [...prev, trimmed].sort());
    }
  };

  const addMilestone = (milestone: string) => {
    const trimmed = milestone.trim();
    if (trimmed && !milestones.includes(trimmed)) {
      setMilestones(prev => [...prev, trimmed].sort());
    }
  };

  return (
    <AutocompleteContext.Provider value={{ assignees, milestones, addAssignee, addMilestone }}>
      {children}
    </AutocompleteContext.Provider>
  );
}

export function useAutocomplete() {
  const context = useContext(AutocompleteContext);
  if (!context) {
    throw new Error('useAutocomplete must be used within AutocompleteProvider');
  }
  return context;
}
