import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NoteModalProps {
  habitName: string;
  onSave: (note: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function NoteModal({ habitName, onSave, onSkip, onClose }: NoteModalProps) {
  const [note, setNote] = useState('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Add a Note
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Optional note for <span className="font-medium text-gray-700 dark:text-gray-300">{habitName}</span>
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How did it go? Any thoughts..."
          className="input h-24 resize-none mb-4"
          autoFocus
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onSkip} className="btn-secondary">
            Skip
          </button>
          <button
            onClick={() => onSave(note)}
            className="btn-primary"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
