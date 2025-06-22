"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import BulkDeleteModal from '../../components/deleteModals/BulkDeleteModal';
import ThemeButton from "../../components/Theme/dynamicButton";
import { 
  fetchCustomers, 
  addCustomer, 
  updateCustomer, 
  deleteCustomer, 
  deleteMultipleCustomers,
  resetState 
} from '../../store/slices/customerSlice';
import { fetchDevices } from '../../store/slices/deviceSlice';
import { useRouter } from 'next/navigation';

function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { customers, loading, error, success } = useSelector((state) => state.customer);
  const { devices } = useSelector((state) => state.device);

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact: '',
    package_name: 'Basic',
    package_expiry: '',
    status: 'Active',
    password: '',
    devices: []
  });
  const [formErrors, setFormErrors] = useState({});

  // Add error effect
  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error('Redux Error:', error);
    }
  }, [error]);

  // Fetch customers on component mount
  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchDevices());
  }, [dispatch]);

  // Effect to handle success state and refetch customers
  useEffect(() => {
    if (success) {
      dispatch(fetchCustomers());
      dispatch(resetState());
    }
  }, [success, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name) errors.full_name = 'Full name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.contact) errors.contact = 'Contact is required';
    if (!formData.password) errors.password = 'Password is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async (customer) => {
    try {
      const customerId = customer._id || customer.id;
      console.log('Deleting customer with ID:', customerId);

      const result = await dispatch(deleteCustomer(customerId)).unwrap();
      if (result) {
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        toast.success('Customer deleted successfully');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Error deleting customer');
    }
  };

  const handleBulkDelete = (selectedIds, tableName) => {
    setSelectedCustomers(selectedIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await dispatch(deleteMultipleCustomers(selectedCustomers)).unwrap();
      toast.success(`${selectedCustomers.length} customers deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      setSelectedCustomers([]);
    } catch (error) {
      toast.error(error.message || 'Failed to delete customers');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerId(null);
    setFormData({ 
      full_name: '', 
      email: '', 
      contact: '', 
      package_name: 'Basic',
      package_expiry: '',
      status: 'Active',
      password: '',
      devices: []
    });
    setFormErrors({});
    dispatch(resetState());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeviceChange = (deviceCode, isChecked) => {
    setFormData(prev => ({
      ...prev,
      devices: isChecked 
        ? [...prev.devices, deviceCode]
        : prev.devices.filter(code => code !== deviceCode)
    }));
  };

  const getDeviceName = (deviceCode) => {
    const device = devices.find(d => d.device_code === deviceCode);
    return device ? device.device_name : deviceCode;
  };

  const getCustomerDevices = (customerDevices) => {
    if (!customerDevices || customerDevices.length === 0) {
      return 'No devices assigned';
    }
    
    const deviceNames = customerDevices.map(deviceCode => getDeviceName(deviceCode));
    return deviceNames.join(', ');
  };

  const getSelectedDevicesText = () => {
    if (!formData.devices || formData.devices.length === 0) {
      return 'No devices selected';
    }
    return formData.devices.map(code => getDeviceName(code)).join(', ');
  };

  const isDeviceSelected = (deviceCode) => {
    return formData.devices.includes(deviceCode);
  };

  const handleEdit = (customer) => {
    setFormData({
      full_name: customer.full_name || '',
      email: customer.email || '',
      contact: customer.contact || '',
      package_name: customer.package_name || 'Basic',
      package_expiry: customer.package_expiry ? new Date(customer.package_expiry).toISOString().split('T')[0] : '',
      status: customer.status || 'Active',
      password: customer.password || '',
      devices: customer.devices || []
    });
    setIsEditMode(true);
    setCurrentCustomerId(customer._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let result;
      if (isEditMode && currentCustomerId) {
        result = await dispatch(updateCustomer({ ...formData, _id: currentCustomerId })).unwrap();
      } else {
        result = await dispatch(addCustomer(formData)).unwrap();
      }

      if (result) {
        closeModal();
        dispatch(fetchCustomers());
        toast.success(isEditMode ? 'Customer updated successfully' : 'Customer added successfully');
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error('Error processing request');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getGradientColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
    ];
    
    // Generate a consistent color based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Customers Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your customers</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-primary"
                  onClick={openModal}
                  text="Add Customer"
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
              text="Total Customers"
              data={customers || []}
              loading={loading}
              title="Customers"
              searchPlaceholder="Search customers..."
              emptyMessage="No customers found. Add a new customer to get started."
              itemsPerPage={10}
              buttonShow={true}
              showInfoColumn={false}
              showActions={true}
              tableName="Customers"
              onBulkDelete={handleBulkDelete}
              searchableFields={[
                'full_name',
                'email',
                'contact',
                'package_name',
                'status',
                'created_at',
                'updated_at'
              ]}
              onEdit={handleEdit}
              onDelete={(customer) => {
                setCustomerToDelete(customer);
                setIsDeleteModalOpen(true);
              }}
              columns={[
                {
                  header: "Customer",
                  accessor: "customer_info",
                  render: (value, item) => (
                    <div className="d-flex align-items-center">
                      <div 
                        className="user-avatar mr-3"
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: getGradientColor(item.full_name || ''),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        {getInitials(item.full_name)}
                      </div>
                      <div className="user-info">
                        <div className="user-name font-weight-bold text-primary">
                          {item.full_name}
                        </div>
                        <div className="user-email text-muted small">
                          {item.email}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: "Contact",
                  accessor: "contact",
                  render: (value, item) => (
                    <span className="text-muted">{value || 'N/A'}</span>
                  ),
                },
                {
                  header: "Package",
                  accessor: "package_name",
                  render: (value, item) => (
                    <span className={`badge badge-${value === 'Premium' ? 'warning' : 'info'}`}>
                      {value}
                    </span>
                  ),
                },
                {
                  header: "Devices",
                  accessor: "devices",
                  render: (value, item) => {
                    const deviceNames = getCustomerDevices(item.devices);
                    const isTruncated = deviceNames.length > 30;
                    
                    return (
                      <div className="device-info position-relative">
                        <div className="device-count mb-1">
                          <span className={`badge badge-${item.devices && item.devices.length > 0 ? 'primary' : 'light'}`}>
                            {item.devices ? item.devices.length : 0} device{item.devices && item.devices.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div 
                          className="device-names text-muted small" 
                          style={{ 
                            maxWidth: '200px', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: isTruncated ? 'help' : 'default'
                          }}
                          title={isTruncated ? deviceNames : ''}
                        >
                          {deviceNames}
                        </div>
                        {item.devices && item.devices.length > 0 && isTruncated && (
                          <div 
                            className="device-hover-popup"
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              zIndex: 1000,
                              backgroundColor: '#fff',
                              border: '1px solid #e5e9f2',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              maxWidth: '300px',
                              display: 'none',
                              fontSize: '12px',
                              lineHeight: '1.4'
                            }}
                          >
                            <div className="popup-header mb-2" style={{ 
                              borderBottom: '1px solid #e5e9f2', 
                              paddingBottom: '4px',
                              fontWeight: 'bold',
                              color: '#364a63'
                            }}>
                              <em className="icon ni ni-devices mr-1"></em>
                              Assigned Devices ({item.devices.length})
                            </div>
                            <div className="popup-content">
                              {item.devices.map((deviceCode, index) => (
                                <div key={index} className="device-item mb-1" style={{ color: '#8094ae' }}>
                                  <em className="icon ni ni-check-circle-fill mr-1" style={{ color: '#6576ff', fontSize: '10px' }}></em>
                                  {getDeviceName(deviceCode)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div 
                          className="device-names-container"
                          onMouseEnter={(e) => {
                            if (isTruncated) {
                              const popup = e.currentTarget.querySelector('.device-hover-popup');
                              if (popup) popup.style.display = 'block';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isTruncated) {
                              const popup = e.currentTarget.querySelector('.device-hover-popup');
                              if (popup) popup.style.display = 'none';
                            }
                          }}
                        >
                        </div>
                      </div>
                    );
                  },
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
                  header: "Created At",
                  accessor: "created_at",
                  render: (value, item) => (
                    <span className="text-muted">
                      {value ? new Date(value).toLocaleDateString() : 'N/A'}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>{isEditMode ? 'Edit Customer' : 'Add Customer'}</span>
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
                    
                    {/* Row 1: Full Name and Email */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Full Name</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="full_name"
                              className={`form-control form-control-lg ${formErrors.full_name ? 'is-invalid' : ''}`}
                              placeholder="Enter full name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                            />
                            {formErrors.full_name && (
                              <div className="invalid-feedback">{formErrors.full_name}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Email</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="email"
                              name="email"
                              className={`form-control form-control-lg ${formErrors.email ? 'is-invalid' : ''}`}
                              placeholder="Enter email"
                              value={formData.email}
                              onChange={handleInputChange}
                            />
                            {formErrors.email && (
                              <div className="invalid-feedback">{formErrors.email}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Contact and Password */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Contact</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="text"
                              name="contact"
                              className={`form-control form-control-lg ${formErrors.contact ? 'is-invalid' : ''}`}
                              placeholder="Enter contact number"
                              value={formData.contact}
                              onChange={handleInputChange}
                            />
                            {formErrors.contact && (
                              <div className="invalid-feedback">{formErrors.contact}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Password</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="password"
                              name="password"
                              className={`form-control form-control-lg ${formErrors.password ? 'is-invalid' : ''}`}
                              placeholder="Enter password"
                              value={formData.password}
                              onChange={handleInputChange}
                            />
                            {formErrors.password && (
                              <div className="invalid-feedback">{formErrors.password}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Package and Package Expiry */}
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Package</span></label>
                          <div className="form-control-wrap">
                            <select
                              name="package_name"
                              className="form-control form-control-lg"
                              value={formData.package_name}
                              onChange={handleInputChange}
                            >
                              <option value="Basic">Basic</option>
                              <option value="Premium">Premium</option>
                              <option value="Enterprise">Enterprise</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Package Expiry</span></label>
                          <div className="form-control-wrap">
                            <input
                              type="date"
                              name="package_expiry"
                              className="form-control form-control-lg"
                              value={formData.package_expiry}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Status (Full Width) */}
                    <div className="row">
                      <div className="col-md-6">
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
                      </div>
                      <div className="col-md-6">
                        {/* Empty column for balance */}
                      </div>
                    </div>

                    {/* Row 5: Assign Devices (Full Width) */}
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group mt-1">
                          <label className="form-label"><span>Assign Devices</span></label>
                          <div className="form-control-wrap">
                            <div className="device-checkbox-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e9f2', borderRadius: '4px', padding: '10px' }}>
                              {devices && devices.length > 0 ? (
                                devices.map(device => (
                                  <div key={device._id} className="custom-control custom-checkbox mb-2">
                                    <input
                                      type="checkbox"
                                      className="custom-control-input"
                                      id={`device-${device._id}`}
                                      checked={isDeviceSelected(device.device_code)}
                                      onChange={(e) => handleDeviceChange(device.device_code, e.target.checked)}
                                    />
                                    <label className="custom-control-label" htmlFor={`device-${device._id}`}>
                                      <span className="font-weight-medium">{device.device_name}</span>
                                      <small className="text-muted ml-2">({device.device_code})</small>
                                    </label>
                                  </div>
                                ))
                              ) : (
                                <div className="text-muted text-center py-3">
                                  No devices available
                                </div>
                              )}
                            </div>
                            {formData.devices && formData.devices.length > 0 && (
                              <div className="mt-2">
                                <small className="text-success">
                                  <strong>Selected:</strong> {getSelectedDevicesText()}
                                </small>
                              </div>
                            )}
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
                  <h5>Do you want to delete this customer?</h5>
                  <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                    <div className="col-md-12"></div>
                    <div className="col-md-9 text-right pt-2">
                      <ul className="list-inline mb-0">
                        <li className="list-inline-item mr-2">
                          <button
                            type="button"
                            className="btn btn-primary w-100 justify-center"
                            onClick={() => customerToDelete && handleDelete(customerToDelete)}
                            disabled={loading || !customerToDelete}
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
            setSelectedCustomers([]);
          }}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedCustomers.length}
          tableName="Customers"
          loading={loading}
        />
      </div>
    </div>
  );
}

export default Page; 