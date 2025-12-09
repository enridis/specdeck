import { useState, useRef, useEffect } from 'react';

interface InlineEditableNumberProps {
  value: number | undefined;
  onSave: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
}

export function InlineEditableNumber({ value, onSave, placeholder = '-', min, max }: InlineEditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = editValue.trim() === '' ? undefined : Number(editValue);
    
    if (numValue !== undefined) {
      if (isNaN(numValue)) {
        alert('Please enter a valid number');
        return;
      }
      if (min !== undefined && numValue < min) {
        alert(`Value must be at least ${min}`);
        return;
      }
      if (max !== undefined && numValue > max) {
        alert(`Value must be at most ${max}`);
        return;
      }
    }
    
    onSave(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-left text-sm text-gray-900 hover:text-blue-600 hover:underline focus:outline-none w-full"
      >
        {value !== undefined ? value : <span className="text-gray-400">{placeholder}</span>}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSave}
      min={min}
      max={max}
      className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder={placeholder}
    />
  );
}
