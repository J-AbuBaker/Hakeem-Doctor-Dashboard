import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DoctorSidebar from '@features/dashboard/components/DoctorSidebar';
import PatientList from '@features/medicalRecords/components/PatientList';
import PatientProfileCard from '@features/medicalRecords/components/PatientProfileCard';
import InterviewRecord from '@features/medicalRecords/components/InterviewRecord';
import MedicalRecordsSummary from '@features/medicalRecords/components/MedicalRecordsSummary';
import { useAppointments } from '@app/providers';
import { MedicalRecordsService } from '@features/medicalRecords/services';
import { MedicalInterview, RiskFactorResponse } from '../types/medicalRecords';
import { ClipboardList, Loader2, AlertCircle, FileCheck, UserCheck, ArrowUpDown, ChevronRight, Home, HeartPulse, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { sortInterviews, getSortLabel, getNextSortOption, InterviewSortOption } from '@features/medicalRecords/utils/interviewSortUtils';
import { getInitials } from '@shared/utils/string';
import './DashboardPage.css';

const MedicalHealthRecordsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patientListCollapsed, setPatientListCollapsed] = useState(false);
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
          {/* Breadcrumb Navigation */}
          <nav className="medical-records-breadcrumb" aria-label="Breadcrumb">
            <a href="/dashboard" className="medical-records-breadcrumb-item">
              <Home size={16} />
              <span>Dashboard</span>
            </a>
            <ChevronRight size={16} className="medical-records-breadcrumb-separator" />
            <span className="medical-records-breadcrumb-item active">
              Medical Health Records
            </span>
            {selectedPatientName && (
              <>
                <ChevronRight size={16} className="medical-records-breadcrumb-separator" />
                <span className="medical-records-breadcrumb-item active">
                  {selectedPatientName}
                </span>
              </>
            )}
          </nav>

          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                <ClipboardList className="header-icon" />
                Medical Health Records
              </h1>
              <p className="dashboard-subtitle">
                {selectedPatientName 
                  ? `Viewing medical records for ${selectedPatientName}`
                  : 'View patient medical records, interview history, and risk factors'}
              </p>
            </div>
          </div>

          <div className={`medical-records-layout ${patientListCollapsed ? 'patient-list-collapsed' : ''}`}>
            {/* Patient List Panel - Collapsible */}
            <aside className={`medical-records-sidebar-panel ${patientListCollapsed ? 'collapsed' : ''}`}>
              <div className="patient-list-panel-header">
                <h2 className="patient-list-panel-title">Patient Directory</h2>
                <button
                  className="patient-list-collapse-button"
                  onClick={() => setPatientListCollapsed(!patientListCollapsed)}
                  aria-label={patientListCollapsed ? 'Expand patient list' : 'Collapse patient list'}
                  title={patientListCollapsed ? 'Expand patient list' : 'Collapse patient list'}
                >
                  {patientListCollapsed ? (
                    <PanelLeftOpen size={20} />
                  ) : (
                    <PanelLeftClose size={20} />
                  )}
                </button>
              </div>
              <div className="patient-list-panel-content">
                <PatientList
                  appointments={appointments || []}
                  selectedPatientId={selectedPatientId}
                  onPatientSelect={handlePatientSelect}
                />
              </div>
            </aside>

            {/* Main Detail Panel */}
            <div className="medical-records-detail-panel">
              {!selectedPatientId ? (
                <div className="medical-records-empty-state">
                  <UserCheck size={80} className="empty-icon" />
                  <h2>Select a Patient</h2>
                  <p>Choose a patient from the list to view their comprehensive medical health records, interview history, and clinical risk factors</p>
                  {patientListCollapsed && (
                    <button 
                      className="medical-records-action-button primary"
                      onClick={() => setPatientListCollapsed(false)}
                    >
                      <PanelLeftOpen size={16} />
                      <span>Show Patient List</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Sticky Patient Header Section */}
                  <div className="patient-detail-header">
                    <div className="patient-detail-header-content">
                      <div className="patient-detail-avatar-section">
                        <div className="patient-detail-avatar">
                          {getInitials(selectedPatientName)}
                        </div>
                        <div className="patient-detail-info">
                          <h2 className="patient-detail-name">{selectedPatientName}</h2>
                          <div className="patient-detail-meta">
                            <span className="patient-detail-meta-item">
                              <HeartPulse size={14} />
                              {interviews.length} {interviews.length === 1 ? 'Interview' : 'Interviews'}
                            </span>
                            <span className="patient-detail-meta-separator">•</span>
                            <span className="patient-detail-meta-item">
                              <AlertCircle size={14} />
                              {riskFactors.length} {riskFactors.length === 1 ? 'Risk Factor' : 'Risk Factors'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Statistics Section */}
                  <section className="patient-detail-section">
                    <MedicalRecordsSummary
                      interviews={interviews}
                      riskFactorsCount={riskFactors.length}
                      patientName={selectedPatientName}
                    />
                  </section>

                  {/* Risk Factors Section */}
                  <section className="patient-detail-section">
                    <PatientProfileCard
                      patientName={selectedPatientName}
                      riskFactors={riskFactors}
                      isLoading={isLoadingRiskFactors}
                      error={riskFactorsError}
                    />
                  </section>

                  {/* Medical Interviews Section */}
                  <section className="patient-detail-section patient-interviews-section">
                    <div className="section-header">
                      <h3 className="section-title">Medical Interviews</h3>
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

                    <div className="section-content">
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
                          <FileCheck size={48} className="empty-icon" />
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
                  </section>
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

