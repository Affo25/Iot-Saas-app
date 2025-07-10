"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import BulkDeleteModal from '../../components/deleteModals/BulkDeleteModal';
import ThemeButton from "../../components/Theme/dynamicButton";
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

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
import { getCurrentUser } from '../../store/slices/authSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elsie } from "next/font/google";

// Separate component to handle search params
function CustomerDeviceContent() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customerDevices, loading, error, success } = useSelector((state) => state.customerDevice);
  const { customers, loading: customersLoading } = useSelector((state) => state.customer);
  const { devices, loading: devicesLoading } = useSelector((state) => state.device);
  const { user, customer, loading: authLoading } = useSelector((state) => state.auth);

  // Get user details from localStorage
  const [currentUser, setCurrentUser] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [customerRecord, setCustomerRecord] = useState(null);

  // Extract customer_id from search params (for admin) or get from logged-in user (for customer)
  const urlCustomerId = searchParams.get('customer_id');

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
    warning_points: '',
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

  // Get user details from localStorage on component mount
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (userStr && token) {
          const userData = JSON.parse(userStr);
          setCurrentUser(userData);
          setUserRole(userData.userRole);

          // If user is a customer, use their customer_id to fetch customer record
          if (userData.userRole === 'Customer') {
            const customerIdFromUser = userData.customer_id;
            setCustomerId(customerIdFromUser);
            setFormData(prev => ({
              ...prev,
              customer_id: customerIdFromUser
            }));

            // Fetch the actual customer record to get devices
            if (customerIdFromUser && customerIdFromUser !== "No Customer") {
              fetchCustomerRecord(customerIdFromUser);
            }
          } else if (userData.userRole === 'Admin' && urlCustomerId) {
            // If user is admin and customer_id is in URL, use that
            setCustomerId(urlCustomerId);
            setFormData(prev => ({
              ...prev,
              customer_id: urlCustomerId
            }));
          } else if (userData.userRole === 'Admin' && !urlCustomerId) {
            // If admin but no customer_id in URL, redirect to customers page
            router.push('/Pages/customers');
            return;
          }
        } else {
          // No user data in localStorage, redirect to login
          router.push('/Pages/Auth/Login');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        router.push('/Pages/Auth/Login');
        return;
      }
    };

    getUserFromStorage();
  }, [urlCustomerId, router]);

  // Check for customer_id and redirect if missing (for admin)
  useEffect(() => {
    if (userRole === 'Admin' && !urlCustomerId) {
      // If admin but no customer_id, redirect back to customers page
      router.push('/Pages/customers');
      return;
    }
  }, [userRole, urlCustomerId, router]);

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

  // Add event listener for customer device updates from device logs
  useEffect(() => {
    const handleCustomerDeviceUpdate = (event) => {
      console.log('🔄 Customer device updated via device log, refreshing data...', event.detail);
      if (customerId) {
        dispatch(fetchCustomerDevices(customerId));
      }
    };

    window.addEventListener('customerDeviceUpdated', handleCustomerDeviceUpdate);
    
    return () => {
      window.removeEventListener('customerDeviceUpdated', handleCustomerDeviceUpdate);
    };
  }, [customerId, dispatch]);

  // Function to fetch customer record
  const fetchCustomerRecord = async (customerId) => {
    try {
      const response = await fetch(`/api/Dashboard/CustomerRecord?customer_id=${customerId}`);
      const data = await response.json();

      if (data.success && data.data.customer) {
        setCustomerRecord(data.data.customer);
        console.log('Customer record fetched:', data.data.customer);
      } else {
        console.error('Failed to fetch customer record:', data.message);
      }
    } catch (error) {
      console.error('Error fetching customer record:', error);
    }
  };

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
      warning_points: customerDevice.warning_points || '',
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
        warning_points: formData.warning_points,
        device_serial_number: formData.device_serial_number,
        description: formData.description,
        last_updated: new Date().toISOString(), // Automatically set current datetime
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

    // If current user is a customer, use their name
    if (userRole === 'Customer' && currentUser) {
      return currentUser.full_name || currentUser.email || 'Current Customer';
    }

    // If admin, find customer from customers list
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.full_name : 'Unknown Customer';
  };

  // Get current customer details
  const getCurrentCustomer = () => {
    if (!customerId) return null;

    // If current user is a customer, return the customer record
    if (userRole === 'Customer' && customerRecord) {
      return customerRecord;
    }

    // If admin, find customer from customers list
    return customers.find(c => c._id === customerId);
  };

  // Get customer display name safely
  const getCustomerDisplayName = () => {
    const customer = getCurrentCustomer();
    if (!customer) return 'Unknown Customer';

    // Try different possible name fields
    return customer.full_name || customer.name || customer.email || 'Unknown Customer';
  };

  // Get customer initial for avatar
  const getCustomerInitial = () => {
    const customer = getCurrentCustomer();
    if (!customer) return '?';

    const name = customer.full_name || customer.name || customer.email || '';
    return name.charAt(0).toUpperCase() || '?';
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

  const getDevicePermissions = (deviceCode) => {
    const device = devices.find(d => d.device_code === deviceCode);
    return device ? device.device_field || [] : [];
  };

  const filteredCustomerDevices = customerDevices.filter(
    (device) => device.customer_id === customerId
  );

  const reportPageNavigation = async (code, deviceCodes) => {
    console.log("code", code);

    try {
      // Start the loading bar
      NProgress.start();

      // Navigate based on device code
      let targetUrl;
      if (deviceCodes === "WTL01") {
        targetUrl = `/Pages/reports/temperature-humidity?serialCode=${code}&&deviceCode=${deviceCodes}`;
      } else if (deviceCodes === "WCS4-01") {
        targetUrl = `/Pages/reports/temperature-humidity?serialCode=${code}&&deviceCode=${deviceCodes}`;
      } else if (deviceCodes === "WCS4-02") {
        targetUrl = `/Pages/reports/temperature-humidity?serialCode=${code}&&deviceCode=${deviceCodes}`;
      }

      console.log('Navigating to:', targetUrl);

      // Use await to ensure navigation completes
      await router.push(targetUrl);

      // Complete the loading bar after navigation
      setTimeout(() => {
        NProgress.done();
      }, 5000);

    } catch (error) {
      console.error('Navigation error:', error);
      NProgress.done();
      toast.error('Failed to navigate to report page');
    }
  };

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
            <div className="font-weight-bold text-primary">{item.title.toUpperCase()}</div>
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
      header: "Device Fields",
      accessor: "device_fields",
      render: (value, item) => {
        const deviceFields = getDevicePermissions(item.device_code);
        
        if (!deviceFields || deviceFields.length === 0) {
          return (
            <div className="text-center">
              <span className="text-muted small">No fields</span>
            </div>
          );
        }

        return (
          <div className="device-fields-controls">
            <div className="d-flex flex-wrap">
              {deviceFields.map((field, index) => {
                // Determine button style based on field type
                let buttonClass = 'btn-secondary';
                let buttonText = field.toUpperCase();
                
                if (field.startsWith('inp')) {
                  buttonClass = 'btn-info';
                  buttonText = field.replace('inp', 'I');
                } else if (field.startsWith('outp')) {
                  buttonClass = 'btn-success';
                  buttonText = field.replace('outp', 'O');
                } else if (field.startsWith('m')) {
                  buttonClass = 'btn-warning';
                  buttonText = field.toUpperCase();
                }

                // Get the actual value from the customer device record
                const fieldValue = item[field];
                const hasValue = fieldValue && fieldValue.trim() !== '';

                return (
                  <button
                    key={index}
                    className={`btn btn-xs ${buttonClass} mr-1 mb-1`}
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      minWidth: '35px',
                      opacity: hasValue ? 1 : 0.7,
                      border: hasValue ? '2px solid #fff' : '1px solid transparent'
                    }}
                    onClick={() => {
                      if (hasValue) {
                        alert(`${field.toUpperCase()}:\n${fieldValue}`);
                      } else {
                        alert(`${field.toUpperCase()}: Not configured`);
                      }
                    }}
                    title={hasValue ? `${field.toUpperCase()}: ${fieldValue}` : `${field.toUpperCase()}: Available but not configured`}
                  >
                    {buttonText}
                  </button>
                );
              })}
            </div>
            <div className="text-muted mt-1" style={{ fontSize: '9px' }}>
              {deviceFields.length} field{deviceFields.length !== 1 ? 's' : ''} available
            </div>
          </div>
        );
      },
    },
    {
      header: "Warning Points",
      accessor: "warning_points",
      render: (value, item) => {
        const warningPoints = value || 0;
        return (
          <div className="text-center">
            <span className={`badge badge-${warningPoints > 5 ? 'danger' : warningPoints > 2 ? 'warning' : 'success'}`}>
              {warningPoints}
            </span>
          </div>
        );
      },
    },
    {
      header: "Last Updated",
      accessor: "last_updated",
      render: (value, item) => {
        if (!value) return <span className="text-muted">Never</span>;
        
        const date = new Date(value);
        if (isNaN(date.getTime())) return <span className="text-muted">Invalid Date</span>;
        
        return (
          <div className="text-center">
            <div className="text-primary" style={{ fontSize: '12px' }}>
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-muted" style={{ fontSize: '11px' }}>
              {date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        );
      },
    },
    {
      header: "Reports",
      accessor: "device_code",
      render: (value, item) => (
        <div className="button">
          <button
            onClick={() => reportPageNavigation(item.device_serial_number, item.device_code)}
            className="btn btn-sm btn-outline-primary dropdown-toggle"
            type="button"
            id={`reportsDropdown-${item._id}`}
          // data-bs-toggle="dropdown" 
          // aria-expanded="false"ss
          >
            <em className="icon ni ni-bar-chart"></em>
            Reports
          </button>
          {/* <ul className="dropdown-menu" aria-labelledby={`reportsDropdown-${item._id}`}>
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
                      </ul> */}
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
      warning_points: '',
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

  // Show loading state while getting user data
  if (!currentUser || !customerId) {
    return (
      <div className="nk-content-body">
        <div className="d-flex align-items-center justify-content-center py-5">
          <div className="spinner-border text-primary mr-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <span>Loading user information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">
              Customer Devices
            </h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of customer devices</p>
            </div>

          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-danger"
                  onClick={openModal}
                  text="Download Excel"
                  icon="ni-file"
                />
                <ThemeButton
                  color="btn-primary"
                  onClick={openModal}
                  text="Add Customer Device"
                  icon="ni-plus"
                />

              </li>
            </ul>
          </div>
        </div>
      </div>


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
            "warning_points",
            "last_updated",
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
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h5 className="modal-title text-white">
                  <span>
                    {isEditMode ? 'Edit Customer Device' : 'Add Customer Device'}
                    {getCurrentCustomer() && (
                      <span className="ml-2">- {getCustomerDisplayName()}</span>
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
                            disabled={userRole === 'Customer' || !!urlCustomerId} // Disable if customer or if customer_id is from URL
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

                  {/* Row 2: Title and Serial Number */}
                  <div className="row">

                  </div>

                  {/* Row 3: Description (Full Width) */}
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
                      <div className="col-md-5">
                      <hr />
                      <div className="form-group mt-1">
                        <label className="form-label">
                          <strong>Assigned Devices</strong>
                        </label>

                        {getCurrentCustomer() && Array.isArray(getCurrentCustomer().devices) && getCurrentCustomer().devices.length > 0 ? (
                          <select
                            className="form-control"
                            name="device_code"
                            value={formData.device_code}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                device_code: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select a device</option>
                            {getCurrentCustomer().devices.map((device, index) => (
                              <option key={index} value={device}>
                                {device.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-muted text-center py-2">
                            {userRole === 'Customer' ? 'No devices assigned to your account' : 'No devices found'}
                          </p>
                        )}

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
                  {formData.device_code!=="" && (
                        <div className="row">
                    <div className="col-md-6">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>Device Title</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="text"
                            name="title"
                            className={`form-control form-control-lg ${formErrors.title ? 'is-invalid' : ''}`}
                            placeholder="Enter device title"
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
                        <label className="form-label"><span>Warning Points</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="number"
                            name="warning_points"
                            className="form-control form-control-lg"
                            placeholder="Enter warning points"
                            value={formData.warning_points}
                            onChange={handleInputChange}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  )}


                 

                  <div className="row">
                    <div className="col-md-6">
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

// Loading component for Suspense fallback
function CustomerDeviceLoading() {
  return (
    <div className="nk-content-body">
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary mr-2" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <span>Loading customer devices...</span>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
function Page() {
  return (
    <Suspense fallback={<CustomerDeviceLoading />}>
      <CustomerDeviceContent />
    </Suspense>
  );
}

export default Page;
