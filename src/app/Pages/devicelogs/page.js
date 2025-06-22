"use client";
import React, { useState, useEffect } from "react";
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import {
  fetchEnhancedDeviceLogs,
  fetchDeviceLogsByDeviceCode,
  addDeviceLog,
  updateDeviceLog,
  deleteDeviceLog,
  deleteMultipleDeviceLogs,
  resetState
} from '../../store/slices/deviceLogSlice';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import DataTable from '../../components/Tables/DataTable';
import DeleteModal from '../../components/deleteModals/DeleteModal';
import BulkDeleteModal from '../../components/deleteModals/BulkDeleteModal';
import ThemeButton from "../../components/Theme/dynamicButton";
import { fetchCustomers } from '../../store/slices/customerSlice';

function Page() {
  // Redux state and dispatch
  const dispatch = useDispatch();
  const { deviceLogs: reduxDeviceLogs, loading: reduxLoading, error: reduxError, success } = useSelector((state) => state.deviceLog);
  const { devices } = useSelector((state) => state.device);
  const { customers: reduxCustomers, loading: customersLoading } = useSelector((state) => state.customer);

  // Local state
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [logToDelete, setLogToDelete] = useState(null);
  const [selectedDeviceLogs, setSelectedDeviceLogs] = useState([]);
  const [metaString, setMetaString] = useState('{}');
  const [isFiltered, setIsFiltered] = useState(false);
  const [currentFilter, setCurrentFilter] = useState('');
  const [formData, setFormData] = useState({
    device_code: '',
    humidity: 0,
    temperature: 0,
    meta: {}
  });
  const [formErrors, setFormErrors] = useState({});
  const [customerDevices, setCustomerDevices] = useState([]);

  // Process data for charts
  const getChartData = () => {
    if (!reduxDeviceLogs || reduxDeviceLogs.length === 0) return [];
    
    return reduxDeviceLogs.slice(0, 10).map((log, index) => ({
      name: `Log ${index + 1}`,
      temperature: log.temperature || 0,
      humidity: log.humidity || 0,
      device: log.device_title || log.device_code || 'Unknown',
      timestamp: new Date(log.created_at || Date.now()).toLocaleTimeString()
    }));
  };

  const chartData = getChartData();

  // Add error effect
  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      console.error('Redux Error:', reduxError);
    }
  }, [reduxError]);

  // Modify the fetch effect to include error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchEnhancedDeviceLogs()).unwrap();
      } catch (error) {
        console.error('Error fetching enhanced device logs:', error);
        toast.error('Failed to fetch device logs');
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedUser) {
      setCustomerDevices([]);
      return;
    }
    const customer = reduxCustomers.find(c => c._id === selectedUser);
    setCustomerDevices(customer?.devices || []);
  }, [selectedUser, reduxCustomers]);

  // Effect to handle success state and refetch device logs
  useEffect(() => {
    if (success) {
      dispatch(fetchEnhancedDeviceLogs());
      dispatch(resetState());
    }
  }, [success, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.device_code) errors.device_code = 'Device code is required';
    if (formData.humidity === '') errors.humidity = 'Humidity is required';
    if (formData.temperature === '') errors.temperature = 'Temperature is required';

    try {
      JSON.parse(metaString);
    } catch (e) {
      errors.meta = 'Invalid JSON format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShowData = async () => {
    if (!selectedUser || !selectedDevice) {
      toast.error('Please select both user and device');
      return;
    }
    
    try {
      // Fetch device logs filtered by the selected device code
      await dispatch(fetchDeviceLogsByDeviceCode(selectedDevice)).unwrap();
      setIsFiltered(true);
      setCurrentFilter(selectedDevice);
      toast.success(`Showing data for Device: ${selectedDevice}`);
    } catch (error) {
      console.error('Error fetching filtered device logs:', error);
      toast.error('Failed to fetch device logs for selected device');
    }
  };

  const handleShowAllData = async () => {
    try {
      // Fetch all device logs
      await dispatch(fetchEnhancedDeviceLogs()).unwrap();
      setIsFiltered(false);
      setCurrentFilter('');
      toast.success('Showing all device logs');
    } catch (error) {
      console.error('Error fetching all device logs:', error);
      toast.error('Failed to fetch all device logs');
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const handleDelete = async (deviceLog) => {
    try {
      // Extract the ID from the deviceLog object
      const logId = deviceLog._id || deviceLog.id;
      console.log('Deleting device log with ID:', logId);

      const result = await dispatch(deleteDeviceLog(logId)).unwrap();
      if (result) {
        setIsDeleteModalOpen(false);
        setLogToDelete(null);
        toast.success('Device log deleted successfully');
      } else {
        toast.error('Failed to delete device log');
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error('Error deleting device log');
    }
  };

  const handleBulkDelete = (selectedIds, tableName) => {
    setSelectedDeviceLogs(selectedIds);
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await dispatch(deleteMultipleDeviceLogs(selectedDeviceLogs)).unwrap();
      toast.success(`${selectedDeviceLogs.length} device logs deleted successfully`);
      setIsBulkDeleteModalOpen(false);
      setSelectedDeviceLogs([]);
    } catch (error) {
      toast.error(error.message || 'Failed to delete device logs');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentLogId(null);
    setFormData({ device_code: '', humidity: 0, temperature: 0, meta: {} });
    setMetaString('{}');
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

  const handleMetaChange = (e) => {
    setMetaString(e.target.value);
    try {
      const parsedMeta = JSON.parse(e.target.value);
      setFormData(prev => ({
        ...prev,
        meta: parsedMeta
      }));
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };

  const handleEdit = (deviceLog) => {
    setFormData({
      device_code: deviceLog.device_code || '',
      humidity: deviceLog.humidity || 0,
      temperature: deviceLog.temperature || 0,
      meta: deviceLog.meta || {}
    });
    setMetaString(JSON.stringify(deviceLog.meta || {}, null, 2));
    setIsEditMode(true);
    setCurrentLogId(deviceLog._id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const updatedFormData = {
        ...formData,
        humidity: Number(formData.humidity),
        temperature: Number(formData.temperature)
      };

      let result;
      if (isEditMode && currentLogId) {
        result = await dispatch(updateDeviceLog({ ...updatedFormData, _id: currentLogId })).unwrap();
      } else {
        result = await dispatch(addDeviceLog(updatedFormData)).unwrap();
      }

      if (result) {
        closeModal();
        dispatch(fetchEnhancedDeviceLogs());
        toast.success(isEditMode ? 'Device log updated successfully' : 'Device log added successfully');
      } else {
        toast.error('Operation failed');
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error('Error processing request');
    }
  };

  const exportJsonToExcel = async (jsonData, fileName = 'device_data.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    const dataArray = Array.isArray(reduxDeviceLogs) ? reduxDeviceLogs : [reduxDeviceLogs];
    if (dataArray.length === 0) return;

    const headers = Object.keys(dataArray[0]);
    worksheet.columns = headers.map((key) => ({
      header: key.toUpperCase(),
      key,
      width: 20,
    }));

    dataArray.forEach((row) => worksheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Device Logs Management</h3>
            <div className="nk-block-des text-soft">
              <p>Manage and keep track of all your Devices Logs</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-danger"
                  onClick={exportJsonToExcel}
                  text="Export Excel"
                  icon="ni-file-fill"
                />
              </li>
            </ul>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row mt-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Temperature & Humidity Trends</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Device Performance Overview</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="temperature" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="humidity" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* User and Device Selection Section */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title">Filter Data by User and Device</h5>
                  {isFiltered && (
                    <div className="badge badge-primary">
                      <em className="icon ni ni-filter"></em>
                      Filtered by: {currentFilter}
                    </div>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Select User</label>
                      <div className="form-control-wrap">
                        <select
                          className="form-control form-control-lg"
                          value={selectedUser}
                          onChange={handleUserChange}
                          disabled={customersLoading}
                        >
                          <option value="">
                            {customersLoading ? 'Loading customers...' : 'Choose Customer'}
                          </option>
                          {reduxCustomers && reduxCustomers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                              {customer.full_name} {customer.email && `(${customer.email})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Select Device</label>
                      <div className="form-control-wrap">
                        <select
                          className="form-control form-control-lg"
                          value={selectedDevice}
                          onChange={handleDeviceChange}
                          disabled={!selectedUser}
                        >
                          <option value="">Choose Device</option>
                          {customerDevices.map((deviceName, index) => (
                            <option key={index} value={deviceName}>
                              {deviceName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">&nbsp;</label>
                      <div className="form-control-wrap">
                        <div className="row g-2">
                          <div className="col-6">
                            <ThemeButton
                              color="btn-primary"
                              onClick={handleShowData}
                              text="Show Data"
                              icon="ni-eye"
                            />
                          </div>
                          <div className="col-6">
                            <ThemeButton
                              color="btn-outline-primary"
                              onClick={handleShowAllData}
                              text="Show All"
                              icon="ni-list"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DataTable Section */}
        <div className="row pt-3">
          <div className="col-12">
            <DataTable
              text={isFiltered ? `Device Logs for ${currentFilter}` : "Total Device Logs"}
              data={reduxDeviceLogs || []}
              loading={reduxLoading}
              title={isFiltered ? `Device Logs - Filtered by ${currentFilter}` : "Device Logs"}
              searchPlaceholder="Search device logs..."
              emptyMessage={isFiltered ? `No device logs found for ${currentFilter}` : "No device log found. Add a new device log to get started."}
              itemsPerPage={5}
              buttonShow={false}
              showInfoColumn={false}
              showActions={false}
              tableName="DeviceLog"
              onBulkDelete={handleBulkDelete}
              searchableFields={[
                'device_code',
                'device_title',
                'device_serial_number',
                'humidity',
                'temperature',
                'created_at',
                'updated_at',
                'meta'
              ]}
              onEdit={handleEdit}
              onDelete={(deviceLog) => {
                setLogToDelete(deviceLog);
                setIsDeleteModalOpen(true);
              }}
              columns={[
                {
                  header: "Device Title",
                  accessor: "device_title",
                  render: (value, item) => (
                    <span className="badge badge-primary">{value || 'Unknown Device'}</span>
                  ),
                },
                {
                  header: "Serial Number",
                  accessor: "device_serial_number",
                  render: (value, item) => (
                    <span className="text-muted">{value || 'N/A'}</span>
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
                  header: "Humidity",
                  accessor: "humidity",
                },
                {
                  header: "Temperature",
                  accessor: "temperature",
                },
                {
                  header: "Meta",
                  accessor: "meta",
                  render: (value, item) => JSON.stringify(value),
                },
              ]}
            />
          </div>
        </div>

        {/* Modals */}
        {isModalOpen && (
          <div className="modal fade zoom show" style={{ display: "block" }}>
            <div className="modal-dialog modal-md" role="document">
              <div className="modal-content">
                <div className="modal-header bg-primary">
                  <h5 className="modal-title text-white">
                    <span>{isEditMode ? 'Edit Device Logs' : 'Add Device Logs'}</span>
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
                      <label className="form-label"><span>Humidity</span></label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="humidity"
                          className={`form-control form-control-lg ${formErrors.humidity ? 'is-invalid' : ''}`}
                          placeholder="Enter humidity"
                          value={formData.humidity}
                          onChange={handleInputChange}
                        />
                        {formErrors.humidity && (
                          <div className="invalid-feedback">{formErrors.humidity}</div>
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
                          placeholder="Enter device_code"
                          value={formData.device_code}
                          onChange={handleInputChange}
                        />
                        {formErrors.device_code && (
                          <div className="invalid-feedback">{formErrors.device_code}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group mt-1">
                      <label className="form-label"><span>Temperature</span></label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          name="temperature"
                          className={`form-control form-control-lg ${formErrors.temperature ? 'is-invalid' : ''}`}
                          placeholder="Enter temperature"
                          value={formData.temperature || ""}
                          onChange={handleInputChange}
                        />
                        {formErrors.temperature && (
                          <div className="invalid-feedback">{formErrors.temperature}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-group mt-1">
                      <label className="form-label"><span>Meta</span></label>
                      <div className="form-control-wrap">
                        <textarea
                          type="text"
                          name="meta"
                          className={`form-control form-control-lg ${formErrors.meta ? 'is-invalid' : ''}`}
                          placeholder="Enter description"
                          value={metaString}
                          onChange={handleMetaChange}
                        />
                        {formErrors.meta && (
                          <div className="invalid-feedback">{formErrors.meta}</div>
                        )}
                      </div>
                    </div>

                    <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                      <div className="col-md-9"></div>
                      <div className="col-md-3 text-right pt-2">
                        <button type="submit" className="btn btn-primary w-100 justify-center" disabled={reduxLoading}>
                          {reduxLoading ? (
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
                  <h5>Do you want to delete this log?</h5>
                  <div className="row mt-2" style={{ borderTop: "1px solid #ede8e8" }}>
                    <div className="col-md-12"></div>
                    <div className="col-md-9 text-right pt-2">
                      <ul className="list-inline mb-0">
                        <li className="list-inline-item mr-2">
                          <button
                            type="button"
                            className="btn btn-primary w-100 justify-center"
                            onClick={() => logToDelete && handleDelete(logToDelete)}
                            disabled={reduxLoading || !logToDelete}
                          >
                            <span>Yes</span>
                          </button>
                        </li>
                        <li className="list-inline-item">
                          <button
                            type="button"
                            className="btn btn-danger w-100 justify-center"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={reduxLoading}
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
            setSelectedDeviceLogs([]);
          }}
          onConfirm={confirmBulkDelete}
          selectedCount={selectedDeviceLogs.length}
          tableName="DeviceLog"
          loading={reduxLoading}
        />
      </div>
    </div>
  );
}

export default Page; 