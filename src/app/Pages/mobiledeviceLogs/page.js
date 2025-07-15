"use client";
import React, { useState, useEffect } from "react";
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
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
import ThemeButton from "../../components/Theme/dynamicButton";
import CoordinatesDropdown from "../../components/Theme/CoordinatesDropdown";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Page() {
    // Redux state and dispatch
    const dispatch = useDispatch();
    const { deviceLogs: reduxDeviceLogs, loading: reduxLoading, error: reduxError, success } = useSelector((state) => state.deviceLog);
    const { devices } = useSelector((state) => state.device);
    const deviceCode = "192.168.4.1";
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(null);
    const [logToDelete, setLogToDelete] = useState(null);
    const [metaString, setMetaString] = useState('{}');
    const [formData, setFormData] = useState({
        serial_code: '',
        humidity: 0,
        temperature: 0,
        meta: {}
    });
    const [formErrors, setFormErrors] = useState({});




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
                minHumidity: 0,
                logsWithLocation: 0,
                uniqueLocations: 0
            };
        }

        const temperatures = reduxDeviceLogs.map(log => log.temperature || 0);
        const humidities = reduxDeviceLogs.map(log => log.humidity || 0);

        // Calculate location statistics
        const logsWithLocation = reduxDeviceLogs.filter(log => {
            const lat = log.meta && (
                log.meta.lat || log.meta.latitude || log.meta.Latitude || log.meta.LAT
            );
            const lng = log.meta && (
                log.meta.lng || log.meta.longitude || log.meta.long ||
                log.meta.Longitude || log.meta.LNG || log.meta.LONG
            );
            return lat !== null && lat !== undefined && lng !== null && lng !== undefined;
        });

        const uniqueLocations = new Set(
            logsWithLocation.map(log => {
                const lat = log.meta && (
                    log.meta.lat || log.meta.latitude || log.meta.Latitude || log.meta.LAT
                );
                const lng = log.meta && (
                    log.meta.lng || log.meta.longitude || log.meta.long ||
                    log.meta.Longitude || log.meta.LNG || log.meta.LONG
                );
                return `${lat},${lng}`;
            })
        );

        return {
            totalLogs: reduxDeviceLogs.length,
            avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
            avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
            maxTemperature: Math.max(...temperatures),
            minTemperature: Math.min(...temperatures),
            maxHumidity: Math.max(...humidities),
            minHumidity: Math.min(...humidities),
            logsWithLocation: logsWithLocation.length,
            uniqueLocations: uniqueLocations.size
        };
    };

    const stats = getStatistics();

    // Extract latitude from meta object
    function extractLatitude(meta) {
        if (meta?.locations?.length > 0) {
            return meta.locations[0]?.lat ?? null;
        }
        return null;
    }

    function extractLongitude(meta) {
        if (meta?.locations?.length > 0) {
            return meta.locations[0]?.lng ?? null;
        }
        return null;
    }




    // Get all latitude/longitude pairs from device logs
    const getLocationList = () => {
        if (!reduxDeviceLogs || reduxDeviceLogs.length === 0) return [];

        const locationList = [];
        reduxDeviceLogs.forEach((log, index) => {
            const lat = extractLatitude(log.meta);
            const lng = extractLongitude(log.meta);

            if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
                locationList.push({
                    id: log._id || index,
                    deviceCode: log.serial_code || 'N/A',
                    latitude: parseFloat(lat).toFixed(6),
                    longitude: parseFloat(lng).toFixed(6),
                    temperature: log.temperature || 0,
                    humidity: log.humidity || 0,
                    createdAt: log.created_at
                });
            }
        });

        return locationList;
    };

    // Fetch data on component mount
    useEffect(() => {
        if (deviceCode) {
            console.log("serialCode", deviceCode);
            dispatch(fetchDeviceLogsBySerialCode(deviceCode));
        }
    }, [dispatch, deviceCode]);

    // Debug: Log location list whenever device logs change
    useEffect(() => {
        if (reduxDeviceLogs && reduxDeviceLogs.length > 0) {
            const locationList = getLocationList();
            console.log("📍 Location List:", locationList);
            console.log("📊 Total locations found:", locationList.length);
        }
    }, [reduxDeviceLogs]);

    // Initialize Bootstrap dropdowns
    useEffect(() => {
        // Dynamic import of Bootstrap to avoid SSR issues
        if (typeof window !== 'undefined') {
            // Try Bootstrap 5 first
            import('bootstrap').then((bootstrap) => {
                // Initialize dropdowns
                const dropdownElements = document.querySelectorAll('.dropdown-toggle');
                dropdownElements.forEach(element => {
                    new bootstrap.Dropdown(element);
                });
            }).catch((error) => {
                // Fallback to Bootstrap 4 or jQuery if Bootstrap 5 not available
                console.warn('Bootstrap 5 not available, trying jQuery/Bootstrap 4:', error);
                if (typeof window.$ !== 'undefined' && window.$.fn.dropdown) {
                    window.$('.dropdown-toggle').dropdown();
                }
            });
        }
    }, [reduxDeviceLogs]);

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

    // Function to update customer device's last_updated field
    const updateCustomerDeviceLastUpdated = async (serialCode) => {
        try {
            console.log('🔄 Attempting to update last_updated for serial:', serialCode);

            const response = await fetch('/api/Dashboard/CustomerDevice/updateLastUpdatedBySerial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    device_serial_number: serialCode,
                    last_updated: new Date().toISOString()
                })
            });

            console.log('📡 API Response status:', response.status);
            const data = await response.json();
            console.log('📡 API Response data:', data);

            if (data.success) {
                console.log(`✅ Updated last_updated for device with serial: ${serialCode}`);
                return true;
            } else {
                console.warn(`❌ Failed to update last_updated for device with serial: ${serialCode}`, data.message);
                return false;
            }
        } catch (error) {
            console.error('💥 Error updating customer device last_updated:', error);
            return false;
        }
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

                // Update customer device's last_updated field if this is a new log
                if (!isEditMode && formData.serial_code) {
                    console.log('🔄 Updating customer device last_updated for serial:', formData.serial_code);
                    const updateResult = await updateCustomerDeviceLastUpdated(formData.serial_code);

                    if (updateResult) {
                        // Trigger a targeted refresh of customer devices data
                        window.dispatchEvent(new CustomEvent('customerDeviceUpdated', {
                            detail: {
                                serialCode: formData.serial_code,
                                timestamp: new Date().toISOString(),
                                action: 'lastUpdatedChanged'
                            }
                        }));
                    }
                }

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

        // Add headers matching our manual table
        const columns = [
            { header: 'Device Code', key: 'device_code', width: 20 },
            { header: 'Latitude', key: 'latitude', width: 15 },
            { header: 'Longitude', key: 'longitude', width: 15 },
            { header: 'Temperature (°C)', key: 'temperature', width: 20 },
            { header: 'Humidity (%)', key: 'humidity', width: 20 },
            { header: 'Created Date', key: 'created_date', width: 25 },
        ];

        worksheet.columns = columns;

        // Add data
        reduxDeviceLogs.forEach(log => {
            const lat = extractLatitude(log.meta);
            const lng = extractLongitude(log.meta);

            const rowData = {
                device_code: log.serial_code || 'N/A',
                latitude: lat !== null && lat !== undefined ? parseFloat(lat).toFixed(6) : 'N/A',
                longitude: lng !== null && lng !== undefined ? parseFloat(lng).toFixed(6) : 'N/A',
                temperature: log.temperature || 0,
                humidity: log.humidity || 0,
                created_date: new Date(log.created_at).toLocaleString(),
            };

            worksheet.addRow(rowData);
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





    //  This is UI code start from here

    return (
        <div className="nk-content-body">
            <div className="nk-block-head nk-block-head-sm">
                <div className="nk-block-between">
                    <div className="nk-block-head-content">
                        <h3 className="nk-block-title page-title">RF Mobile Device Logs</h3>
                        <div className="nk-block-des text-soft">
                            <p>Monitor and analyze device sensor data</p>
                        </div>
                    </div>
                    <div className="nk-block-head-content">
                        <ul className="nk-block-tools gx-3">
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
            {/* Charts Section */}
            <div className="row mt-4">
                <div className="col-md-3">
                    <div style={{ "border-top": "4px solid #007bff" }} className="card card-bordered">
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

            {/* Manual Table Section */}
            <div className="row pt-3">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title">Device Logs Table: <span className="badge badge-info">{reduxDeviceLogs.length}</span></h5>
                             
                            </div>
                        </div>
                        <div className="card-body">
                            {reduxLoading ? (
                                <div className="d-flex justify-content-center py-4">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-bordered">
                                        <thead className="table-dark">
                                            <tr>
                                                <th>Device Code</th>
                                                <th style={{ width: '300px', minWidth: '300px' }}>Coordinates</th>
                                                <th>Temperature (°C)</th>
                                                <th>Humidity (%)</th>
                                                <th>Created Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reduxDeviceLogs && reduxDeviceLogs.length > 0 ? (
                                                reduxDeviceLogs.map((log, index) => {
                                                    const allLocations = log.meta?.locations || [];

                                                    return (
                                                        <tr key={log._id || index}>
                                                            <td>
                                                                <span className="badge badge-primary">{log.serial_code || 'N/A'}</span>
                                                            </td>


                                                            <td style={{ width: '300px', minWidth: '300px', verticalAlign: 'top' }}>
                                                                {allLocations && allLocations.length > 0 ? (
                                                                    <div className="position-relative" style={{ minHeight: '60px' }}>
                                                                        {/* Show first location with proper spacing */}
                                                                        {allLocations.length > 0 && (
                                                                            <div className="d-flex flex-column gap-1 mb-2">
                                                                                <div className="d-flex gap-1 flex-wrap">
                                                                                    <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }} title={`Latitude: ${allLocations[0].lat}`}>
                                                                                        <em className="icon ni ni-map-pin"></em> {parseFloat(allLocations[0].lat).toFixed(6)}
                                                                                    </span>
                                                                                    <span className="badge badge-info" style={{ fontSize: '0.75rem', padding: '4px 8px' }} title={`Longitude: ${allLocations[0].lng}`}>
                                                                                        <em className="icon ni ni-map-pin"></em> {parseFloat(allLocations[0].lng).toFixed(6)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Show more locations indicator and dropdown */}
                                                                        <CoordinatesDropdown
                                                                            allLocations={allLocations}
                                                                            logId={log._id}
                                                                            index={index}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">No coordinates</span>
                                                                )}
                                                            </td>


                                                            <td><span className="text-warning">{log.temperature ?? 0}°C</span></td>
                                                            <td><span className="text-info">{log.humidity ?? 0}%</span></td>
                                                            <td>
                                                                <span className="text-muted">
                                                                    {new Date(log.created_at).toLocaleString()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <div className="no-data">
                                                            <em className="icon ni ni-inbox text-muted" style={{ fontSize: '2rem' }}></em>
                                                            <p className="text-muted mt-2">No device logs found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>



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


        </div>
    );
}

export default Page; 
