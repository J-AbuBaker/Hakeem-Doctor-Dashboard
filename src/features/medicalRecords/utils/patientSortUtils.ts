export type PatientSortOption = 'name-asc' | 'name-desc' | 'recent';

export interface Patient {
  id: string;
  name: string;
  lastAppointmentDate?: Date;
  appointmentCount: number;
}

export const sortPatients = (
  patients: Patient[],
  sortOption: PatientSortOption
): Patient[] => {
  const sorted = [...patients].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'recent': {
        const aDate = a.lastAppointmentDate?.getTime() || 0;
        const bDate = b.lastAppointmentDate?.getTime() || 0;
        return bDate - aDate;
      }
      default:
        return 0;
    }
  });
  return sorted;
};

export const getPatientSortLabel = (sortOption: PatientSortOption): string => {
  switch (sortOption) {
    case 'name-asc': return 'Name (A-Z)';
    case 'name-desc': return 'Name (Z-A)';
    case 'recent': return 'Recent First';
    default: return 'Sort';
  }
};

export const getNextPatientSortOption = (currentOption: PatientSortOption): PatientSortOption => {
  const options: PatientSortOption[] = ['name-asc', 'name-desc', 'recent'];
  const currentIndex = options.indexOf(currentOption);
  const nextIndex = (currentIndex + 1) % options.length;
  return options[nextIndex];
};

