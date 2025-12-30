import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Appointment } from '../../../types/appointment';
import { UserCheck, Search, ChevronRight, UserCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight as ChevronRightIcon, Calendar } from 'lucide-react';
import { highlightMatch } from '../utils/searchUtils';
import { sortPatients, getPatientSortLabel, getNextPatientSortOption, PatientSortOption } from '../utils/patientSortUtils';
import { extractPatientsFromAppointments, filterPatientsByName } from '../utils/patientUtils';
import { usePagination } from '../hooks/usePagination';
import { format } from 'date-fns';
import { getInitials } from '@shared/utils/string';
import './PatientList.css';

interface PatientListProps {
  appointments: Appointment[];
  selectedPatientId: string | null;
  onPatientSelect: (patientId: string, patientName: string) => void;
}

const ITEMS_PER_PAGE = 20;
const PAGINATION_THRESHOLD = 50;

const PatientList: React.FC<PatientListProps> = ({
  appointments,
  selectedPatientId,
  onPatientSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<PatientSortOption>('name-asc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const patients = useMemo(() => {
    return extractPatientsFromAppointments(appointments);
  }, [appointments]);

  const filteredAndSortedPatients = useMemo(() => {
    const filtered = filterPatientsByName(patients, debouncedSearchQuery);
    return sortPatients(filtered, sortOption);
  }, [patients, debouncedSearchQuery, sortOption]);

  const {
    paginatedItems: paginatedPatients,
    currentPage,
    totalPages,
    shouldPaginate,
    handlePageChange,
    resetPagination,
  } = usePagination({
    items: filteredAndSortedPatients,
    itemsPerPage: ITEMS_PER_PAGE,
    paginationThreshold: PAGINATION_THRESHOLD,
  });

  const handleSortChange = useCallback(() => {
    setSortOption(getNextPatientSortOption(sortOption));
    resetPagination();
  }, [sortOption, resetPagination]);

  const sortLabel = useMemo(() => {
    return getPatientSortLabel(sortOption);
  }, [sortOption]);

  const handlePageChangeWithScroll = useCallback((page: number) => {
    handlePageChange(page);
    const listContainer = document.querySelector('.patient-list-items');
    if (listContainer) {
      listContainer.scrollTop = 0;
    }
  }, [handlePageChange]);

  if (patients.length === 0) {
    return (
      <div className="patient-list-empty">
        <div className="patient-list-empty-icon">
          <UserCircle size={48} />
        </div>
        <h3 className="patient-list-empty-title">No Patients Found</h3>
        <p className="patient-list-empty-text">
          Patients will appear here once they have scheduled appointments with you.
        </p>
      </div>
    );
  }

  const displayCount = filteredAndSortedPatients.length;
  const totalCount = patients.length;
  const showingCount = shouldPaginate 
    ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, displayCount)}`
    : displayCount;

  return (
    <div className="patient-list">
      <div className="patient-list-header">
        <div className="patient-list-header-content">
          <UserCheck className="patient-list-header-icon" size={20} />
          <h3 className="patient-list-title">Patient Directory</h3>
        </div>
        <div className="patient-list-header-stats">
          {searchQuery ? (
            <span className="patient-list-count">
              {displayCount} {displayCount === 1 ? 'result' : 'results'}
            </span>
          ) : (
            <span className="patient-list-count">
              {totalCount} {totalCount === 1 ? 'patient' : 'patients'}
            </span>
          )}
        </div>
      </div>

      <div className="patient-list-controls">
        <div className="patient-list-search">
          <Search className="patient-list-search-icon" size={18} />
          <input
            type="text"
            className="patient-list-search-input"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search patients"
          />
        </div>
        <button
          className="patient-list-sort-button"
          onClick={handleSortChange}
          aria-label={`Sort by ${sortLabel}`}
          title={`Sort by ${sortLabel}`}
        >
          <ArrowUpDown size={16} />
          <span>{sortLabel}</span>
          {sortOption === 'name-asc' && <ArrowUp size={12} className="sort-indicator" />}
          {sortOption === 'name-desc' && <ArrowDown size={12} className="sort-indicator" />}
        </button>
      </div>

      {shouldPaginate && (
        <div className="patient-list-pagination-info">
          Showing {showingCount} of {displayCount} {displayCount === 1 ? 'patient' : 'patients'}
        </div>
      )}

      <div className="patient-list-items">
        {filteredAndSortedPatients.length === 0 ? (
          <div className="patient-list-no-results">
            <Search size={32} className="no-results-icon" />
            <p className="no-results-text">No patients found matching "{debouncedSearchQuery}"</p>
            <p className="no-results-hint">Try adjusting your search or sort criteria</p>
          </div>
        ) : (
          <>
            {paginatedPatients.map((patient) => {
              const lastVisitDate = patient.lastAppointmentDate 
                ? format(patient.lastAppointmentDate, 'MMM dd, yyyy')
                : null;
              
              return (
                <button
                  key={patient.id}
                  className={`patient-list-item ${
                    selectedPatientId === patient.id ? 'active' : ''
                  }`}
                  onClick={() => onPatientSelect(patient.id, patient.name)}
                  aria-pressed={selectedPatientId === patient.id}
                  aria-label={`Select patient ${patient.name}`}
                >
                  <div className="patient-list-item-avatar">
                    {getInitials(patient.name)}
                  </div>
                  <div className="patient-list-item-info">
                    <span className="patient-list-item-name">
                      {debouncedSearchQuery ? highlightMatch(patient.name, debouncedSearchQuery, 'search-highlight') : patient.name}
                    </span>
                    <div className="patient-list-item-meta">
                      {lastVisitDate && (
                        <div className="patient-list-item-visit-info">
                          <Calendar size={12} />
                          <span className="patient-list-item-visit-date">{lastVisitDate}</span>
                        </div>
                      )}
                      <div className="patient-list-item-stats">
                        <span className="patient-list-item-indicator">View Records</span>
                      </div>
                    </div>
                  </div>
                  <div className="patient-list-item-arrow">
                    <ChevronRight size={18} />
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {shouldPaginate && totalPages > 1 && (
        <div className="patient-list-pagination">
          <button
            className="pagination-button"
            onClick={() => handlePageChangeWithScroll(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            className="pagination-button"
            onClick={() => handlePageChangeWithScroll(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientList);
