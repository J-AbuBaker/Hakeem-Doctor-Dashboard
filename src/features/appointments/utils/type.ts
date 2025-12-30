/**
 * Appointment type utility functions
 */
import {
  Briefcase,
  MessageCircle,
  RotateCcw,
  Activity,
  LucideIcon
} from 'lucide-react';

export type AppointmentTypeValue = 'checkup' | 'consultation' | 'followup' | 'emergency';

export interface AppointmentTypeOption {
  value: AppointmentTypeValue;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Appointment type options with icons and descriptions
 */
export const APPOINTMENT_TYPES: AppointmentTypeOption[] = [
  {
    value: 'checkup',
    label: 'Checkup',
    description: 'Routine health check',
    icon: Briefcase,
  },
  {
    value: 'consultation',
    label: 'Consultation',
    description: 'Medical advice',
    icon: MessageCircle,
  },
  {
    value: 'followup',
    label: 'Follow Up',
    description: 'Post-treatment visit',
    icon: RotateCcw,
  },
  {
    value: 'emergency',
    label: 'Emergency',
    description: 'Urgent care',
    icon: Activity,
  },
];

/**
 * Default appointment type
 */
export const DEFAULT_APPOINTMENT_TYPE: AppointmentTypeValue = 'checkup';

/**
 * Gets the appointment type option for a given value
 * @param value - Appointment type value
 * @returns Appointment type option or default
 */
export function getAppointmentTypeOption(value: string | null | undefined): AppointmentTypeOption {
  const normalizedValue = value?.toLowerCase();
  return APPOINTMENT_TYPES.find(type => type.value === normalizedValue) || APPOINTMENT_TYPES[0];
}

/**
 * Gets the icon component for an appointment type
 * @param appointmentType - Appointment type string
 * @returns Icon component
 */
export function getAppointmentTypeIcon(appointmentType: string | null | undefined): LucideIcon {
  return getAppointmentTypeOption(appointmentType).icon;
}

/**
 * Gets the formatted label for an appointment type
 * @param appointmentType - Appointment type string
 * @returns Formatted label
 */
export function getAppointmentTypeLabel(appointmentType: string | null | undefined): string {
  if (!appointmentType) {
    return getAppointmentTypeOption(DEFAULT_APPOINTMENT_TYPE).label;
  }
  return getAppointmentTypeOption(appointmentType).label;
}

