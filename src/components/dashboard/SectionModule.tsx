import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import './SectionModule.css';

interface SectionModuleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: LucideIcon;
  className?: string;
  'aria-label'?: string;
}

const SectionModule: React.FC<SectionModuleProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  loading = false,
  empty = false,
  emptyTitle,
  emptySubtitle,
  emptyIcon: EmptyIcon,
  className = '',
  'aria-label': ariaLabel,
}) => {
  return (
    <section
      className={`section-module ${className}`}
      aria-label={ariaLabel || title}
    >
      <div className="section-module-header">
        <div className="section-module-title-section">
          {Icon && (
            <Icon
              className="section-module-icon"
              size={24}
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className="section-module-title">{title}</h2>
            {subtitle && (
              <p className="section-module-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="section-module-actions" role="toolbar">
            {actions}
          </div>
        )}
      </div>

      <div className="section-module-content">
        {loading ? (
          <div className="section-module-loading">
            <div className="spinner-medium" />
            <p>Loading...</p>
          </div>
        ) : empty ? (
          <div className="section-module-empty">
            {EmptyIcon && (
              <EmptyIcon className="empty-icon" size={48} aria-hidden="true" />
            )}
            {emptyTitle && (
              <p className="empty-title">{emptyTitle}</p>
            )}
            {emptySubtitle && (
              <p className="empty-subtitle">{emptySubtitle}</p>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default SectionModule;
