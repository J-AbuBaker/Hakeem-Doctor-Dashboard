import { useState, useMemo } from 'react';
import { Diagnosis } from '../../../types/medicalRecords';
import { MAX_DIAGNOSES_VISIBLE } from '../components/constants';
import { sortDiagnosesByProbability } from '../utils/diagnosisUtils';

export const useDiagnosisVisibility = (diagnoses: Diagnosis[]) => {
  const [showAll, setShowAll] = useState(false);

  const sortedDiagnoses = useMemo(() => {
    return sortDiagnosesByProbability(diagnoses);
  }, [diagnoses]);

  const visibleDiagnoses = useMemo(() => {
    if (showAll || sortedDiagnoses.length <= MAX_DIAGNOSES_VISIBLE) {
      return sortedDiagnoses;
    }
    return sortedDiagnoses.slice(0, MAX_DIAGNOSES_VISIBLE);
  }, [sortedDiagnoses, showAll]);

  const toggleVisibility = () => {
    setShowAll(prev => !prev);
  };

  return {
    sortedDiagnoses,
    visibleDiagnoses,
    showAll,
    toggleVisibility,
  };
};

