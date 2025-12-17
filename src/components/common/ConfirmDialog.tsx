import React from 'react';
import { X, AlertTriangle, Trash2, LogOut, Edit, CheckCircle2, Info } from 'lucide-react';

export type DialogType = 'delete' | 'cancel' | 'logout' | 'update' | 'approve' | 'success' | 'info' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type,
  title,
  message,
  details,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    const iconClass = 'dialog-icon';
    const iconSize = 40;
    switch (type) {
      case 'delete':
        return <Trash2 className={iconClass} size={iconSize} />;
      case 'cancel':
        return <X className={iconClass} size={iconSize} />;
      case 'logout':
        return <LogOut className={iconClass} size={iconSize} />;
      case 'update':
        return <Edit className={iconClass} size={iconSize} />;
      case 'approve':
      case 'success':
        return <CheckCircle2 className={iconClass} size={iconSize} />;
      case 'warning':
        return <AlertTriangle className={iconClass} size={iconSize} />;
      default:
        return <Info className={iconClass} size={iconSize} />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'delete':
      case 'cancel':
      case 'logout':
        return 'var(--danger)';
      case 'warning':
        return 'var(--warning)';
      case 'update':
        return 'var(--primary)';
      case 'approve':
        return 'var(--success)';
      default:
        return 'var(--info)';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'delete':
      case 'cancel':
      case 'logout':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'update':
        return 'btn-primary';
      case 'approve':
      case 'success':
        return 'btn-success';
      default:
        return 'btn-primary';
    }
  };

  const defaultConfirmText = type === 'delete'
    ? 'Delete'
    : type === 'logout'
      ? 'Logout'
      : type === 'update'
        ? 'Update'
        : type === 'approve'
          ? 'Approve'
          : type === 'success'
            ? 'Confirm'
            : 'Confirm';

  const defaultCancelText = 'Cancel';

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="confirm-dialog-close" onClick={onCancel} aria-label="Close">
          <X size={20} />
        </button>

        <div className="confirm-dialog-header">
          <div
            className="confirm-dialog-icon-wrapper"
            style={{
              backgroundColor: type === 'logout' || type === 'delete'
                ? 'hsla(var(--danger-hue), 72%, 50%, 0.12)'
                : type === 'warning'
                  ? 'hsla(var(--warning-hue), 92%, 50%, 0.12)'
                  : type === 'update'
                    ? 'hsla(var(--primary-hue), var(--primary-saturation), var(--primary-lightness), 0.12)'
                    : type === 'approve' || type === 'success'
                      ? 'hsla(var(--success-hue), 71%, 45%, 0.12)'
                      : 'hsla(var(--info-hue), 100%, 50%, 0.12)',
              borderColor: type === 'logout' || type === 'delete'
                ? 'hsla(var(--danger-hue), 72%, 50%, 0.3)'
                : type === 'warning'
                  ? 'hsla(var(--warning-hue), 92%, 50%, 0.3)'
                  : type === 'update'
                    ? 'hsla(var(--primary-hue), var(--primary-saturation), var(--primary-lightness), 0.3)'
                    : type === 'approve' || type === 'success'
                      ? 'hsla(var(--success-hue), 71%, 45%, 0.3)'
                      : 'hsla(var(--info-hue), 100%, 50%, 0.3)'
            }}
          >
            <div style={{ color: getIconColor() }}>
              {getIcon()}
            </div>
          </div>
          <h3 className="confirm-dialog-title">{title}</h3>
        </div>

        <div className="confirm-dialog-body">
          <p className="confirm-dialog-message">{message}</p>
          {details && (
            <div className="confirm-dialog-details">
              <p>{details}</p>
            </div>
          )}
          {type === 'delete' && (
            <div className="confirm-dialog-warning">
              <AlertTriangle className="warning-icon" />
              <span>This action cannot be undone.</span>
            </div>
          )}
        </div>

        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText || defaultCancelText}
          </button>
          <button
            type="button"
            className={`btn ${getConfirmButtonClass()}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner-small" />
                Processing...
              </>
            ) : (
              confirmText || defaultConfirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
