import { ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
export function SearchHints({ action = 'Select' }: { action?: string }) {
  return (
    <div className="search-hints">
      <span>
        <kbd>
          <ArrowUp aria-label="Up arrow" />
        </kbd>
        <kbd>
          <ArrowDown aria-label="Down arrow" />
        </kbd>{' '}
        Navigate
      </span>
      <span>
        <kbd>
          <CornerDownLeft aria-label="Enter" />
        </kbd>{' '}
        {action}
      </span>
      <span>
        <kbd>Esc</kbd> Close
      </span>
    </div>
  );
}
