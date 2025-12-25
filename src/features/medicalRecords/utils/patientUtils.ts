import { Appointment } from '../../../types/appointment';
import { Patient } from './patientSortUtils';

export const extractPatientsFromAppointments = (appointments: Appointment[]): Patient[] => {
  const patientMap = new Map<string, Patient>();
  
  appointments.forEach((apt) => {
    if (apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot') {
      const existing = patientMap.get(apt.patientId);
      const aptDate = new Date(apt.date);
      
      if (!existing) {
        patientMap.set(apt.patientId, {
          id: apt.patientId,
          name: apt.patientName,
          lastAppointmentDate: aptDate,
          appointmentCount: 1,
        });
      } else {
        existing.appointmentCount++;
        if (!existing.lastAppointmentDate || aptDate > existing.lastAppointmentDate) {
          existing.lastAppointmentDate = aptDate;
        }
      }
    }
  });
  
  return Array.from(patientMap.values());
};

export const filterPatientsByName = (patients: Patient[], searchQuery: string): Patient[] => {
  if (!searchQuery.trim()) return patients;
  const query = searchQuery.toLowerCase();
  return patients.filter(patient => 
    patient.name.toLowerCase().includes(query)
  );
};

