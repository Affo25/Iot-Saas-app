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
  fetchDeviceLogsBySerialCode,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
    serial_code: '',
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
      device: log.device_title || log.serial_code || 'Unknown',
      timestamp: new Date(log.created_at || Date.now()).toLocaleTimeString()
    }));
  };

  const chartData = getChartData();

  // Calculate statistics
  const getStatistics = () => {
    if (!reduxDeviceLogs || reduxDeviceLogs.length === 0) {
      return {
        totalLogs: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        maxTemperature: 0,
        minTemperature: 0,
        maxHumidity: 0,
        minHumidity: 0
      };
    }

    const temperatures = reduxDeviceLogs.map(log => log.temperature || 0);
    const humidities = reduxDeviceLogs.map(log => log.humidity || 0);

    return {
      totalLogs: reduxDeviceLogs.length,
      avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      maxTemperature: Math.max(...temperatures),
      minTemperature: Math.min(...temperatures),
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities)
    };
  };

  const stats = getStatistics();

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchEnhancedDeviceLogs());
  }, [dispatch]);

  // Handle success state
  useEffect(() => {
    if (success) {
      dispatch(resetState());
    }
  }, [success, dispatch]);

  // Handle error state
  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
    }
  }, [reduxError]);

  const validateForm = () => {
    const errors = {};
    if (!formData.serial_code) errors.serial_code = 'Serial code is required';
    if (formData.humidity < 0 || formData.humidity > 100) errors.humidity = 'Humidity must be between 0 and 100';
    if (formData.temperature < -50 || formData.temperature > 100) errors.temperature = 'Temperature must be between -50 and 100';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentLogId(null);
    setFormData({ serial_code: '', humidity: 0, temperature: 0, meta: {} });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (deviceLog) => {
    setFormData({
      serial_code: deviceLog.serial_code || '',
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
      let metaObject = {};
      try {
        metaObject = JSON.parse(metaString);
      } catch (error) {
        toast.error('Invalid JSON in meta field');
        return;
      }

      const payload = {
        ...formData,
        meta: metaObject
      };

      let result;
      if (isEditMode && currentLogId) {
        result = await dispatch(updateDeviceLog({ ...payload, _id: currentLogId })).unwrap();
      } else {
        result = await dispatch(addDeviceLog(payload)).unwrap();
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

  const handleDelete = async (deviceLog) => {
    try {
      const result = await dispatch(deleteDeviceLog(deviceLog._id)).unwrap();
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

  const handleFilterByDevice = async (deviceCode) => {
    try {
      await dispatch(fetchDeviceLogsBySerialCode(deviceCode)).unwrap();
      setIsFiltered(true);
      setCurrentFilter(deviceCode);
    } catch (error) {
      console.error('Error filtering device logs:', error);
      toast.error('Failed to filter device logs');
    }
  };

  const clearFilter = () => {
    dispatch(fetchEnhancedDeviceLogs());
    setIsFiltered(false);
    setCurrentFilter('');
  };

  const exportToExcel = () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Device Logs');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Serial Code', key: 'serial_code', width: 20 },
      { header: 'Temperature (°C)', key: 'temperature', width: 20 },
      { header: 'Humidity (%)', key: 'humidity', width: 20 },
      { header: 'Device Title', key: 'device_title', width: 25 },
      { header: 'Serial Number', key: 'device_serial_number', width: 20 },
    ];

    // Add data
    reduxDeviceLogs.forEach(log => {
      worksheet.addRow({
        date: new Date(log.created_at).toLocaleDateString(),
        time: new Date(log.created_at).toLocaleTimeString(),
        serial_code: log.serial_code,
        temperature: log.temperature,
        humidity: log.humidity,
        device_title: log.device_title || 'Unknown',
        device_serial_number: log.device_serial_number || 'N/A',
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate and download file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `device-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Device Logs</h3>
            <div className="nk-block-des text-soft">
              <p>Monitor and analyze device sensor data</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-primary"
                  onClick={openModal}
                  text="Add Device Log"
                  icon="ni-plus"
                />
              </li>
              <li>
                <ThemeButton
                  color="btn-success"
                  onClick={exportToExcel}
                  text="Export Excel"
                  icon="ni-file"
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="nk-block">
        <div className="row g-gs">
          <div className="col-md-3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Total Logs</h6>
                  </div>
                  <div className="card-tools">
                    <em className="card-hint-icon ni ni-help-fill"></em>
                  </div>
                </div>
                <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                  <div className="nk-sale-data">
                    <span className="amount">{stats.totalLogs}</span>
                    <span className="sub-title">
                      <span className="change up text-success">
                        <em className="icon ni ni-arrow-long-up"></em>
                        Device Logs
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                        onChange={(e) => {
                          setSelectedUser(e.target.value);
                          if (e.target.value) {
                            dispatch(fetchCustomers());
                          }
                        }}
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
                        onChange={(e) => {
                          setSelectedDevice(e.target.value);
                          if (e.target.value) {
                            dispatch(fetchCustomers());
                          }
                        }}
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
                            // onClick={handleShowData}
                            text="Show Data"
                            icon="ni-eye"
                          />
                        </div>
                        <div className="col-6">
                          <ThemeButton
                            color="btn-outline-primary"
                            // onClick={handleShowAllData}
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
              'serial_code',
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
                header: "Serial Code",
                accessor: "serial_code",
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
          <div className="modal-dialog modal-lg" role="document">
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
                  <div className="row">
                    <div className="col-md-4">
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
                    </div>
                    <div className="col-md-4">
                      <div className="form-group mt-1">
                        <label className="form-label"><span>Serial Code</span></label>
                        <div className="form-control-wrap">
                          <input
                            type="text"
                            name="serial_code"
                            className={`form-control form-control-lg ${formErrors.serial_code ? 'is-invalid' : ''}`}
                            placeholder="Enter serial code"
                            value={formData.serial_code}
                            onChange={handleInputChange}
                          />
                          {formErrors.serial_code && (
                            <div className="invalid-feedback">{formErrors.serial_code}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-md4">
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
                        onChange={(e) => {
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
                        }}
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
  );
}

export default Page; 
