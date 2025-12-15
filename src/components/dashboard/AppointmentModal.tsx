import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Appointment, UpdateAppointmentDto } from '../../types';
import { X, Loader2, Calendar, User, Clock, FileText, AlertCircle } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import ConfirmDialog from '../common/ConfirmDialog';

interface AppointmentModalProps {
  appointment?: Appointment;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for viewing appointment details
 * @deprecated Use OpenSlotModal for creating new appointment slots
 */
const AppointmentModal: React.FC<AppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
}) => {
  const [error, setError] = React.useState<string | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<UpdateAppointmentDto | null>(null);
  const isEditMode = !!appointment;

  const validationSchema = Yup.object({
    patientName: Yup.string()
      .required('Patient name is required')
      .min(2, 'Patient name must be at least 2 characters')
      .max(100, 'Patient name must not exceed 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/, 'Patient name can only contain letters, spaces, hyphens, and apostrophes'),
    patientId: Yup.string()
      .required('Patient ID is required')
      .min(3, 'Patient ID must be at least 3 characters')
      .max(50, 'Patient ID must not exceed 50 characters'),
    date: Yup.date()
      .required('Date is required')
      .min(new Date().toISOString().split('T')[0], 'Appointment date cannot be in the past')
      .typeError('Please select a valid date'),
    time: Yup.string()
      .required('Time slot is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please select a valid time slot'),
    notes: Yup.string()
      .max(500, 'Notes must not exceed 500 characters'),
  });

  const formik = useFormik({
    initialValues: {
      patientName: appointment?.patientName || '',
      patientId: appointment?.patientId || '',
      date: appointment?.date ? appointment.date.split('T')[0] : '',
      time: appointment?.time || '',
      notes: appointment?.notes || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setError(null);
      try {
        if (isEditMode) {
          const updateData: UpdateAppointmentDto = {
            date: new Date(values.date).toISOString(),
            time: values.time,
            notes: values.notes,
          };
          const hasChanges =
            appointment.date !== updateData.date ||
            appointment.time !== updateData.time ||
            (appointment.notes || '') !== (updateData.notes || '');

          if (hasChanges) {
            setPendingUpdate(updateData);
            setShowUpdateDialog(true);
            return;
          } else {
            onClose();
            formik.resetForm();
            return;
          }
        } else {
          throw new Error('Creating appointments is not supported. Please use Open Slot instead.');
        }
        onClose();
        formik.resetForm();
      } catch (err: any) {
        let errorMessage = err.response?.data?.message || 'Failed to save appointment';

        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to save appointment. Please check your connection and try again.';
        } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          errorMessage = 'This time slot is already booked. Please select a different time.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Please check all fields and ensure the information is correct.';
        } else if (errorMessage.includes('500')) {
          errorMessage = 'A server error occurred. Please try again in a few moments.';
        }

        setError(errorMessage);
      }
    },
  });

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate || !appointment) return;

    setError(null);
    try {
      // Note: Doctors cannot update appointments - this functionality is deprecated
      throw new Error('Updating appointments is not supported.');
      setShowUpdateDialog(false);
      setPendingUpdate(null);
      onClose();
      formik.resetForm();
    } catch (err: any) {
      let errorMessage = err.response?.data?.message || 'Failed to update appointment';

      if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
        errorMessage = 'Unable to update appointment. Please check your connection and try again.';
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        errorMessage = 'This time slot is already booked. Please select a different time.';
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        errorMessage = 'Please check all fields and ensure the information is correct.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'A server error occurred. Please try again in a few moments.';
      }

      setError(errorMessage);
      setShowUpdateDialog(false);
      setPendingUpdate(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Appointment' : 'Add New Appointment'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon-wrapper">
              <AlertCircle size={20} />
            </div>
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="patientName">
              <User className="label-icon" />
              Patient Name *
            </label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                id="patientName"
                name="patientName"
                type="text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.patientName}
                className={formik.touched.patientName && formik.errors.patientName ? 'error' : ''}
                disabled={isEditMode}
                placeholder="Enter patient's full name"
                autoComplete="name"
              />
            </div>
            {formik.touched.patientName && formik.errors.patientName && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={14} />
                {formik.errors.patientName}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="patientId">
              <User className="label-icon" />
              Patient ID *
            </label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                id="patientId"
                name="patientId"
                type="text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.patientId}
                className={formik.touched.patientId && formik.errors.patientId ? 'error' : ''}
                disabled={isEditMode}
                placeholder="Enter patient ID"
                autoComplete="off"
              />
            </div>
            {formik.touched.patientId && formik.errors.patientId && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={14} />
                {formik.errors.patientId}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="date">
              <Calendar className="label-icon" />
              Appointment Date *
            </label>
            <div className="input-wrapper">
              <Calendar className="input-icon" />
              <input
                id="date"
                name="date"
                type="date"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.date}
                className={formik.touched.date && formik.errors.date ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            {formik.touched.date && formik.errors.date && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={14} />
                {formik.errors.date}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <Clock className="label-icon" />
              Time Slot *
            </label>
            <TimeSlotPicker
              selectedTime={formik.values.time}
              onTimeSelect={(time) => formik.setFieldValue('time', time)}
              date={formik.values.date}
              error={formik.touched.time && formik.errors.time ? formik.errors.time : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">
              <FileText className="label-icon" />
              Clinical Notes
            </label>
            <div className="textarea-wrapper">
              <FileText className="textarea-icon" />
              <textarea
                id="notes"
                name="notes"
                rows={4}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.notes}
                placeholder="Enter clinical notes, symptoms, or special instructions..."
                className={formik.touched.notes && formik.errors.notes ? 'error' : ''}
                maxLength={500}
              />
            </div>
            {formik.touched.notes && formik.errors.notes && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={14} />
                {formik.errors.notes}
              </div>
            )}
            {formik.values.notes && (
              <div className="char-count">
                {formik.values.notes.length}/500 characters
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? (
                <>
                  <Loader2 className="spinner" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>

        {/* Update Confirmation Dialog */}
        {isEditMode && pendingUpdate && (
          <ConfirmDialog
            isOpen={showUpdateDialog}
            type="update"
            title="Confirm Appointment Update"
            message={`Are you sure you want to update this appointment?`}
            details={`Patient: ${appointment.patientName}\n\nChanges:\n${pendingUpdate.date && appointment.date !== pendingUpdate.date ? `Date: ${new Date(appointment.date).toLocaleDateString()} → ${new Date(pendingUpdate.date).toLocaleDateString()}\n` : ''}${pendingUpdate.time && appointment.time !== pendingUpdate.time ? `Time: ${appointment.time} → ${pendingUpdate.time}\n` : ''}${(appointment.notes || '') !== (pendingUpdate.notes || '') ? `Notes: Updated\n` : ''}\nThese changes will be saved permanently.`}
            confirmText="Save Changes"
            cancelText="Discard Changes"
            onConfirm={handleConfirmUpdate}
            onCancel={() => {
              setShowUpdateDialog(false);
              setPendingUpdate(null);
            }}
            isLoading={formik.isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentModal;

