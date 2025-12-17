import { useState, useMemo, memo } from 'react';
import { subDays, subMonths, format, startOfDay, endOfDay } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import DatePicker from '../DatePicker';
import './DateRangeFilter.css';

export type DateRangePreset = '7days' | '30days' | 'custom' | null;

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[];
  disabled?: boolean;
  'aria-label'?: string;
}

const DateRangeFilter = memo<DateRangeFilterProps>(({
  value,
  onChange,
  presets = ['7days', '30days', 'custom'],
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const presetRanges = useMemo(() => {
    const today = endOfDay(new Date());
    return {
      '7days': {
        label: 'Past 7 Days',
        start: startOfDay(subDays(today, 6)),
        end: today,
      },
      '30days': {
        label: 'Past Month',
        start: startOfDay(subMonths(today, 1)),
        end: today,
      },
    };
  }, []);

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowCustomRange(true);
      setSelectedPreset('custom');
    } else if (preset && presetRanges[preset]) {
      const range = presetRanges[preset];
      onChange({
        start: range.start,
        end: range.end,
      });
      setSelectedPreset(preset);
      setShowCustomRange(false);
    }
  };

  const handleStartDateChange = (dateStr: string) => {
    const start = dateStr ? startOfDay(new Date(dateStr)) : null;
    onChange({
      ...value,
      start,
    });
  };

  const handleEndDateChange = (dateStr: string) => {
    const end = dateStr ? endOfDay(new Date(dateStr)) : null;
    onChange({
      ...value,
      end,
    });
  };

  const handleClear = () => {
    onChange({ start: null, end: null });
    setSelectedPreset(null);
    setShowCustomRange(false);
  };

  const formatDateForPicker = (date: Date | null): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const getMaxDate = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  const isPresetActive = (preset: DateRangePreset): boolean => {
    if (!preset || preset === 'custom') return false;
    const presetRange = presetRanges[preset];
    if (!presetRange || !value.start || !value.end) return false;

    return (
      format(value.start, 'yyyy-MM-dd') === format(presetRange.start, 'yyyy-MM-dd') &&
      format(value.end, 'yyyy-MM-dd') === format(presetRange.end, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="date-range-filter" aria-label={ariaLabel || 'Date range filter'}>
      <div className="date-range-presets">
        {presets.includes('7days') && (
          <button
            type="button"
            className={`date-range-preset-btn ${isPresetActive('7days') ? 'active' : ''}`}
            onClick={() => handlePresetSelect('7days')}
            disabled={disabled}
            aria-pressed={isPresetActive('7days')}
            aria-label="Filter: Past 7 days"
          >
            Past 7 Days
          </button>
        )}
        {presets.includes('30days') && (
          <button
            type="button"
            className={`date-range-preset-btn ${isPresetActive('30days') ? 'active' : ''}`}
            onClick={() => handlePresetSelect('30days')}
            disabled={disabled}
            aria-pressed={isPresetActive('30days')}
            aria-label="Filter: Past month"
          >
            Past Month
          </button>
        )}
        {presets.includes('custom') && (
          <button
            type="button"
            className={`date-range-preset-btn ${selectedPreset === 'custom' ? 'active' : ''}`}
            onClick={() => handlePresetSelect('custom')}
            disabled={disabled}
            aria-pressed={selectedPreset === 'custom'}
            aria-label="Custom date range"
          >
            Custom Range
          </button>
        )}
      </div>

      {showCustomRange && (
        <div className="date-range-custom">
          <div className="date-range-custom-header">
            <Calendar className="date-range-icon" size={18} aria-hidden="true" />
            <span className="date-range-custom-label">Custom Date Range</span>
            {(value.start || value.end) && (
              <button
                type="button"
                className="date-range-clear-btn"
                onClick={handleClear}
                aria-label="Clear date range"
                title="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="date-range-inputs">
            <div className="date-range-input-group">
              <label htmlFor="date-range-start" className="date-range-label">
                Start Date
              </label>
              <DatePicker
                value={formatDateForPicker(value.start)}
                onChange={handleStartDateChange}
                maxDate={formatDateForPicker(value.end || new Date())}
                placeholder="Select start date"
                disabled={disabled}
              />
            </div>
            <div className="date-range-input-group">
              <label htmlFor="date-range-end" className="date-range-label">
                End Date
              </label>
              <DatePicker
                value={formatDateForPicker(value.end)}
                onChange={handleEndDateChange}
                minDate={formatDateForPicker(value.start)}
                maxDate={getMaxDate()}
                placeholder="Select end date"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {value.start && value.end && !showCustomRange && (
        <div className="date-range-active">
          <span className="date-range-active-text">
            {format(value.start, 'MMM d, yyyy')} – {format(value.end, 'MMM d, yyyy')}
          </span>
          <button
            type="button"
            className="date-range-active-clear"
            onClick={handleClear}
            aria-label="Clear date range filter"
            title="Clear filter"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
});

DateRangeFilter.displayName = 'DateRangeFilter';

export default DateRangeFilter;
