"use client";
/**
 * Customer Device Management Page
 * 
 * This page manages devices assigned to a specific customer.
 * 
 * Navigation Flow:
 * 1. User selects a customer from the Customers page (/Pages/customers)
 * 2. DataTable component navigates to this page with customer_id parameter
 * 3. This page receives customer_id from URL params using useSearchParams()
 * 4. Page fetches customer details and displays customer information
 * 5. Modal shows available devices for assignment to the selected customer
 * 
 * URL Format: /Pages/customersdevice?customer_id={customerId}
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import BulkDeleteModal from '../../components/deleteModals/BulkDeleteModal';
import ThemeButton from "../../components/Theme/dynamicButton";
import {
  fetchCustomerDevices,
  addCustomerDevice,
  updateCustomerDevice,
  deleteCustomerDevice,
  deleteMultipleCustomerDevices,
  resetState
} from '../../store/slices/customerDeviceSlice';
import { fetchCustomers } from '../../store/slices/customerSlice';
import { fetchDevices } from '../../store/slices/deviceSlice';
import { useRouter, useSearchParams } from 'next/navigation';

function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customerDevices, loading, error, success } = useSelector((state) => state.customerDevice);
  const { customers, loading: customersLoading } = useSelector((state) => state.customer);
  const { devices, loading: devicesLoading } = useSelector((state) => state.device);

  // Extract customer_id from search params
  const customerId = searchParams.get('customer_id');

  // Local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCustomerDeviceId, setCurrentCustomerDeviceId] = useState(null);
  const [customerDeviceToDelete, setCustomerDeviceToDelete] = useState(null);
  const [selectedCustomerDevices, setSelectedCustomerDevices] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    device_code: '',
    title: '',
    device_serial_number: '',
    description: '',
    m1: '',
    m2: '',
    inp1: '',
    inp2: '',
    inp3: '',
    inp4: '',
    outp1: '',
    outp2: '',
    outp3: '',
    outp4: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});

  // Check for customer_id in URL params and redirect if missing
  useEffect(() => {
    if (!customerId) {
      // If no customer_id, redirect back to customers page
      router.push('/Pages/customers');
      return;
    }

    // Set the customer_id in form data
    setFormData(prev => ({
      ...prev,
      customer_id: customerId
    }));
  }, [customerId, router]);

  // Add error effect
  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error('Redux Error:', error);
    }
  }, [error]);

  // Fetch data only if customerId exists
  useEffect(() => {
    if (customerId) {
      dispatch(fetchCustomerDevices(customerId));
      dispatch(fetchCustomers());
      dispatch(fetchDevices());
    }
  }, [dispatch, customerId]);

  // Effect to handle success state and refetch customer devices
  useEffect(() => {
    if (success && customerId) {
      dispatch(fetchCustomerDevices(customerId));
      dispatch(resetState());
    }
  }, [success, dispatch, customerId]);

  const validateForm = () => {
    const errors = {};
    if (!formData.customer_id) errors.customer_id = 'Customer is required';
    if (!formData.device_code) errors.device_code = 'Device is required';
    if (!formData.title) errors.title = 'Title is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async (customerDevice) => {
    try {
      const customerDeviceId = customerDevice._id || customerDevice.id;
      console.log('Deleting customer device with ID:', customerDeviceId);

      const result = await dispatch(deleteCustomerDevice(customerDeviceId)).unwrap();
      if (result) {
        setIsDeleteModalOpen(false);
        setCustomerDeviceToDelete(null);
        toast.success('Customer device deleted successfully');
      } else {
        toast.error('Failed to delete customer device');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Error deleting customer device');
    }
  };

  const handleBulkDelete = (selectedIds, tableName) => {
    setSelectedCustomerDevices(selectedIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await dispatch(deleteMultipleCustomerDevices(selectedCustomerDevices)).unwrap();
      toast.success(`${selectedCustomerDevices.length} customer devices deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      setSelectedCustomerDevices([]);
    } catch (error) {
      toast.error(error.message || 'Failed to delete customer devices');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (customerDevice) => {
    setFormData({
      customer_id: customerDevice.customer_id || '',
      device_code: customerDevice.device_code || '',
      title: customerDevice.title || '',
      device_serial_number: customerDevice.device_serial_number || '',
      description: customerDevice.description || '',
      status: customerDevice.status || 'Active',
      // Keep m1, m2, inputs, outputs for form display but don't send them
      m1: customerDevice.m1 || '',
      m2: customerDevice.m2 || '',
      inp1: customerDevice.inp1 || '',
      inp2: customerDevice.inp2 || '',
      inp3: customerDevice.inp3 || '',
      inp4: customerDevice.inp4 || '',
      outp1: customerDevice.outp1 || '',
      outp2: customerDevice.outp2 || '',
      outp3: customerDevice.outp3 || '',
      outp4: customerDevice.outp4 || ''
    });

    setIsEditMode(true);
    setCurrentCustomerDeviceId(customerDevice._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Create payload with only the basic fields (exclude m1, m2, inputs, outputs)
      const payload = {
        customer_id: formData.customer_id,
        device_code: formData.device_code,
        title: formData.title,
        device_serial_number: formData.device_serial_number,
        description: formData.description,
        status: formData.status
      };

      let result;
      if (isEditMode && currentCustomerDeviceId) {
        result = await dispatch(updateCustomerDevice({ ...payload, _id: currentCustomerDeviceId })).unwrap();
      } else {
        result = await dispatch(addCustomerDevice(payload)).unwrap();
      }

      if (result) {
        closeModal();
        dispatch(fetchCustomerDevices(customerId));
        toast.success(isEditMode ? 'Customer device updated successfully' : 'Customer device added successfully');
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error('Error processing request');
    }
  };

  // Get customer name for display
  const getCurrentCustomerName = () => {
    if (!customerId) return 'Unknown Customer';
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.full_name : 'Unknown Customer';
  };

  // Get current customer details
  const getCurrentCustomer = () => {
    if (!customerId) return null;
    return customers.find(c => c._id === customerId);
  };

  // Get devices available for assignment (not already assigned to this customer)
  const getAvailableDevices = () => {
    if (!devices || !customerDevices) return [];

    const assignedDeviceCodes = customerDevices
      .filter(cd => cd.customer_id === customerId)
      .map(cd => cd.device_code);

    return devices.filter(device => !assignedDeviceCodes.includes(device.device_code));
  };

  const getDeviceName = (deviceCode) => {
    const device = devices.find(d => d.device_code === deviceCode);
    return device ? device.device_name : deviceCode;
  };

  const filteredCustomerDevices = customerDevices.filter(
    (device) => device.customer_id === customerId
  );

  // Define columns for DataTable
  const columns = [
    {
      header: "Device",
      accessor: "device_info",
      render: (value, item) => (
        <div className="d-flex align-items-center">
          {/* Circle avatar with first letter of title */}
          <div
            className="user-avatar mr-3"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#6576ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}
          >
            {(item.title || 'D').charAt(0).toUpperCase()}
          </div>
          {/* Title, Device Code, Serial Number */}
          <div>
            <div className="font-weight-bold text-primary">{item.title}</div>
            <div className="text-muted small">
              <span className="badge badge-info mr-1">{item.device_code}</span>
              <span className="badge badge-light">{item.device_serial_number}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: "Details",
      accessor: "details",
      render: (value, item) => {
        const description = item.description || '';
        const truncatedDesc = description.length > 30 ? description.substring(0, 30) + '...' : description;
        
        return (
          <div className="device-details">
            {/* Status Badge */}
            <div className="mb-1">
              <span className={`badge badge-${item.status === "Active" || item.status === 1 ? "success" : "danger"}`}>
                {item.status === 1 ? "Active" : item.status === 0 ? "Inactive" : item.status}
              </span>
            </div>
            
            {/* Description with Popup */}
            {description && (
              <div 
                className="position-relative d-inline-block mb-1"
                style={{ maxWidth: '100%' }}
              >
                <div 
                  className="text-muted small"
                  style={{ 
                    cursor: description.length > 30 ? 'help' : 'default',
                    fontSize: '12px'
                  }}
                  title={description.length <= 30 ? description : 'Hover to see full description'}
                  onMouseEnter={(e) => {
                    if (description.length > 30) {
                      const popup = e.target.nextElementSibling;
                      if (popup) {
                        popup.style.display = 'block';
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (description.length > 30) {
                      const popup = e.target.nextElementSibling;
                      if (popup) {
                        popup.style.display = 'none';
                      }
                    }
                  }}
                >
                  📝 {truncatedDesc}
                </div>
                {description.length > 30 && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      zIndex: 1000,
                      backgroundColor: '#fff',
                      border: '1px solid #e1e5e9',
                      borderRadius: '6px',
                      padding: '10px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      minWidth: '250px',
                      maxWidth: '350px',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      display: 'none',
                      marginTop: '2px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.display = 'block';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.display = 'none';
                    }}
                  >
                    <div className="font-weight-bold text-primary mb-1" style={{ fontSize: '11px' }}>
                      Description:
                    </div>
                    <div style={{ color: '#495057' }}>
                      {description}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Created Date */}
            <div className="text-muted" style={{ fontSize: '11px' }}>
              📅 {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : "N/A"}
            </div>
          </div>
        );
      },
    },

    {
      header: "Inputs",
      accessor: "inputs",
      render: (value, item) => {
        const inputs = ["inp1", "inp2", "inp3", "inp4"];
        
        return (
          <div className="input-controls d-flex flex-wrap">
            {inputs.map((inputKey, index) => {
              const inputValue = item[inputKey];
              const hasValue = inputValue && inputValue.trim() !== '';
              
              return (
                <button
                  key={inputKey}
                  className={`btn btn-xs mr-1 mb-1 ${hasValue ? 'btn-info' : 'btn-outline-secondary'}`}
                  style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px',
                    minWidth: '35px',
                    opacity: hasValue ? 1 : 0.5
                  }}
                  onClick={() => {
                    if (hasValue) {
                      alert(`Input ${index + 1}:\n${inputValue}`);
                    } else {
                      alert(`Input ${index + 1}: Not configured`);
                    }
                  }}
                  title={hasValue ? `Input ${index + 1}: ${inputValue}` : `Input ${index + 1}: Not configured`}
                  disabled={!hasValue}
                >
                  I{index + 1}
                </button>
              );
            })}
          </div>
        );
      },
    },
    {
      header: "Outputs",
      accessor: "outputs",
      render: (value, item) => {
        const outputs = ["outp1", "outp2", "outp3", "outp4"];
        
        return (
          <div className="output-controls d-flex flex-wrap">
            {outputs.map((outputKey, index) => {
              const outputValue = item[outputKey];
              const hasValue = outputValue && outputValue.trim() !== '';
              
              return (
                <button
                  key={outputKey}
                  className={`btn btn-xs mr-1 mb-1 ${hasValue ? 'btn-success' : 'btn-outline-secondary'}`}
                  style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px',
                    minWidth: '35px',
                    opacity: hasValue ? 1 : 0.5
                  }}
                  onClick={() => {
                    if (hasValue) {
                      alert(`Output ${index + 1}:\n${outputValue}`);
                    } else {
                      alert(`Output ${index + 1}: Not configured`);
                    }
                  }}
                  title={hasValue ? `Output ${index + 1}: ${outputValue}` : `Output ${index + 1}: Not configured`}
                  disabled={!hasValue}
                >
                  O{index + 1}
                </button>
              );
            })}
          </div>
        );
      },
    },
    {
      header: "M1/M2",
      accessor: "m_values",
      render: (value, item) => {
        return (
          <div className="m-values">
            {item.m1 && (
              <div className="mb-1">
                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                  M1: {item.m1}
                </span>
              </div>
            )}
            {item.m2 && (
              <div className="mb-1">
                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                  M2: {item.m2}
                </span>
              </div>
            )}
            {!item.m1 && !item.m2 && (
              <span className="text-muted small">-</span>
            )}
          </div>
        );
      },
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
  ];

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentCustomerDeviceId(null);
    setFormData({
      customer_id: customerId || '',
      device_code: '',
      title: '',
      device_serial_number: '',
      description: '',
      status: 'Active',
      // Reset display fields but they won't be sent
      m1: '',
      m2: '',
      inp1: '',
      inp2: '',
      inp3: '',
      inp4: '',
      outp1: '',
      outp2: '',
      outp3: '',
      outp4: ''
    });
    setFormErrors({});
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              CustomerDevices
            </h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of customer devices</p>
            </div>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb breadcrumb-arrow">
                <li className="breadcrumb-item">
                  <a href="/Pages/customers" className="text-primary">Customers</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {getCurrentCustomer() ? getCurrentCustomer().full_name : 'Customer Devices'}
                </li>
              </ol>
            </nav>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-outline-light"
                  onClick={() => router.push('/Pages/customers')}
                  text="Back to Customers"
                  icon="ni-arrow-left"
                />
              </li>
              <li>
                <ThemeButton
                  color="btn-primary"
                  onClick={openModal}
                  text="Add Customer Device"
                  icon="ni-plus"
                />
                <ThemeButton
                  color="btn-danger"
                  onClick={openModal}
                  text="Download Excel"
                  icon="ni-file-excel"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Customer Information Card */}
      {customerId && (
        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-inner">
              {customersLoading ? (
                <div className="d-flex align-items-center justify-content-center py-3">
                  <div className="spinner-border text-primary mr-2" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <span>Loading customer information...</span>
                </div>
              ) : getCurrentCustomer() ? (
                <div className="d-flex align-items-center">
                  <div className="user-avatar mr-3" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#6576ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}>
                    {getCurrentCustomer().full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{getCurrentCustomer().full_name}</h5>
                    <div className="text-muted">
                      <div><strong>Customer ID:</strong> {getCurrentCustomer()._id}</div>
                      <div><strong>Email:</strong> {getCurrentCustomer().email || 'Not provided'}</div>
                      {getCurrentCustomer().phone && (
                        <div><strong>Phone:</strong> {getCurrentCustomer().phone}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="badge badge-primary badge-lg">
                      {filteredCustomerDevices.length} Device{filteredCustomerDevices.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="text-muted">
                    <em className="icon ni ni-alert-circle" style={{ fontSize: '24px' }}></em>
                    <div className="mt-2">Customer not found</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="nk-block">
        <DataTable
          text="Total Customer Devices"
          data={filteredCustomerDevices}
          loading={loading}
          title="Customer Devices"
          searchPlaceholder="Search customer devices..."
          emptyMessage="No customer devices found. Add a new device to get started."
          itemsPerPage={10}
          showInfoColumn={false}
          showActions={true}
          tableName="CustomersDevice"
          onBulkDelete={handleBulkDelete}
          searchableFields={[
            "title",
            "device_code",
            "device_serial_number",
            "status",
            "description",
            "m1",
            "m2",
            "inp1",
            "inp2",
            "inp3",
            "inp4",
            "outp1",
            "outp2",
            "outp3",
            "outp4",
            "created_at",
          ]}
          onEdit={handleEdit}
          onDelete={(row) => {
            setCustomerDeviceToDelete(row);
            setIsDeleteModalOpen(true);
          }}
          columns={columns}
        />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal fade zoom show" style={{ display: "block" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h5 className="modal-title text-white">
                  <span>
                    {isEditMode ? 'Edit Customer Device' : 'Add Customer Device'}
                    {getCurrentCustomer() && (
                      <span className="ml-2">- {getCurrentCustomer().full_name}</span>
                    )}
                  </span>
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

                  {/* Customer Information Display
                  {getCurrentCustomer() && (
                    <div className="alert alert-info mb-3">
                      <div className="d-flex align-items-center">
                        <div className="user-avatar mr-3" style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#6576ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {getCurrentCustomer().full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-weight-bold">Selected Customer</div>
                          <div className="text-muted small">
                            <strong>ID:</strong> {getCurrentCustomer()._id}<br/>
                            <strong>Name:</strong> {getCurrentCustomer().full_name}<br/>
                            <strong>Email:</strong> {getCurrentCustomer().email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Row 1: Customer and Device */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>CustomerID</span></label>
                        <div className="form-control-wrap">
                          <select
                            name="customer_id"
                            className={`form-control form-control-lg ${formErrors.customer_id ? 'is-invalid' : ''}`}
                            value={formData.customer_id}
                            onChange={handleInputChange}
                            disabled={!!customerId} // Disable if customer_id is from URL
                          >
                            <option value="">Select Customer</option>
                            {customers && customers.map(customer => (
                              <option key={customer._id} value={customer._id}>
                                {customer._id}
                              </option>
                            ))}
                          </select>
                          {formErrors.customer_id && (
                            <div className="invalid-feedback">{formErrors.customer_id}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Title and Serial Number */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>Title</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="text"
                            name="title"
                            className={`form-control form-control-lg ${formErrors.title ? 'is-invalid' : ''}`}
                            placeholder="Enter title"
                            value={formData.title}
                            onChange={handleInputChange}
                          />
                          {formErrors.title && (
                            <div className="invalid-feedback">{formErrors.title}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>Serial Number</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="text"
                            name="device_serial_number"
                            className="form-control form-control-lg"
                            placeholder="Enter serial number"
                            value={formData.device_serial_number}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Description (Full Width) */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>Device Code</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="text"
                            name="device_code"
                            className="form-control form-control-lg"
                            placeholder="Enter device code"
                            value={formData.device_code}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
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
                  </div>
                  <div className="col-md-8">
                    <div className="form-group mt-1">
                      <label className="form-label"><span>Description</span></label>
                      <div className="form-control-wrap">
                        <textarea
                          name="description"
                          className="form-control form-control-lg"
                          placeholder="Enter description"
                          rows="3"
                          value={formData.description}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                <div className="row">
  <div className="col-md-8">
    <hr />
    <div className="form-group mt-1">
      <label className="form-label">
        <strong>Assigned Devices</strong>
      </label>
      <div
        className="device-checkbox-list"
        style={{
          maxHeight: '150px',
          overflowY: 'auto',
          border: '1px solid #e5e9f2',
          borderRadius: '4px',
          padding: '10px',
        }}
      >
        {Array.isArray(getCurrentCustomer().devices) && getCurrentCustomer().devices.length > 0 ? (
          getCurrentCustomer().devices.map((device, index) => (
            <div key={index} className="custom-control custom-radio mb-2">
              <input
                type="radio"
                className="custom-control-input"
                name="deviceSelect"
                id={`device-${index}`}
                value={device}
                checked={formData.device_code === device}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    device_code: e.target.value,
                  }))
                }
              />
              <label className="custom-control-label" htmlFor={`device-${index}`}>
                <span className="font-weight-medium">{device.toUpperCase()}</span>
              </label>
            </div>
          ))
        ) : (
          <p className="text-muted text-center py-2">No devices found</p>
        )}
      </div>

      {formData.device_code && (
        <div className="mt-2">
          <small className="text-success">
            <strong>Selected:</strong> {formData.device_code}
          </small>
        </div>
      )}
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
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => handleDelete(customerDeviceToDelete)}
          title="Delete Customer Device"
          message={`Are you sure you want to delete this customer device assignment?`}
        />
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={confirmBulkDelete}
          count={selectedCustomerDevices.length}
          title="Delete Customer Devices"
          message="Are you sure you want to delete the selected customer device assignments?"
        />
      )}
    </div>
  );
}

export default Page;