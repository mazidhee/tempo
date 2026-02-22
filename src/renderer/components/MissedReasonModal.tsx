import React, { useState } from 'react';
import { X } from 'lucide-react';

interface MissedReasonModalProps {
  habitName: string;
  logDate: string;
  onSave: (reason: string) => void;
  onClose: () => void;
}

export default function MissedReasonModal({ habitName, logDate, onSave, onClose }: MissedReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleSave = () => {
    if (reason.trim()) {
      onSave(reason.trim());
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Why was this missed?
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">{habitName}</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{logDate}</p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What got in the way? Was busy, felt unwell, forgot..."
          className="input h-24 resize-none mb-4"
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
    </div>
  );
}
