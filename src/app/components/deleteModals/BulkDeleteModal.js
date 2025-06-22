'use client';

import React from 'react';

function BulkDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount, 
  tableName,
  loading = false 
}) {
  if (!isOpen) return null;

  const getTableDisplayName = (tableName) => {
    switch (tableName) {
      case 'customers':
        return 'Customers';
      case 'devices':
        return 'Devices';
      case 'deviceLogs':
        return 'Device Logs';
      case 'customerDevices':
        return 'Customer Devices';
      default:
        return 'Records';
    }
  };

  return (
    <div className="modal fade zoom show" style={{ display: "block" }}>
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header bg-danger">
            <h5 className="modal-title text-white">
              <span>Bulk Delete {getTableDisplayName(tableName)}</span>
            </h5>
            <button 
              style={{ color: "#fff" }} 
              className="close" 
              onClick={onClose} 
              aria-label="Close"
              disabled={loading}
            >
              <em className="icon ni ni-cross-sm"></em>
            </button>
          </div>
          <div className="modal-body">
            <div className="text-center">
              <div className="mb-4">
                <em className="icon ni ni-alert-circle text-danger" style={{ fontSize: '48px' }}></em>
              </div>
              <h6 className="mb-3">Are you sure you want to delete these records?</h6>
              <p className="text-muted">
                You are about to delete <strong>{selectedCount}</strong> {getTableDisplayName(tableName)}.
                <br />
                This action cannot be undone.
              </p>
              <div className="alert alert-warning mt-3">
                <small>
                  <strong>Warning:</strong> All selected records will be permanently removed from the {tableName} table.
                </small>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <em className="icon ni ni-trash"></em>
                  Delete {selectedCount} Records
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkDeleteModal;