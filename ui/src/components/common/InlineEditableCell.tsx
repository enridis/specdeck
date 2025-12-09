import { useState, useRef, useEffect } from 'react';
import { useAutocomplete } from '../../contexts/AutocompleteContext';

interface InlineEditableCellProps {
  value: string;
  onSave: (value: string) => void;
  type: 'assignee' | 'milestone';
  placeholder?: string;
}

export function InlineEditableCell({ value, onSave, type, placeholder = '-' }: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { assignees, milestones, addAssignee, addMilestone } = useAutocomplete();

  const suggestions = type === 'assignee' ? assignees : milestones;
  const addNew = type === 'assignee' ? addAssignee : addMilestone;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editValue) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(editValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
    setHighlightedIndex(0);
  }, [editValue, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && !suggestions.includes(trimmedValue)) {
      addNew(trimmedValue);
    }
    onSave(trimmedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const showDropdown = filteredSuggestions.length > 0 || (editValue.trim() && !suggestions.includes(editValue));
    const totalItems = filteredSuggestions.length + (editValue.trim() && !filteredSuggestions.includes(editValue) ? 1 : 0);

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (showDropdown && highlightedIndex < filteredSuggestions.length) {
          setEditValue(filteredSuggestions[highlightedIndex]);
          setTimeout(handleSave, 0);
        } else {
          handleSave();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCancel();
        break;
      case 'ArrowDown':
        if (showDropdown) {
          e.preventDefault();
          setHighlightedIndex(prev => (prev + 1) % totalItems);
        }
        break;
      case 'ArrowUp':
        if (showDropdown) {
          e.preventDefault();
          setHighlightedIndex(prev => (prev - 1 + totalItems) % totalItems);
        }
        break;
    }
  };

  const handleSelect = (suggestion: string) => {
    setEditValue(suggestion);
    setTimeout(() => {
      onSave(suggestion);
      setIsEditing(false);
    }, 0);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-left text-sm text-gray-900 hover:text-blue-600 hover:underline focus:outline-none w-full"
      >
        {value || <span className="text-gray-400">{placeholder}</span>}
      </button>
    );
  }

  const showDropdown = filteredSuggestions.length > 0 || (editValue.trim() && !suggestions.includes(editValue));

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder={placeholder}
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
          {editValue.trim() && !filteredSuggestions.includes(editValue) && (
            <button
              onClick={() => handleSelect(editValue)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-t border-gray-200 ${
                highlightedIndex === filteredSuggestions.length ? 'bg-blue-50' : ''
              }`}
            >
              <span className="text-green-600">+ Add "{editValue}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
