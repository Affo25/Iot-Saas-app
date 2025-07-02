'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function PagesLayout() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [customerRecord, setCustomerRecord] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [activeDevices, setActiveDevices] = useState([]);
  const [inactiveDevices, setInactiveDevices] = useState([]);


  const { customerDevices, loading, error, success } = useSelector((state) => state.customerDevice);

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

            //fetchCustomerRecord(customerId);

          } else if (userData.userRole === 'Admin') {
            // If admin but no customer_id in URL, redirect to customers page
            //router.push('/Pages/customers');
            return;
          }
        } else {
          // No user data in localStorage, redirect to login
          //router.push('/Pages/Auth/Login');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        router.push('/Pages/Auth/Login');
        return;
      }
    };

    getUserFromStorage();
  }, [customerId, router]);
  // Fetch data only if customerId exists
  // Trigger data fetch when customerId changes
  useEffect(() => {
    if (customerId) {
      console.log("Fetching devices for customer ID:", customerId);
      dispatch(fetchCustomerDevices(customerId));
      fetchCustomerRecord(customerId);
    }
  }, [dispatch, customerId]);

  // Watch for updated customerDevices and then filter
  useEffect(() => {
    console.log("customerDevices updated:", customerDevices);
    if (customerDevices && customerDevices.length > 0) {
      filterDevices(customerDevices);
    } else {
      setActiveDevices([]);
      setInactiveDevices([]);
      console.log("No customer devices found, resetting active and inactive devices");
    }
  }, [customerDevices]);

  // Filtering function for both active and inactive devices
  const filterDevices = (devices) => {
    console.log("Processing devices for active/inactive status:", devices.length);
    console.log("Sample device structure:", devices[0]);
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    console.log("One hour ago timestamp:", oneHourAgo);

    const activeList = [];
    const inactiveList = [];

    devices.forEach(device => {
      const lastUpdate = new Date(device.last_updated);
      const isValidDate = !isNaN(lastUpdate.getTime());
      const isActive = isValidDate && lastUpdate > oneHourAgo;
      
      console.log(`Device ${device.device_serial_number}: last_updated=${device.last_updated}, isActive=${isActive}`);
      
      if (isActive) {
        activeList.push(device);
      } else {
        inactiveList.push(device);
      }
    });

    setActiveDevices(activeList);
    setInactiveDevices(inactiveList);
    console.log("Active devices count:", activeList.length);
    console.log("Inactive devices count:", inactiveList.length);
    console.log("Active devices:", activeList);
    console.log("Inactive devices:", inactiveList);
  };



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

  // Function to test updating device timestamp
  const testUpdateDeviceTimestamp = async (deviceSerial) => {
    try {
      const response = await fetch('/api/Dashboard/CustomerDevice/updateLastUpdatedBySerial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_serial_number: deviceSerial,
          last_updated: new Date().toISOString()
        })
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        // Refresh devices data
        dispatch(fetchCustomerDevices(customerId));
        console.log('Device timestamp updated successfully');
      }
    } catch (error) {
      console.error('Error updating device timestamp:', error);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Dashboard</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">Please refresh the page or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }



  return (
    <div className="container-fluid">
      <div className="nk-content-body">
        <div className="nk-block-head nk-block-head-sm">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h2 className="card-title">
                Welcome!
              </h2>
              <p className="card-text">
                This is your customer dashboard. You can manage customers, devices, and view all reports from here.

              </p>
            </div>
          </div>
        </div>
        <div className="nk-block mt-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div style={{ "border-top": "4px solid #007bff" }} className="card card-bordered">
                <div className="card-inner">
                  <div className="d-flex align-items-center mb-2">
                    <i className="icon ni ni-server text-primary me-2" style={{ fontSize: "1.5rem" }}></i>
                    <h4 className="card-title mb-0">Total Devices</h4>
                  </div>
                  <p className="card-text">Total assigned devices to user.</p>
                  <Link href="/Pages/devices" className="btn btn-primary">
                    {customerDevices?.length ?? "N/A"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div style={{ borderTop: "4px solid #28a745" }} className="card card-bordered">
                <div className="card-inner">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <i className="icon ni ni-activity-round text-success me-2" style={{ fontSize: "1.5rem" }}></i>
                      <h6 className="card-title mb-0">Active Devices</h6>
                    </div>
                    <span
                      className="badge d-inline-flex align-items-center gap-2 transition-ease-in-out duration-500"
                      style={{
                        backgroundColor: "#28a745",
                        padding: "6px 12px",
                        height:"25px",
                        borderRadius: "4px",
                        color: "#fff",
                      }}
                    >
                      <span className="dot dot-success"></span>
                      Running
                    </span>
                  </div>

                  <p className="card-text">Devices updated within last hour.</p>

                  <Link href="/Pages/reports/temperature-humidity" className="btn btn-success">
                    {activeDevices.length ?? "N/A"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div style={{ borderTop: "4px solid #dc3545" }} className="card card-bordered">
                <div className="card-inner">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <i className="icon ni ni-cross-circle text-danger me-2" style={{ fontSize: "1.5rem" }}></i>
                      <h6 className="card-title mb-0">Inactive Devices</h6>
                    </div>
                    <span
                      className="badge d-inline-flex align-items-center gap-2 transition-ease-in-out duration-500"
                      style={{
                        backgroundColor: "#dc3545",
                        padding: "6px 12px",
                         height:"25px",
                        borderRadius: "4px",
                        color: "#fff",
                      }}
                    >
                      <span className="dot dot-danger"></span>
                      Offline
                    </span>
                  </div>

                  <p className="card-text">Devices not updated for over 1 hour.</p>

                  <Link href="/Pages/devices" className="btn btn-danger">
                    {inactiveDevices.length ?? "N/A"}
                  </Link>
                </div>
              </div>
            </div>


          </div>
        </div>
        
        {/* Active Devices List - Only show if there are active devices */}
        {activeDevices.length > 0 && (
          <div className="nk-block">
            <div className="card card-bordered">
              <div className="card-inner">
                <h5 className="card-title">
                  <i className="icon ni ni-activity-round text-success me-2"></i>
                  Active Devices (Last 1 Hour)
                </h5>
                <p className="card-text mb-3">
                  Devices that have been updated within the last hour
                </p>
                
                <div className="row g-3">
                  {activeDevices.map((device, index) => (
                    <div key={device._id || index} className="col-md-6 col-lg-4">
                      <div className="card card-bordered border-success">
                        <div className="card-inner">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge badge-success">
                              <span className="dot dot-success me-1"></span>
                              Active
                            </span>
                          </div>
                          <h6 className="card-title text-success mb-2">
                            {device.device_serial_number || 'N/A'}
                          </h6>
                          <p className="card-text">
                            <strong>Device Code:</strong> <br />
                            <span className="badge badge-outline-primary">
                              {device.device_code || 'N/A'}
                            </span>
                          </p>
                          <small className="text-muted">
                            Last updated: {device.last_updated 
                              ? new Date(device.last_updated).toLocaleString()
                              : 'N/A'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inactive Devices List - Only show if there are inactive devices */}
        {inactiveDevices.length > 0 && (
          <div className="nk-block">
            <div className="card card-bordered">
              <div className="card-inner">
                <h5 className="card-title">
                  <i className="icon ni ni-cross-circle text-danger me-2"></i>
                  Inactive Devices (Over 1 Hour)
                </h5>
                <p className="card-text mb-3">
                  Devices that have not been updated for more than 1 hour
                </p>
                
                <div className="row g-3">
                  {inactiveDevices.map((device, index) => (
                    <div key={device._id || index} className="col-md-6 col-lg-4">
                      <div className="card card-bordered border-danger">
                        <div className="card-inner">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge badge-danger">
                              <span className="dot dot-danger me-1"></span>
                              Inactive
                            </span>
                          </div>
                          <h6 className="card-title text-danger mb-2">
                            {device.device_serial_number || 'N/A'}
                          </h6>
                          <p className="card-text">
                            <strong>Device Code:</strong> <br />
                            <span className="badge badge-outline-secondary">
                              {device.device_code || 'N/A'}
                            </span>
                          </p>
                          <small className="text-muted">
                            Last updated: {device.last_updated 
                              ? new Date(device.last_updated).toLocaleString()
                              : 'N/A'
                            }
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Testing Section - Remove in production */}
        {/* {customerDevices && customerDevices.length > 0 && (
          <div className="nk-block">
            <div className="card card-bordered border-warning">
              <div className="card-inner">
                <h6 className="card-title text-warning">
                  <i className="icon ni ni-setting text-warning me-2"></i>
                  Testing Tools (Development Only)
                </h6>
                <p className="card-text small text-muted mb-3">
                  Use these buttons to test device activity status by updating timestamps
                </p>
                <div className="row g-2">
                  {customerDevices.slice(0, 3).map((device, index) => (
                    <div key={device._id || index} className="col-md-4">
                      <button 
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => testUpdateDeviceTimestamp(device.device_serial_number)}
                      >
                        Update {device.device_serial_number}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <small className="text-muted">
                    Total devices: {customerDevices.length} | Active: {activeDevices.length} | Inactive: {inactiveDevices.length}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )} */}



        {/* Reports Section */}
        {/* <div className="nk-block mt-4">
          <div className="card card-bordered">
            <div className="card-inner">
              <h6 className="card-title">Reports & Analytics</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <Link href="/Pages/reports/device-performance" className="btn btn-outline-primary w-100">
                    Device Performance
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link href="/Pages/reports/temperature-humidity" className="btn btn-outline-primary w-100">
                    Temperature & Humidity
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link href="/Pages/reports/activity-logs" className="btn btn-outline-primary w-100">
                    Activity Logs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
} 