"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import BulkDeleteModal from '../../components/deleteModals/BulkDeleteModal';
import ThemeButton from "../../components/Theme/dynamicButton";
import { 
  fetchDevices, 
  addDevice, 
  updateDevice, 
  deleteDevice, 
  deleteMultipleDevices,
  resetState 
} from '../../store/slices/deviceSlice';

function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { devices, loading, error, success } = useSelector((state) => state.device);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [formData, setFormData] = useState({
    device_name: '',
    device_code: '',
    description: '',
    status: 'Active',
    device_field: []
  });
  const [formErrors, setFormErrors] = useState({});

  // Add error effect
  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error('Redux Error:', error);
    }
  }, [error]);

  // Fetch devices on component mount
  useEffect(() => {
    dispatch(fetchDevices());
  }, [dispatch]);

  // Effect to handle success state and refetch devices
  useEffect(() => {
    if (success) {
      dispatch(fetchDevices());
      dispatch(resetState());
    }
  }, [success, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.device_name) errors.device_name = 'Device name is required';
    if (!formData.device_code) errors.device_code = 'Device code is required';
    if (!formData.description) errors.description = 'Description is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async (device) => {
    try {
      const deviceId = device._id || device.id;
      console.log('Deleting device with ID:', deviceId);

      const result = await dispatch(deleteDevice(deviceId)).unwrap();
      if (result) {
        setIsDeleteModalOpen(false);
        setDeviceToDelete(null);
        toast.success('Device deleted successfully');
      } else {
        toast.error('Failed to delete device');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Error deleting device');
    }
  };

  const handleBulkDelete = (selectedIds, tableName) => {
    setSelectedDevices(selectedIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await dispatch(deleteMultipleDevices(selectedDevices)).unwrap();
      toast.success(`${selectedDevices.length} devices deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      setSelectedDevices([]);
    } catch (error) {
      toast.error(error.message || 'Failed to delete devices');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentDeviceId(null);
    setFormData({ 
      device_name: '', 
      device_code: '', 
      description: '', 
      status: 'Active',
      device_field: []
    });
    setFormErrors({});
    dispatch(resetState());
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => {
        const currentFields = prev.device_field || [];
        if (checked) {
          // Add the field if checked
          return {
            ...prev,
            device_field: [...currentFields, value]
          };
        } else {
          // Remove the field if unchecked
          return {
            ...prev,
            device_field: currentFields.filter(field => field !== value)
          };
        }
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEdit = (device) => {
    setFormData({
      device_name: device.device_name || '',
      device_code: device.device_code || '',
      description: device.description || '',
      status: device.status || 'Active',
      device_field: device.device_field || []
    });
    setIsEditMode(true);
    setCurrentDeviceId(device._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let result;
      if (isEditMode && currentDeviceId) {
        result = await dispatch(updateDevice({ ...formData, _id: currentDeviceId })).unwrap();
      } else {
        result = await dispatch(addDevice(formData)).unwrap();
      }

      if (result) {
        closeModal();
        dispatch(fetchDevices());
        toast.success(isEditMode ? 'Device updated successfully' : 'Device added successfully');
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error('Error processing request');
    }
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Devices Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your devices</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-primary"
                  onClick={openModal}
                  text="Add Device"
                  icon="ni-plus"
                />
              </li>
            </ul>
          </div>
        </div>

        {/* DataTable Section */}
        <div className="row pt-3">
          <div className="col-12">
            <DataTable
              text="Total Devices"
              data={devices || []}
              loading={loading}
              title="Devices"
              searchPlaceholder="Search devices..."
              emptyMessage="No devices found. Add a new device to get started."
              itemsPerPage={10}
              buttonShow={false}
              showInfoColumn={false}
              showActions={true}
              tableName="Device"
              onBulkDelete={handleBulkDelete}
              searchableFields={[
                'device_name',
                'device_code',
                'description',
                'status',
                'created_at',
                'updated_at'
              ]}
              onEdit={handleEdit}
              onDelete={(device) => {
                setDeviceToDelete(device);
                setIsDeleteModalOpen(true);
              }}
              columns={[
                {
                  header: "Device Name",
                  accessor: "device_name",
                  render: (value, item) => (
                    <span className="text-primary font-weight-bold">{value}</span>
                  ),
                },
                {
                  header: "Device Code",
                  accessor: "device_code",
                  render: (value, item) => (
                    <span className="badge badge-warning">{value}</span>
                  ),
                },
                {
                  header: "Description",
                  accessor: "description",
                  render: (value, item) => (
                    <span className="text-muted">{value}</span>
                  ),
                },
                {
                  header: "Status",
                  accessor: "status",
                  render: (value, item) => (
                    <span className={`badge badge-${value === 'Active' ? 'success' : 'danger'}`}>
                      {value}
                    </span>
                  ),
                },
                {
                  header: "Device Fields",
                  accessor: "device_field",
                  render: (value, item) => (
                    <div>
                      {(value && value.length > 0)
                        ? value.map((field, idx) => (
                            <span key={field} className="badge badge-info mr-1">
                              {field}
                            </span>
                          ))
                        : <span className="text-muted">None</span>
                      }
                    </div>
                  ),
                },
                {
                  header: "Created At",
                  accessor: "created_at",
                  render: (value, item) => (
                    <span className="text-muted">
                      {value ? new Date(value).toLocaleDateString() : 'N/A'}
                    </span>
                  ),
                },
                {
                  header: "Reports",
                  accessor: "device_code",
                  render: (value, item) => (
                    <div className="dropdown">
                      <button 
                        className="btn btn-sm btn-outline-primary dropdown-toggle" 
                        type="button" 
                        id={`reportsDropdown-${item._id}`}
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                      >
                        <em className="icon ni ni-bar-chart"></em>
                        Reports
                      </button>
                      <ul className="dropdown-menu" aria-labelledby={`reportsDropdown-${item._id}`}>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => router.push(`/Pages/reports/temperature-humidity?deviceCode=${value}`)}
                          >
                            <em className="icon ni ni-thermometer"></em>
                            Temperature & Humidity
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => router.push(`/Pages/reports/device-performance?deviceCode=${value}`)}
                          >
                            <em className="icon ni ni-activity"></em>
                            Device Performance
                          </button>
                        </li>
                        <li>
                          <button 
                            className="dropdown-item" 
                            onClick={() => router.push(`/Pages/reports/activity-logs?deviceCode=${value}`)}
                          >
                            <em className="icon ni ni-list-check"></em>
                            Activity Logs
                          </button>
                        </li>
                      </ul>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-md" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>{isEditMode ? 'Edit Device' : 'Add Device'}</span>
                  </h5>
                  <button style={{ color: "#fff" }} className="close" onClick={closeModal} aria-label="Close">
                    <em className="icon ni ni-cross-sm"></em>
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body pt-3">
                    {formErrors.error && (
                      <div className="alert alert-danger">
                        {formErrors.error}
                      </div>
                    )}
                    <div className="form-group mt-1">
                      <label className="form-label"><span>Device Name</span></label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="device_name"
                          className={`form-control form-control-lg ${formErrors.device_name ? 'is-invalid' : ''}`}
                          placeholder="Enter device name"
                          value={formData.device_name}
                          onChange={handleInputChange}
                        />
                        {formErrors.device_name && (
                          <div className="invalid-feedback">{formErrors.device_name}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group mt-1">
                      <label className="form-label"><span>Device Code</span></label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="device_code"
                          className={`form-control form-control-lg ${formErrors.device_code ? 'is-invalid' : ''}`}
                          placeholder="Enter device code"
                          value={formData.device_code}
                          onChange={handleInputChange}
                        />
                        {formErrors.device_code && (
                          <div className="invalid-feedback">{formErrors.device_code}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group mt-1">
                      <label className="form-label"><span>Description</span></label>
                      <div className="form-control-wrap">
                        <textarea
                          name="description"
                          className={`form-control form-control-lg ${formErrors.description ? 'is-invalid' : ''}`}
                          placeholder="Enter description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                        />
                        {formErrors.description && (
                          <div className="invalid-feedback">{formErrors.description}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group mt-1">
                      <label className="form-label"><span>Status</span></label>
                      <div className="form-control-wrap">
                        <select
                          name="status"
                          className="form-control form-control-lg"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Device Fields Section */}
                    <div className="form-group mt-3">
                      <label className="form-label">
                        <span>Device Fields</span>
                        <small className="text-muted d-block">Select the inputs and outputs for this device</small>
                      </label>
                      <div className="form-control-wrap">
                        <div className="row">
                          {/* Input Fields */}
                          <div className="col-md-6">
                            <h6 className="text-primary mb-2">Input Fields</h6>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="inp1"
                                value="inp1"
                                checked={formData.device_field?.includes('inp1')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="inp1">
                                Input 1 (inp1)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="inp2"
                                value="inp2"
                                checked={formData.device_field?.includes('inp2')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="inp2">
                                Input 2 (inp2)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="inp3"
                                value="inp3"
                                checked={formData.device_field?.includes('inp3')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="inp3">
                                Input 3 (inp3)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="inp4"
                                value="inp4"
                                checked={formData.device_field?.includes('inp4')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="inp4">
                                Input 4 (inp4)
                              </label>
                            </div>
                          </div>
                          
                          {/* Output Fields */}
                          <div className="col-md-6">
                            <h6 className="text-success mb-2">Output Fields</h6>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="outp1"
                                value="outp1"
                                checked={formData.device_field?.includes('outp1')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="outp1">
                                Output 1 (outp1)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="outp2"
                                value="outp2"
                                checked={formData.device_field?.includes('outp2')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="outp2">
                                Output 2 (outp2)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="outp3"
                                value="outp3"
                                checked={formData.device_field?.includes('outp3')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="outp3">
                                Output 3 (outp3)
                              </label>
                            </div>
                            <div className="custom-control custom-checkbox mb-2">
                              <input
                                type="checkbox"
                                className="custom-control-input"
                                id="outp4"
                                value="outp4"
                                checked={formData.device_field?.includes('outp4')}
                                onChange={handleInputChange}
                              />
                              <label className="custom-control-label" htmlFor="outp4">
                                Output 4 (outp4)
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                      <div className="col-md-9"></div>
                      <div className="col-md-3 text-right pt-2">
                        <button type="submit" className="btn btn-primary w-100 justify-center" disabled={loading}>
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
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-sm" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>Delete Confirmation</span>
                  </h5>
                </div>
                <div className="modal-body pt-3">
                  <h5>Do you want to delete this device?</h5>
                  <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                    <div className="col-md-12"></div>
                    <div className="col-md-9 text-right pt-2">
                      <ul className="list-inline mb-0">
                        <li className="list-inline-item mr-2">
                          <button
                            type="button"
                            className="btn btn-primary w-100 justify-center"
                            onClick={() => deviceToDelete && handleDelete(deviceToDelete)}
                            disabled={loading || !deviceToDelete}
                          >
                            <span>Yes</span>
                          </button>
                        </li>
                        <li className="list-inline-item">
                          <button
                            type="button"
                            className="btn btn-danger w-100 justify-center"
                            onClick={() => setIsDeleteModalOpen(false)}
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
        )}

        {/* Bulk Delete Modal */}
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => {
            setIsBulkDeleteModalOpen(false);
            setSelectedDevices([]);
          }}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedDevices.length}
          tableName="Device"
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Page; 