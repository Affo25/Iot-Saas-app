"use client";
import React from "react";

/**
 * Reusable Delete Confirmation Modal
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onConfirm - Function to call when deletion is confirmed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Confirmation message
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.itemToDelete - The item to be deleted
 */
function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Confirmation", 
  message = "Do you want to delete this item?", 
  loading = false,
  itemToDelete = null
}) {
  if (!isOpen) return null;

  return (
    <div className="modal fade zoom show" style={{ display: "block" }}>
      <div className="modal-dialog modal-sm" role="document">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h5 className="modal-title text-white">
              <span>{title}</span>
            </h5>
          </div>
          <div className="modal-body pt-3">
            <h5>{message}</h5>
            <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
              <div className="col-md-12"></div>
              <div className="col-md-9 text-right pt-2">
                <ul className="list-inline mb-0">
                  <li className="list-inline-item mr-2">
                    <button
                      type="button"
                      className="btn btn-primary w-100 justify-center"
                      onClick={() => itemToDelete && onConfirm(itemToDelete)}
                      disabled={loading || !itemToDelete}
                    >
                      <span>Yes</span>
                    </button>
                  </li>
                  <li className="list-inline-item">
                    <button
                      type="button"
                      className="btn btn-danger w-100 justify-center"
                      onClick={onClose}
                      disabled={loading}
                    >
                      <span>No</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;