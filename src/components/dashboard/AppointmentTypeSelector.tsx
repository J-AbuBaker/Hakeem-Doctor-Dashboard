import React from 'react';
import { APPOINTMENT_TYPES, AppointmentTypeValue, DEFAULT_APPOINTMENT_TYPE } from '../../utils/appointmentTypeUtils';
import './AppointmentTypeSelector.css';

interface AppointmentTypeSelectorProps {
  selectedType?: string | null;
  onTypeSelect: (type: AppointmentTypeValue) => void;
  disabled?: boolean;
}

const AppointmentTypeSelector: React.FC<AppointmentTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  disabled = false,
}) => {
  const normalizedSelected = selectedType?.toLowerCase() || DEFAULT_APPOINTMENT_TYPE;

  return (
    <div className="appointment-type-selector">
      <div className="appointment-type-grid">
        {APPOINTMENT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = normalizedSelected === type.value;

          return (
            <button
              key={type.value}
              type="button"
              className={`appointment-type-card ${isSelected ? 'selected' : ''}`}
              data-type={type.value}
              onClick={() => !disabled && onTypeSelect(type.value)}
              disabled={disabled}
              aria-label={`Select ${type.label} appointment type`}
            >
              <div className="appointment-type-icon-wrapper">
                <Icon className="appointment-type-icon" size={24} />
              </div>
              <div className="appointment-type-content">
                <span className="appointment-type-title">{type.label}</span>
                <span className="appointment-type-description">{type.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentTypeSelector;
