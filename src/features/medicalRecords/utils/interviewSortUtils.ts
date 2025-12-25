import { MedicalInterview } from '../../../types/medicalRecords';
import { getMaxDiagnosisProbability } from './diagnosisUtils';

export type InterviewSortOption = 'date-desc' | 'date-asc' | 'diagnosis-probability' | 'symptoms-count';

export const sortInterviews = (
  interviews: MedicalInterview[],
  sortOption: InterviewSortOption
): MedicalInterview[] => {
  const sorted = [...interviews].sort((a, b) => {
    switch (sortOption) {
      case 'date-desc':
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
      case 'date-asc':
        return new Date(a.started_at).getTime() - new Date(b.started_at).getTime();
      case 'diagnosis-probability': {
        const aMaxProb = getMaxDiagnosisProbability(a.diagnoses);
        const bMaxProb = getMaxDiagnosisProbability(b.diagnoses);
        return bMaxProb - aMaxProb;
      }
      case 'symptoms-count':
        return b.symptoms.length - a.symptoms.length;
      default:
        return 0;
    }
  });
  return sorted;
};

export const getSortLabel = (sortOption: InterviewSortOption): string => {
  switch (sortOption) {
    case 'date-desc': return 'Newest First';
    case 'date-asc': return 'Oldest First';
    case 'diagnosis-probability': return 'Highest Probability';
    case 'symptoms-count': return 'Most Symptoms';
    default: return 'Sort';
  }
};

export const getNextSortOption = (currentOption: InterviewSortOption): InterviewSortOption => {
  const options: InterviewSortOption[] = ['date-desc', 'date-asc', 'diagnosis-probability', 'symptoms-count'];
  const currentIndex = options.indexOf(currentOption);
  const nextIndex = (currentIndex + 1) % options.length;
  return options[nextIndex];
};

