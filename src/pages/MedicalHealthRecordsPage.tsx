import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DoctorSidebar from '@features/dashboard/components/DoctorSidebar';
import PatientList from '@features/medicalRecords/components/PatientList';
import PatientProfileCard from '@features/medicalRecords/components/PatientProfileCard';
import InterviewRecord from '@features/medicalRecords/components/InterviewRecord';
import MedicalRecordsSummary from '@features/medicalRecords/components/MedicalRecordsSummary';
import { useAppointments } from '@app/providers';
import { MedicalRecordsService } from '@features/medicalRecords/services';
import { MedicalInterview, RiskFactorResponse } from '../types/medicalRecords';
import { FileSearch, Loader2, AlertCircle, ClipboardCheck, Users, ArrowUpDown } from 'lucide-react';
import { sortInterviews, getSortLabel, getNextSortOption, InterviewSortOption } from '@features/medicalRecords/utils/interviewSortUtils';
import './DashboardPage.css';

const MedicalHealthRecordsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [interviews, setInterviews] = useState<MedicalInterview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskFactors, setRiskFactors] = useState<RiskFactorResponse[]>([]);
  const [isLoadingRiskFactors, setIsLoadingRiskFactors] = useState(false);
  const [riskFactorsError, setRiskFactorsError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<InterviewSortOption>('date-desc');
  const { appointments = [], fetchAppointments } = useAppointments();

  const fetchPatientInterviews = useCallback(async (patientId: string) => {
    setIsLoadingInterviews(true);
    setError(null);
    try {
      const data = await MedicalRecordsService.getPatientInterviews(patientId);
      setInterviews(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medical records';
      setError(errorMessage);
      setInterviews([]);
    } finally {
      setIsLoadingInterviews(false);
    }
  }, []);

  const fetchPatientRiskFactors = useCallback(async (patientId: string) => {
    setIsLoadingRiskFactors(true);
    setRiskFactorsError(null);
    try {
      const data = await MedicalRecordsService.getPatientRiskFactors(patientId);
      setRiskFactors(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch risk factors';
      setRiskFactorsError(errorMessage);
      setRiskFactors([]);
    } finally {
      setIsLoadingRiskFactors(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientInterviews(selectedPatientId);
      fetchPatientRiskFactors(selectedPatientId);
    } else {
      setInterviews([]);
      setRiskFactors([]);
    }
  }, [selectedPatientId, fetchPatientInterviews, fetchPatientRiskFactors]);

  const handlePatientSelect = useCallback((patientId: string, patientName: string) => {
    setSelectedPatientId(patientId);
    setSelectedPatientName(patientName);
  }, []);

  const sortedInterviews = useMemo(() => {
    return sortInterviews(interviews, sortOption);
  }, [interviews, sortOption]);

  const sortLabel = useMemo(() => {
    return getSortLabel(sortOption);
  }, [sortOption]);

  const handleSortChange = useCallback(() => {
    setSortOption(getNextSortOption(sortOption));
  }, [sortOption]);


  return (
    <div className="dashboard-layout">
      <DoctorSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                <FileSearch className="header-icon" />
                Medical Health Records
              </h1>
              <p className="dashboard-subtitle">
                View patient medical records, interview history, and risk factors
              </p>
            </div>
          </div>

          <div className="medical-records-layout">
            {/* Patient List Sidebar */}
            <div className="medical-records-sidebar">
              <PatientList
                appointments={appointments || []}
                selectedPatientId={selectedPatientId}
                onPatientSelect={handlePatientSelect}
              />
            </div>

            {/* Main Content Area */}
            <div className="medical-records-content">
              {!selectedPatientId ? (
                <div className="medical-records-empty">
                  <Users size={64} className="empty-icon" />
                  <h2>Select a Patient</h2>
                  <p>Choose a patient from the list to view their medical health records</p>
                </div>
              ) : (
                <>
                  {/* Medical Records Summary */}
                  <MedicalRecordsSummary
                    interviews={interviews}
                    riskFactorsCount={riskFactors.length}
                    patientName={selectedPatientName}
                  />

                  {/* Patient Profile Card */}
                  <PatientProfileCard
                    patientName={selectedPatientName}
                    riskFactors={riskFactors}
                    isLoading={isLoadingRiskFactors}
                    error={riskFactorsError}
                  />

                  {/* Interviews Section */}
                  <div className="interviews-section">
                    <div className="interviews-section-header">
                      <h3 className="interviews-section-title">Medical Interviews</h3>
                      {interviews.length > 1 && (
                        <button
                          className="interviews-sort-button"
                          onClick={handleSortChange}
                          aria-label={`Sort by ${sortLabel}`}
                          title={`Sort by ${sortLabel}`}
                        >
                          <ArrowUpDown size={16} />
                          <span>{sortLabel}</span>
                        </button>
                      )}
                    </div>

                    {isLoadingInterviews ? (
                      <div className="loading-state">
                        <Loader2 className="spinner-large" />
                        <p>Loading medical records...</p>
                      </div>
                    ) : error ? (
                      <div className="error-state">
                        <AlertCircle size={48} className="error-icon" />
                        <h3>Error Loading Records</h3>
                        <p>{error}</p>
                        <button
                          className="btn btn-primary"
                          onClick={() => selectedPatientId && fetchPatientInterviews(selectedPatientId)}
                        >
                          Retry
                        </button>
                      </div>
                    ) : interviews.length === 0 ? (
                      <div className="empty-state">
                        <ClipboardCheck size={48} className="empty-icon" />
                        <h3>No Medical Records Found</h3>
                        <p>This patient has no medical interview records available.</p>
                      </div>
                    ) : (
                      <div className="interviews-list">
                        {sortedInterviews.map((interview) => (
                          <InterviewRecord key={interview.interview_id} interview={interview} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalHealthRecordsPage;

