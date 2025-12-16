import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatWeekRange } from '../../utils/weekUtils';
import './WeekNavigation.css';

interface WeekNavigationProps {
  weekStart: Date;
  weekEnd: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onGoToCurrentWeek?: () => void;
  showCurrentWeekButton?: boolean;
  isCurrentWeek?: boolean;
}

const WeekNavigation = memo<WeekNavigationProps>(({
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  canGoPrevious,
  canGoNext,
  onGoToCurrentWeek,
  showCurrentWeekButton = false,
  isCurrentWeek = false,
}) => {
  const weekRange = formatWeekRange(weekStart, weekEnd);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="week-navigation" role="toolbar" aria-label="Week navigation">
      <button
        className="week-nav-button week-nav-prev"
        onClick={onPreviousWeek}
        onKeyDown={(e) => handleKeyDown(e, onPreviousWeek)}
        disabled={!canGoPrevious}
        aria-label="Previous week"
        title="Previous week (←)"
      >
        <ChevronLeft size={20} aria-hidden="true" />
        <span className="week-nav-button-label">Previous</span>
      </button>

      <div className="week-navigation-center">
        <Calendar className="week-nav-icon" size={18} aria-hidden="true" />
        <div className="week-range-display">
          <span className="week-range-text">{weekRange}</span>
          {isCurrentWeek && (
            <span className="week-current-badge" aria-label="Current week">
              Current
            </span>
          )}
        </div>
      </div>

      {showCurrentWeekButton && !isCurrentWeek && onGoToCurrentWeek && (
        <button
          className="week-nav-button week-nav-current"
          onClick={onGoToCurrentWeek}
          onKeyDown={(e) => handleKeyDown(e, onGoToCurrentWeek)}
          aria-label="Go to current week"
          title="Go to current week"
        >
          <span className="week-nav-button-label">Today</span>
        </button>
      )}

      {canGoNext && (
        <button
          className="week-nav-button week-nav-next"
          onClick={onNextWeek}
          onKeyDown={(e) => handleKeyDown(e, onNextWeek)}
          aria-label="Next week"
          title="Next week (→)"
        >
          <span className="week-nav-button-label">Next</span>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

WeekNavigation.displayName = 'WeekNavigation';

export default WeekNavigation;
