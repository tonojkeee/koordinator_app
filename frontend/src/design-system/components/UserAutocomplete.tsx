import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Avatar } from './Avatar';

export interface AutocompleteUser {
  id: number;
  username: string;
  full_name?: string | null;
  email?: string;
  avatar_url?: string | null;
  rank?: string | null;
}

interface UserAutocompleteProps {
  label?: string;
  placeholder?: string;
  selectedUsers: AutocompleteUser[];
  onSelectionChange: (users: AutocompleteUser[]) => void;
  onSearch: (query: string) => Promise<AutocompleteUser[]>;
  disabled?: boolean;
  maxSelections?: number;
  className?: string;
}

export function UserAutocomplete({
  label,
  placeholder = "Поиск пользователей...",
  selectedUsers,
  onSelectionChange,
  onSearch,
  disabled = false,
  maxSelections,
  className = ""
}: UserAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await onSearch(query.trim());
        // Filter out already selected users
        const filtered = results.filter(user => 
          !selectedUsers.some(selected => selected.id === user.id)
        );
        setSuggestions(filtered);
        setIsOpen(filtered.length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedUsers, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleUserSelect = (user: AutocompleteUser) => {
    if (maxSelections && selectedUsers.length >= maxSelections) {
      return;
    }

    const newSelection = [...selectedUsers, user];
    onSelectionChange(newSelection);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Focus back to input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleUserRemove = (userId: number) => {
    const newSelection = selectedUsers.filter(user => user.id !== userId);
    onSelectionChange(newSelection);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleUserSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const displayName = (user: AutocompleteUser) => {
    return user.full_name || user.username;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[#242424] mb-2">
          {label}
        </label>
      )}

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-1.5 bg-[#F0F0F0] px-2 py-1 rounded border border-[#E0E0E0]"
            >
              <Avatar
                src={user.avatar_url}
                name={displayName(user)}
                size="xs"
              />
              <span className="text-xs font-medium text-[#5B5FC7]">
                {displayName(user)}
              </span>
              {!disabled && (
                <button
                  onClick={() => handleUserRemove(user.id)}
                  className="ml-1 text-[#5B5FC7] hover:text-[#4f52b2] transition-colors rounded-full hover:bg-[#E0E0E0] p-0.5"
                  type="button"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled || (maxSelections ? selectedUsers.length >= maxSelections : false)}
            autoFocus
            className="w-full px-4 py-2 pl-9 pr-9 border border-[#E0E0E0] rounded-md focus:outline-none focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all disabled:bg-[#F5F5F5] disabled:text-[#616161] text-sm text-[#242424] placeholder-[#616161]"
          />
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161]"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[#5B5FC7] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isLoading && isOpen && (
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161]"
            />
          )}
        </div>

        {/* Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-[#E0E0E0] rounded-md shadow-md max-h-60 overflow-y-auto"
          >
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelect(user)}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-[#F5F5F5] transition-colors ${
                  index === highlightedIndex ? 'bg-[#F5F5F5]' : ''
                }`}
              >
                <Avatar
                  src={user.avatar_url}
                  name={displayName(user)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#242424]">
                    {displayName(user)}
                  </div>
                  {user.email && (
                    <div className="text-xs text-[#616161]">
                      {user.email}
                    </div>
                  )}
                  {user.rank && (
                    <div className="text-[10px] text-[#616161] uppercase tracking-wide mt-0.5">
                      {user.rank}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      {maxSelections && (
        <div className="mt-1 text-xs text-[#616161]">
          {selectedUsers.length} / {maxSelections} выбрано
        </div>
      )}
    </div>
  );
}