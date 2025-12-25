import { Diagnosis } from '../../../types/medicalRecords';
import { PROBABILITY_THRESHOLDS } from '../components/constants';

export interface ProbabilityStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  severity: 'High' | 'Medium' | 'Low';
}

export const getProbabilityStyle = (probability: number): ProbabilityStyle => {
  if (probability >= PROBABILITY_THRESHOLDS.HIGH) {
    return {
      color: 'var(--danger)',
      bgColor: 'var(--danger-lighter)',
      borderColor: 'var(--danger-light)',
      severity: 'High'
    };
  }
  if (probability >= PROBABILITY_THRESHOLDS.MEDIUM) {
    return {
      color: 'var(--warning)',
      bgColor: 'var(--warning-lighter)',
      borderColor: 'var(--warning-light)',
      severity: 'Medium'
    };
  }
  return {
    color: 'var(--text-tertiary)',
    bgColor: 'var(--gray-100)',
    borderColor: 'var(--gray-300)',
    severity: 'Low'
  };
};

export const formatProbability = (probability: number): string => {
  return `${(probability * 100).toFixed(1)}%`;
};

export const sortDiagnosesByProbability = (diagnoses: Diagnosis[]): Diagnosis[] => {
  return [...diagnoses].sort((a, b) => b.probability - a.probability);
};

export const getMaxDiagnosisProbability = (diagnoses: Diagnosis[]): number => {
  if (diagnoses.length === 0) return 0;
  return Math.max(...diagnoses.map(d => d.probability));
};

