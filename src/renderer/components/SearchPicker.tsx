import { useMemo, useState } from 'react';
import { Check, Search, ChevronDown } from 'lucide-react';
import { Modal } from './ui';
import { Button } from './ui/button';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from './ui/command';
import { pickerPageSize, searchOptions, type PickerOption } from '../../shared/picker';
import './search-picker.css';
import { SearchHints } from './SearchHints';
/** A shared keyboard-searchable picker for large, local collections. */
export function SearchPicker({
  label,
  value,
  options,
  onChange,
  emptyLabel = 'Choose an item',
  disabled = false,
  allowClear = false,
  clearLabel = 'None',
  selectedLabel,
  className = '',
}: {
  label: string;
  value: string;
  options: PickerOption[];
  onChange: (value: string) => void;
  emptyLabel?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  selectedLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [group, setGroup] = useState(''),
    [page, setPage] = useState(0);
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => searchOptions(options, query, group), [options, query, group]);
  const pages = Math.max(1, Math.ceil(filtered.length / pickerPageSize));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * pickerPageSize, (currentPage + 1) * pickerPageSize);
  const groups = [...new Map(options.map((o) => [o.group, o.groupLabel])).entries()];
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
  };
  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={`search-picker-trigger ${className}`}
        disabled={disabled}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setQuery('');
          setGroup('');
          setPage(0);
          setOpen(true);
        }}
      >
        <Search />
        <span>{selected?.label || selectedLabel || emptyLabel}</span>
        <ChevronDown />
      </Button>
      {open && (
        <Modal title={label} variant="search" onClose={() => setOpen(false)}>
          <Command shouldFilter={false} className="search-picker-command">
            <CommandInput
              autoFocus
              placeholder="Search topics, chapters, tasks…"
              aria-label={`Search ${label.toLowerCase()}`}
              value={query}
              onValueChange={(next) => {
                setQuery(next);
                setPage(0);
              }}
            />
            <label className="search-picker-filter">
              Filter by
              <select
                className="input"
                aria-label="Filter collection"
                value={group}
                onChange={(e) => {
                  setGroup(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All collections</option>
                {groups.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <CommandList className="search-picker-list" aria-label="Search results">
              {allowClear && !query && !group && currentPage === 0 && (
                <CommandItem value="__none" onSelect={() => choose('')}>
                  <span>{clearLabel}</span>
                  {!value && <Check />}
                </CommandItem>
              )}
              <CommandEmpty>No matches. Try another word or collection.</CommandEmpty>
              {visible.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => choose(option.value)}
                >
                  <div>
                    <strong>{option.label}</strong>
                    <small>{option.description || option.groupLabel}</small>
                  </div>
                  {value === option.value && <Check />}
                </CommandItem>
              ))}
            </CommandList>
            <div className="search-picker-footer">
              <span role="status">
                {filtered.length} matches · Page {currentPage + 1} of {pages}
              </span>
              <div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={currentPage + 1 >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Command>
          <SearchHints />
        </Modal>
      )}
    </>
  );
}
