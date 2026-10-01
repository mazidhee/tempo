import { Modal } from './ui';
import { useState } from 'react';

interface NoteModalProps {
  habitName: string;
  onSave: (note: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function NoteModal({ habitName, onSave, onSkip, onClose }: NoteModalProps) {
  const [note, setNote] = useState('');

  return (
    <Modal title={'Add a Note'} onClose={onClose}>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Optional note for{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{habitName}</span>
        </p>

        <textarea
          aria-label="Habit note"
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
          <button onClick={() => onSave(note)} className="btn-primary">
            Save Note
          </button>
        </div>
      </div>
    </Modal>
  );
}
