import { EMERGENCY_KEYWORDS } from '../components/constants';

export const isEmergencyTriage = (triage: string): boolean => {
  const normalizedTriage = triage.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword =>
    normalizedTriage.includes(keyword)
  );
};

export const formatTriageText = (triage: string): string => {
  return triage.replace(/_/g, ' ');
};

