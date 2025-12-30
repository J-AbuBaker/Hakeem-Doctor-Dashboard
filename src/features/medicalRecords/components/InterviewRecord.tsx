import React, { useState } from 'react';
import { MedicalInterview } from '../../../types/medicalRecords';
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Stethoscope, 
  AlertTriangle,
  Target,
  Clock,
  ClipboardList,
  HeartPulse,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { getProbabilityStyle, formatProbability } from '../utils/diagnosisUtils';
import { highlightMatch } from '../utils/searchUtils';
import { isEmergencyTriage, formatTriageText } from '../utils/triageUtils';
import { useQnAPagination } from '../hooks/useQnAPagination';
import { useDiagnosisVisibility } from '../hooks/useDiagnosisVisibility';
import { QNA_ITEMS_PER_PAGE } from './constants';
import './InterviewRecord.css';

interface InterviewRecordProps {
  interview: MedicalInterview;
}

const InterviewRecord: React.FC<InterviewRecordProps> = ({ interview }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isQnAExpanded, setIsQnAExpanded] = useState(false);
  const [qnaSearchQuery, setQnaSearchQuery] = useState('');

  const interviewDate = new Date(interview.started_at);
  const formattedDate = format(interviewDate, 'MMMM dd, yyyy');
  const formattedTime = format(interviewDate, 'hh:mm a');
  const relativeTime = formatDistanceToNow(interviewDate, { addSuffix: true });

  const {
    sortedDiagnoses,
    visibleDiagnoses,
    showAll: showAllDiagnoses,
    toggleVisibility: toggleDiagnosisVisibility,
  } = useDiagnosisVisibility(interview.diagnoses);

  const {
    filteredQnA,
    paginatedQnA,
    currentPage: qnaCurrentPage,
    totalPages: qnaTotalPages,
    shouldPaginate: shouldPaginateQnA,
    handlePageChange: handleQnAPageChange,
    handleSearchChange: handleQnASearchChange,
  } = useQnAPagination({
    questionsAndAnswers: interview.questions_and_answers,
    searchQuery: qnaSearchQuery,
    interviewId: interview.interview_id,
  });

  const handleQnASearchInputChange = (value: string) => {
    setQnaSearchQuery(value);
    handleQnASearchChange(value);
  };

  const primaryDiagnosis = sortedDiagnoses[0];
  const primaryDiagnosisStyle = primaryDiagnosis 
    ? getProbabilityStyle(primaryDiagnosis.probability) 
    : null;

  return (
    <div className="interview-record">
      <button 
        className="interview-record-header interview-record-header-button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="interview-record-date-section">
          <div className="interview-record-date">
            <div className="interview-date-icon-wrapper">
              <Calendar className="interview-icon" size={20} />
            </div>
            <div className="interview-date-content">
              <span className="interview-date-text">{formattedDate}</span>
              <div className="interview-time-wrapper">
                <Clock size={14} />
                <span className="interview-time-text">{formattedTime}</span>
                <span className="interview-relative-time">• {relativeTime}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="interview-record-header-right">
          {primaryDiagnosis && (
            <div className="interview-primary-diagnosis">
              <Target size={16} />
              <div className="primary-diagnosis-content">
                <span className="primary-diagnosis-label">Primary Diagnosis</span>
                <span className="primary-diagnosis-name">{primaryDiagnosis.name}</span>
              </div>
              <div 
                className="primary-diagnosis-probability"
                style={{
                  color: primaryDiagnosisStyle.color,
                  backgroundColor: primaryDiagnosisStyle.bgColor,
                  borderColor: primaryDiagnosisStyle.borderColor
                }}
              >
                {formatProbability(primaryDiagnosis.probability)}
              </div>
            </div>
          )}
          <div className="interview-record-toggle-icon">
            {isExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <>

      {/* Symptoms */}
      {interview.symptoms.length > 0 && (
        <div className="interview-section">
          <div className="interview-section-header">
            <div className="interview-section-icon-wrapper interview-section-icon-symptoms">
              <HeartPulse className="interview-section-icon" size={20} />
            </div>
            <div className="interview-section-header-content">
              <h4 className="interview-section-title">Presenting Symptoms</h4>
              <span className="interview-section-count">{interview.symptoms.length}</span>
            </div>
          </div>
          <div className="interview-section-content">
            <div className="symptoms-list">
              {interview.symptoms.map((symptom) => (
                <span key={symptom.id} className="symptom-badge">
                  {symptom.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Diagnoses */}
      {interview.diagnoses.length > 0 && (
        <div className="interview-section">
          <div className="interview-section-header">
            <div className="interview-section-icon-wrapper interview-section-icon-diagnoses">
              <Stethoscope className="interview-section-icon" size={20} />
            </div>
            <div className="interview-section-header-content">
              <h4 className="interview-section-title">Clinical Diagnoses</h4>
              <span className="interview-section-count">{interview.diagnoses.length}</span>
            </div>
          </div>
          <div className="interview-section-content">
            <div className="diagnoses-list">
              {visibleDiagnoses.map((diagnosis) => {
                const style = getProbabilityStyle(diagnosis.probability);
                return (
                  <div key={diagnosis.id} className="diagnosis-item">
                    <div className="diagnosis-content">
                      <div className="diagnosis-name">{diagnosis.name}</div>
                      <div className="diagnosis-meta">
                        <div className="diagnosis-severity" style={{ color: style.color }}>
                          {style.severity} Probability
                        </div>
                        <div className="diagnosis-probability-bar-container">
                          <div 
                            className="diagnosis-probability-bar"
                            style={{
                              backgroundColor: style.bgColor,
                              borderColor: style.borderColor
                            }}
                          >
                            <div 
                              className="diagnosis-probability-bar-fill"
                              style={{
                                width: `${diagnosis.probability * 100}%`,
                                backgroundColor: style.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="diagnosis-probability"
                      style={{
                        color: style.color,
                        backgroundColor: style.bgColor,
                        borderColor: style.borderColor
                      }}
                    >
                      {formatProbability(diagnosis.probability)}
                    </div>
                  </div>
                );
              })}
            </div>
            {sortedDiagnoses.length > 5 && (
              <button
                className="diagnosis-toggle-button"
                onClick={toggleDiagnosisVisibility}
                aria-expanded={showAllDiagnoses}
              >
                {showAllDiagnoses ? (
                  <>
                    <EyeOff size={16} />
                    <span>Show Top 5</span>
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    <span>Show All {sortedDiagnoses.length} Diagnoses</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Doctor Recommendation & Triage - Combined Row */}
      {(interview.doctor_recommendation || interview.triage) && (
        <div className="interview-section interview-section-recommendation-triage">
          <div className="recommendation-triage-row">
            {/* Specialist Recommendation */}
            {interview.doctor_recommendation && (
              <div className="recommendation-triage-item">
                <div className="recommendation-triage-header">
                  <div className="recommendation-triage-icon-wrapper recommendation-icon">
                    <Briefcase className="recommendation-triage-icon" size={18} />
                  </div>
                  <h4 className="recommendation-triage-title">Specialist Recommendation</h4>
                </div>
                <div className="recommendation-triage-content">
                  <div className="recommendation-badge">
                    <Stethoscope size={14} />
                    {interview.doctor_recommendation.name}
                  </div>
                </div>
              </div>
            )}

            {interview.triage && (() => {
              const isEmergency = isEmergencyTriage(interview.triage);
              return (
                <div className={`recommendation-triage-item ${isEmergency ? 'triage-emergency' : ''}`}>
                  <div className="recommendation-triage-header">
                    <div className={`recommendation-triage-icon-wrapper triage-icon ${isEmergency ? 'triage-emergency-icon' : ''}`}>
                      {isEmergency ? (
                        <AlertTriangle className="recommendation-triage-icon" size={20} />
                      ) : (
                        <HeartPulse className="recommendation-triage-icon" size={18} />
                      )}
                    </div>
                    <h4 className="recommendation-triage-title">Triage Assessment</h4>
                  </div>
                  <div className="recommendation-triage-content">
                    <div className={`triage-badge ${isEmergency ? 'triage-badge-emergency' : ''}`}>
                      {isEmergency && <AlertTriangle size={16} className="triage-emergency-icon-inline" />}
                      <span>{formatTriageText(interview.triage)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Questions and Answers */}
      {interview.questions_and_answers.length > 0 && (
        <div className="interview-section">
          <button
            className="interview-section-header qna-header-button"
            onClick={() => setIsQnAExpanded(!isQnAExpanded)}
            aria-expanded={isQnAExpanded}
          >
            <div className="interview-section-header-content">
              <div className="interview-section-icon-wrapper interview-section-icon-qna">
                <ClipboardList className="interview-section-icon" size={20} />
              </div>
              <div>
                <h4 className="interview-section-title">
                  Clinical Assessment Questions
                </h4>
                <span className="interview-section-subtitle">
                  {interview.questions_and_answers.length} {interview.questions_and_answers.length === 1 ? 'question' : 'questions'} answered
                  {qnaSearchQuery && filteredQnA.length !== interview.questions_and_answers.length && (
                    <span className="qna-filtered-count">
                      {' '}({filteredQnA.length} {filteredQnA.length === 1 ? 'match' : 'matches'})
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className="qna-toggle-icon">
              {isQnAExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          </button>
          {isQnAExpanded && (
            <div 
              className="interview-section-content qna-content"
              data-interview-id={interview.interview_id}
            >
              {shouldPaginateQnA && (
                <div className="qna-search-container">
                  <div className="qna-search-wrapper">
                    <Search className="qna-search-icon" size={18} />
                    <input
                      type="text"
                      className="qna-search-input"
                      placeholder="Search questions and answers..."
                      value={qnaSearchQuery}
                      onChange={(e) => handleQnASearchInputChange(e.target.value)}
                      aria-label="Search questions and answers"
                    />
                    {qnaSearchQuery && (
                      <button
                        className="qna-search-clear"
                        onClick={() => handleQnASearchInputChange('')}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
              {filteredQnA.length === 0 ? (
                <div className="qna-no-results">
                  <Search size={32} className="qna-no-results-icon" />
                  <p>No questions found matching "{qnaSearchQuery}"</p>
                </div>
              ) : (
                <>
                  <div className="qna-list">
                    {paginatedQnA.map((qa, index) => {
                      const globalIndex = shouldPaginateQnA 
                        ? (qnaCurrentPage - 1) * QNA_ITEMS_PER_PAGE + index
                        : index;
                      return (
                        <div key={globalIndex} className="qna-item">
                          <div className="qna-question-wrapper">
                            <div className="qna-question-header">
                              <span className="qna-question-number">Q{globalIndex + 1}</span>
                              <span className="qna-question-label">Clinical Question</span>
                            </div>
                            <div className="qna-question-text">
                              {qnaSearchQuery ? highlightMatch(qa.question, qnaSearchQuery) : qa.question}
                            </div>
                          </div>
                          <div className="qna-answer-wrapper">
                            <div className="qna-answer-header">
                              <span className="qna-answer-label">Patient Response</span>
                            </div>
                            <div className="qna-answer-text">
                              {qnaSearchQuery ? highlightMatch(qa.answer, qnaSearchQuery) : qa.answer}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {shouldPaginateQnA && qnaTotalPages > 1 && (
                    <div className="qna-pagination">
                      <button
                        className="qna-pagination-button"
                        onClick={() => handleQnAPageChange(qnaCurrentPage - 1)}
                        disabled={qnaCurrentPage === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>
                      <div className="qna-pagination-info">
                        Page {qnaCurrentPage} of {qnaTotalPages}
                        {qnaSearchQuery && (
                          <span className="qna-pagination-filtered">
                            {' '}({filteredQnA.length} {filteredQnA.length === 1 ? 'result' : 'results'})
                          </span>
                        )}
                      </div>
                      <button
                        className="qna-pagination-button"
                        onClick={() => handleQnAPageChange(qnaCurrentPage + 1)}
                        disabled={qnaCurrentPage === qnaTotalPages}
                        aria-label="Next page"
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default React.memo(InterviewRecord);
