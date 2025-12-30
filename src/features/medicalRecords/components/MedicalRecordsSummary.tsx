import React from 'react';
import { MedicalInterview } from '../../../types/medicalRecords';
import { 
  ClipboardList, 
  Calendar, 
  Stethoscope, 
  ShieldAlert,
  HeartPulse,
  AlertCircle
} from 'lucide-react';
import './MedicalRecordsSummary.css';

interface MedicalRecordsSummaryProps {
  interviews: MedicalInterview[];
  riskFactorsCount: number;
  patientName: string;
}

const MedicalRecordsSummary: React.FC<MedicalRecordsSummaryProps> = ({
  interviews,
  riskFactorsCount,
  patientName,
}) => {
  const totalInterviews = interviews.length;
  const totalSymptoms = interviews.reduce((sum, interview) => sum + interview.symptoms.length, 0);
  const totalDiagnoses = interviews.reduce((sum, interview) => sum + interview.diagnoses.length, 0);
  
  const mostRecentInterview = interviews.length > 0
    ? interviews.sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0]
    : null;

  const highProbabilityDiagnoses = interviews.reduce((count, interview) => {
    return count + interview.diagnoses.filter(d => d.probability >= 0.4).length;
  }, 0);

  const stats = [
    {
      label: 'Total Interviews',
      value: totalInterviews,
      icon: ClipboardList,
      color: 'var(--primary)',
      bgColor: 'var(--primary-lightest)',
    },
    {
      label: 'Risk Factors',
      value: riskFactorsCount,
      icon: ShieldAlert,
      color: 'var(--warning)',
      bgColor: 'var(--warning-lighter)',
    },
    {
      label: 'Total Symptoms',
      value: totalSymptoms,
      icon: HeartPulse,
      color: 'var(--info)',
      bgColor: 'var(--info-lighter)',
    },
    {
      label: 'Total Diagnoses',
      value: totalDiagnoses,
      icon: Stethoscope,
      color: 'var(--success)',
      bgColor: 'var(--success-lighter)',
    },
    {
      label: 'High Probability Cases',
      value: highProbabilityDiagnoses,
      icon: AlertCircle,
      color: 'var(--danger)',
      bgColor: 'var(--danger-lighter)',
    },
  ];

  if (totalInterviews === 0 && riskFactorsCount === 0) {
    return null;
  }

  return (
    <div className="medical-records-summary">
      <div className="summary-header">
        <h3 className="summary-title">Medical Records Overview</h3>
        <p className="summary-subtitle">Summary statistics for {patientName}</p>
      </div>
      <div className="summary-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="summary-stat-card">
              <div 
                className="summary-stat-icon-wrapper"
                style={{
                  backgroundColor: stat.bgColor,
                  color: stat.color,
                }}
              >
                <Icon size={18} />
              </div>
              <div className="summary-stat-content">
                <div className="summary-stat-value">{stat.value}</div>
                <div className="summary-stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      {mostRecentInterview && (
        <div className="summary-recent-interview">
          <Calendar size={14} className="summary-recent-icon" />
          <div className="summary-recent-content">
            <span className="summary-recent-label">Most Recent Interview</span>
            <span className="summary-recent-date">
              {new Date(mostRecentInterview.started_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MedicalRecordsSummary);

