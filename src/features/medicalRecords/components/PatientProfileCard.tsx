import React from 'react';
import { RiskFactorResponse } from '../../../types/medicalRecords';
import { 
  BadgeCheck, 
  Activity,
  AlertTriangle,
  ShieldAlert,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { RISK_FACTOR_PAGINATION_THRESHOLD, RISK_FACTOR_ITEMS_PER_PAGE } from './constants';
import { getInitials } from '@shared/utils/string';
import { usePagination } from '../hooks/usePagination';
import './PatientProfileCard.css';

interface PatientProfileCardProps {
  patientName: string;
  riskFactors: RiskFactorResponse[];
  isLoading?: boolean;
  error?: string | null;
}

const PatientProfileCard: React.FC<PatientProfileCardProps> = ({
  patientName,
  riskFactors,
  isLoading = false,
  error = null,
}) => {
  const {
    paginatedItems: paginatedRiskFactors,
    currentPage,
    totalPages,
    shouldPaginate,
    handlePageChange,
  } = usePagination({
    items: riskFactors,
    itemsPerPage: RISK_FACTOR_ITEMS_PER_PAGE,
    paginationThreshold: RISK_FACTOR_PAGINATION_THRESHOLD,
  });

  const hasRiskFactors = riskFactors.length > 0;

  return (
    <div className="patient-profile-card">
      <div className="patient-profile-header">
        <div className="patient-profile-avatar-container">
          <div className="patient-profile-avatar">
            {getInitials(patientName)}
          </div>
          <div className="patient-profile-status-indicator"></div>
        </div>
        <div className="patient-profile-info">
          <div className="patient-profile-name-section">
            <h2 className="patient-profile-name">{patientName}</h2>
            <div className="patient-profile-badge">
              <BadgeCheck size={14} />
              <span>Active Patient</span>
            </div>
          </div>
        </div>
      </div>

      <div className="patient-profile-risk-factors">
        <div className="risk-factors-header">
          <div className="risk-factors-header-icon-wrapper">
            <ShieldAlert className="risk-factors-header-icon" size={20} />
          </div>
          <div className="risk-factors-header-content">
            <h3 className="risk-factors-title">Clinical Risk Factors</h3>
            <p className="risk-factors-subtitle">Documented health risk indicators</p>
          </div>
          {riskFactors.length > 0 && (
            <div className="risk-factor-count-badge">
              <span className="risk-factor-count">{riskFactors.length}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="risk-factors-loading">
            <div className="risk-factors-loading-icon-wrapper">
              <Activity className="spinner" size={28} />
            </div>
            <p>Loading risk factors...</p>
          </div>
        ) : error ? (
          <div className="risk-factors-error">
            <div className="risk-factors-error-icon-wrapper">
              <AlertCircleIcon size={28} />
            </div>
            <h4 className="risk-factors-error-title">Error Loading Risk Factors</h4>
            <p className="risk-factors-error-text">{error}</p>
          </div>
        ) : hasRiskFactors ? (
          <>
            <div className="risk-factors-list-container">
              <div className="risk-factor-grid">
                {paginatedRiskFactors.map((riskFactor) => (
                  <div key={riskFactor.id} className="risk-factor-card">
                    <div className="risk-factor-card-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="risk-factor-card-content">
                      <span className="risk-factor-card-label">Risk Factor</span>
                      <span className="risk-factor-card-name">
                        {riskFactor.factor_name}
                      </span>
                    </div>
                    <div className="risk-factor-card-indicator"></div>
                  </div>
                ))}
              </div>
            </div>
            {shouldPaginate && totalPages > 1 && (
              <div className="risk-factors-pagination">
                <button
                  className="risk-factors-pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <div className="risk-factors-pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className="risk-factors-pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="risk-factors-empty-state">
            <div className="risk-factors-empty-icon-wrapper">
              <ShieldAlert size={40} />
            </div>
            <h4 className="risk-factors-empty-title">No Risk Factors</h4>
            <p className="risk-factors-empty-text">No risk factors documented for this patient</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PatientProfileCard);
