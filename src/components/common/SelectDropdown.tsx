import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Search, LucideIcon } from 'lucide-react';
import './SelectDropdown.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

interface SelectDropdownProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  icon?: LucideIcon;
  searchable?: boolean;
  emptyMessage?: string;
  showClear?: boolean;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  groups,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  icon: Icon,
  searchable = false,
  emptyMessage = 'No options available',
  showClear = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Flatten groups to options for finding selected value
  const allOptions = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap(group => group.options);
    }
    if (options && options.length > 0) {
      return options;
    }
    return [];
  }, [groups, options]);

  // Filter options/groups based on search term
  const getFilteredData = () => {
    if (!searchable || !searchTerm) {
      // When not searching, return the original options/groups
      if (groups && groups.length > 0) {
        return { options: null, groups };
      }
      if (options && options.length > 0) {
        return { options, groups: null };
      }
      return { options: null, groups: null };
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    if (groups && groups.length > 0) {
      const filteredGroups = groups
        .map(group => ({
          ...group,
          options: group.options.filter(option =>
            option.label.toLowerCase().includes(lowerSearchTerm)
          ),
        }))
        .filter(group => group.options.length > 0);

      return { options: null, groups: filteredGroups };
    } else if (options && options.length > 0) {
      const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(lowerSearchTerm)
      );
      return { options: filteredOptions, groups: null };
    }

    return { options: null, groups: null };
  };

  const filteredData = getFilteredData();

  // Get selected option label - normalize both values to strings for comparison
  const displayValue = useMemo(() => {
    if (!value || value === '') return '';

    const normalizedValue = String(value).trim();
    const selectedOption = allOptions.find(option => {
      const normalizedOptionValue = String(option.value).trim();
      return normalizedOptionValue === normalizedValue;
    });

    return selectedOption ? selectedOption.label : '';
  }, [value, allOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, searchable]);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    onBlur?.();
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    onBlur?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="select-dropdown-wrapper" ref={dropdownRef}>
      <div
        className={`input-wrapper select-dropdown-input-wrapper ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={`${id}-dropdown`}
        tabIndex={disabled ? -1 : 0}
      >
        {Icon && <Icon className="input-icon" size={18} />}
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          className={`select-dropdown-input ${error ? 'error' : ''}`}
          disabled={disabled}
          aria-label={placeholder}
        />
        {value && !disabled && showClear && (
          <button
            type="button"
            className="select-dropdown-clear"
            onClick={handleClear}
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown className={`select-dropdown-chevron ${isOpen ? 'open' : ''}`} size={18} />
      </div>

      {isOpen && !disabled && (
        <div className="select-dropdown-menu" id={`${id}-dropdown`} role="listbox">
          {searchable && (
            <div className="select-dropdown-search">
              <Search className="select-dropdown-search-icon" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                className="select-dropdown-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className="select-dropdown-options">
            {filteredData.groups ? (
              filteredData.groups.length === 0 ? (
                <div className="select-dropdown-empty">{emptyMessage}</div>
              ) : (
                filteredData.groups.map((group, groupIndex) => (
                  <div key={`group-${groupIndex}`} className="select-dropdown-group">
                    <div className="select-dropdown-group-header">{group.label}</div>
                    {group.options.map((option) => (
                      <div
                        key={option.value}
                        className={`select-dropdown-option ${value === option.value ? 'selected' : ''}`}
                        onClick={() => handleSelect(option.value)}
                        role="option"
                        aria-selected={value === option.value}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                ))
              )
            ) : filteredData.options ? (
              filteredData.options.length === 0 ? (
                <div className="select-dropdown-empty">{emptyMessage}</div>
              ) : (
                filteredData.options.map((option) => (
                  <div
                    key={option.value}
                    className={`select-dropdown-option ${value === option.value ? 'selected' : ''}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    {option.label}
                  </div>
                ))
              )
            ) : (
              <div className="select-dropdown-empty">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;
