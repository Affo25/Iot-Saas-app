'use client';
import React, { useState, useEffect } from 'react';

export default function DynamicCustomerDeviceModal({
  isOpen,
  onClose,
  onSubmit,
  fields = [],         // array of field configs [{ name, label, type, options?, required }]
  initialData = {},    // initial values for fields
  loading = false,
  isEditMode = false,
}) {
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Initialize form data from initialData or empty
  useEffect(() => {
    if (isOpen) {
      const init = {};
      fields.forEach(f => {
        init[f.name] = initialData[f.name] ?? (f.type === 'checkbox' ? false : '');
      });
      setFormData(init);
      setFormErrors({});
    }
  }, [isOpen, fields, initialData]);

  function handleInputChange(e) {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function validate() {
    const errors = {};
    fields.forEach(field => {
      if (field.required) {
        const val = formData[field.name];
        if (
          val === '' ||
          val === null ||
          (field.type === 'checkbox' && val === false)
        ) {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal fade zoom show" style={{ display: "block" }}>
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h5 className="modal-title text-white">
              {isEditMode ? 'Edit Device' : 'Add Device'}
            </h5>
            <button style={{ color: "#fff" }} className="close" onClick={onClose} aria-label="Close">
              <em className="icon ni ni-cross-sm"></em>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body pt-3">
              {fields.map(field => {
                const error = formErrors[field.name];
                const commonProps = {
                  name: field.name,
                  value: formData[field.name],
                  onChange: handleInputChange,
                  className: `form-control ${error ? 'is-invalid' : ''}`,
                  required: field.required,
                  placeholder: field.placeholder || '',
                };

                switch (field.type) {
                  case 'text':
                  case 'email':
                  case 'number':
                  case 'date':
                    return (
                      <div key={field.name} className="form-group mt-1">
                        <label className="form-label">{field.label}</label>
                        <input
                          type={field.type}
                          {...commonProps}
                        />
                        {error && <div className="invalid-feedback">{error}</div>}
                      </div>
                    );

                  case 'textarea':
                    return (
                      <div key={field.name} className="form-group mt-1">
                        <label className="form-label">{field.label}</label>
                        <textarea
                          {...commonProps}
                        />
                        {error && <div className="invalid-feedback">{error}</div>}
                      </div>
                    );

                  case 'select':
                    return (
                      <div key={field.name} className="form-group mt-1">
                        <label className="form-label">{field.label}</label>
                        <select
                          {...commonProps}
                          value={formData[field.name] || ''}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options && field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        {error && <div className="invalid-feedback">{error}</div>}
                      </div>
                    );

                  case 'checkbox':
                    return (
                      <div key={field.name} className="form-group mt-1">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            id={field.name}
                            name={field.name}
                            checked={!!formData[field.name]}
                            onChange={handleInputChange}
                            className={`form-check-input ${error ? 'is-invalid' : ''}`}
                            required={field.required}
                          />
                          <label className="form-check-label" htmlFor={field.name}>
                            {field.label}
                          </label>
                          {error && <div className="invalid-feedback">{error}</div>}
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>

            <div className="modal-footer">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <span>{isEditMode ? 'Update' : 'Save'}</span>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
