import { Modal } from './ui';
import { useState } from 'react';

interface MissedReasonModalProps {
  habitName: string;
  logDate: string;
  onSave: (reason: string) => void;
  onClose: () => void;
}

export default function MissedReasonModal({
  habitName,
  logDate,
  onSave,
  onClose,
}: MissedReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleSave = () => {
    if (reason.trim()) {
      onSave(reason.trim());
    }
  };

  return (
    <Modal title={'Why was this missed?'} onClose={onClose}>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            <span className="habit-name">{habitName}</span>
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{logDate}</p>

        <textarea
          aria-label="Missed reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What got in the way? Was busy, felt unwell, forgot..."
          className="input habit-name h-24 resize-none mb-4"
          autoFocus
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!reason.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Reason
          </button>
        </div>
      </div>
    </Modal>
  );
}
