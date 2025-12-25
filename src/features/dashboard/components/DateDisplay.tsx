import React from 'react';
import { Calendar } from 'lucide-react';
import './DateDisplay.css';

const DateDisplay: React.FC = () => {
  const today = new Date();
  
  // Get full date string (e.g., "Monday, December 15, 2025")
  const fullDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="date-display-container">
      <div className="date-display-card">
        <div className="date-icon-wrapper">
          <Calendar className="date-icon" size={22} />
        </div>
        <div className="date-content">
          <div className="date-label">Today</div>
          <div className="date-full">{fullDate}</div>
        </div>
      </div>
    </div>
  );
};

export default DateDisplay;

