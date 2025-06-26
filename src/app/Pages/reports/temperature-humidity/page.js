"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchDeviceLogsBySerialCode } from '../../../store/slices/deviceLogSlice';
import DataTable from '../../../components/Tables/DataTable';
import ThemeButton from "../../../components/Theme/dynamicButton";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function TemperatureHumidityReport() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get('serialCode');
  
  const { deviceLogs, loading, error } = useSelector((state) => state.deviceLog);
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (deviceCode) {
      console.log("serialCode",deviceCode);
      dispatch(fetchDeviceLogsBySerialCode(deviceCode));
    }
  }, [dispatch, deviceCode]);

  useEffect(() => {
    if (deviceLogs) {
      setFilteredData(deviceLogs);
    }
  }, [deviceLogs]);

  // Process data for charts
  const getChartData = () => {
    if (!deviceLogs || deviceLogs.length === 0) return [];
    
    return deviceLogs.slice(0, 10).map((log, index) => ({
      name: `Log ${index + 1}`,
      temperature: log.temperature || 0,
      humidity: log.humidity || 0,
      device: log.device_title || log.serial_code || 'Unknown',
      timestamp: new Date(log.created_at || Date.now()).toLocaleTimeString()
    }));
  };

  const getTemperatureRanges = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const ranges = {
      'Cold (< 15°C)': 0,
      'Cool (15-20°C)': 0,
      'Normal (20-25°C)': 0,
      'Warm (25-30°C)': 0,
      'Hot (> 30°C)': 0
    };

    filteredData.forEach(log => {
      const temp = log.temperature || 0;
      if (temp < 15) ranges['Cold (< 15°C)']++;
      else if (temp < 20) ranges['Cool (15-20°C)']++;
      else if (temp < 25) ranges['Normal (20-25°C)']++;
      else if (temp < 30) ranges['Warm (25-30°C)']++;
      else ranges['Hot (> 30°C)']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  };

  const getHumidityRanges = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const ranges = {
      'Low (< 30%)': 0,
      'Normal (30-60%)': 0,
      'High (60-80%)': 0,
      'Very High (> 80%)': 0
    };

    filteredData.forEach(log => {
      const humidity = log.humidity || 0;
      if (humidity < 30) ranges['Low (< 30%)']++;
      else if (humidity < 60) ranges['Normal (30-60%)']++;
      else if (humidity < 80) ranges['High (60-80%)']++;
      else ranges['Very High (> 80%)']++;
    });

    return Object.entries(ranges).map(([name, value]) => ({ name, value }));
  };

  const getStatistics = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const temperatures = filteredData.map(log => log.temperature || 0);
    const humidities = filteredData.map(log => log.humidity || 0);

    return {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: (temperatures.reduce((a, b) => a + b, 0) / temperatures.length).toFixed(2)
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: (humidities.reduce((a, b) => a + b, 0) / humidities.length).toFixed(2)
      },
      totalReadings: filteredData.length
    };
  };

  const handleDateFilter = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const filtered = deviceLogs.filter(log => {
      const logDate = new Date(log.created_at);
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      return logDate >= startDate && logDate <= endDate;
    });

    setFilteredData(filtered);
    toast.success(`Filtered ${filtered.length} records`);
  };

  const clearFilter = () => {
    setFilteredData(deviceLogs);
    setDateRange({ startDate: '', endDate: '' });
    toast.success('Filter cleared');
  };

  const exportToExcel = async () => {
    const data = deviceLogs.map(log => ({
      'Date': new Date(log.created_at).toLocaleDateString(),
      'Time': new Date(log.created_at).toLocaleTimeString(),
      'Temperature (°C)': log.temperature,
      'Humidity (%)': log.humidity,
      'Serial Code': log.serial_code,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Temperature Humidity Report');

    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Serial Code', key: 'serial_code', width: 20 },
      { header: 'Temperature (°C)', key: 'temperature', width: 18 },
      { header: 'Humidity (%)', key: 'humidity', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Add data
    data.forEach(log => {
      worksheet.addRow({
        date: log.date,
        time: log.time,
        serial_code: log.serial_code,
        temperature: log.temperature,
        humidity: log.humidity,
        status: 'Active'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `temperature-humidity-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const chartData = getChartData();
  const temperatureRanges = getTemperatureRanges();
  const humidityRanges = getHumidityRanges();
  const statistics = getStatistics();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Temperature & Humidity Report</h3>
            <div className="nk-block-des text-soft">
              <p>Serial Code: <strong>{deviceCode}</strong> | Comprehensive temperature and humidity analysis</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-success"
                  onClick={exportToExcel}
                  text="Export Excel"
                  icon="ni-file-fill"
                />
              </li>
            </ul>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Readings</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{statistics.totalReadings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Temperature</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{statistics.temperature.avg}°C</span>
                      <span className="sub-title">
                        <span className="change down text-danger">
                          <em className="icon ni ni-arrow-long-down"></em>Min: {statistics.temperature.min}°C
                        </span>
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>Max: {statistics.temperature.max}°C
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Humidity</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{statistics.humidity.avg}%</span>
                      <span className="sub-title">
                        <span className="change down text-danger">
                          <em className="icon ni ni-arrow-long-down"></em>Min: {statistics.humidity.min}%
                        </span>
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>Max: {statistics.humidity.max}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Data Range</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-sm">
                        {filteredData.length > 0 ? new Date(Math.min(...filteredData.map(d => new Date(d.created_at)))).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="sub-title">
                        to {filteredData.length > 0 ? new Date(Math.max(...filteredData.map(d => new Date(d.created_at)))).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Date Range Filter</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label className="form-label">&nbsp;</label>
                      <div className="d-flex gap-4.5">
                        <ThemeButton
                          color="btn-primary"
                          onClick={handleDateFilter}
                          text="Apply Filter"
                          icon="ni-filter"
                        />

                        <ThemeButton
                          color="btn-outline-secondary"
                          onClick={clearFilter}
                          text="Clear"
                          icon="ni-cross"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row mt-4">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Temperature & Humidity Trends Over Time</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}${name === 'temperature' ? '°C' : '%'}`, 
                        name === 'temperature' ? 'Temperature' : 'Humidity'
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="temperature" stroke="#ff6b6b" strokeWidth={3} name="Temperature (°C)" />
                    <Line type="monotone" dataKey="humidity" stroke="#4ecdc4" strokeWidth={3} name="Humidity (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Temperature Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={temperatureRanges}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {temperatureRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Temperature Bar Chart</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}°C`, 'Temperature']} />
                    <Bar dataKey="temperature" fill="#ff6b6b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Humidity Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={humidityRanges}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {humidityRanges.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="row mt-4">
          <div className="col-12">
            <DataTable
              text={`Temperature & Humidity Data (${filteredData.length} records)`}
              data={filteredData || []}
              loading={loading}
              title="Temperature & Humidity Logs"
              searchPlaceholder="Search logs..."
              emptyMessage="No temperature and humidity data found."
              itemsPerPage={10}
              buttonShow={false}
              showInfoColumn={false}
              showActions={false}
              tableName="TemperatureHumidityLog"
              searchableFields={['serial_code', 'temperature', 'humidity', 'created_at', 'meta']}
              columns={[
                {
                  header: "Date",
                  accessor: "created_at",
                  render: (value) => {
                    if (!value) return <span className="text-muted">N/A</span>;
                    const date = new Date(value);
                    return (
                      <span className="text-primary">
                        {isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString()}
                      </span>
                    );
                  },
                },
                {
                  header: "Time",
                  accessor: "created_at",
                  render: (value) => {
                    if (!value) return <span className="text-muted">N/A</span>;
                    const date = new Date(value);
                    return (
                      <span className="text-muted">
                        {isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString()}
                      </span>
                    );
                  },
                },
                {
                  header: "Serial Code",
                  accessor: "serial_code",
                  render: (value, item) => (
                    <span className="badge badge-info">{value}</span>
                  ),
                },
                {
                  header: "Temperature",
                  accessor: "temperature",
                  render: (value) => {
                    const temp = value !== null && value !== undefined ? value : 'N/A';
                    if (temp === 'N/A') {
                      return <span className="badge badge-secondary">N/A°C</span>;
                    }
                    return (
                      <span className={`badge ${temp > 30 ? 'badge-danger' : temp > 25 ? 'badge-warning' : 'badge-success'}`}>
                        {temp}°C
                      </span>
                    );
                  },
                },
                {
                  header: "Humidity",
                  accessor: "humidity",
                  render: (value) => {
                    const humidity = value !== null && value !== undefined ? value : 'N/A';
                    if (humidity === 'N/A') {
                      return <span className="badge badge-secondary">N/A%</span>;
                    }
                    return (
                      <span className={`badge ${humidity > 80 ? 'badge-danger' : humidity > 60 ? 'badge-warning' : 'badge-info'}`}>
                        {humidity}%
                      </span>
                    );
                  },
                },
                {
                  header: "Meta Data",
                  accessor: "meta",
                  render: (value) => {
                    if (!value || Object.keys(value).length === 0) {
                      return <span className="badge badge-secondary">No Data</span>;
                    }
                    
                    // Convert meta object to badges
                    const metaEntries = Object.entries(value);
                    return (
                      <div className="d-flex flex-wrap gap-1">
                        {metaEntries.map(([key, val], index) => (
                          <span 
                            key={index} 
                            className="badge badge-outline-success"
                            title={`${key}: ${val}`}
                          >
                            {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </span>
                        ))}
                      </div>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: "temperature",
                  render: (value, item) => {
                    if (!item) {
                      return <span className="badge badge-secondary">Unknown</span>;
                    }
                    
                    const temp = value !== null && value !== undefined ? value : 0;
                    const humidity = item.humidity !== null && item.humidity !== undefined ? item.humidity : 0;
                    let status = 'Normal';
                    let badgeClass = 'badge-success';
                    
                    if (temp > 35 || temp < 10 || humidity > 90 || humidity < 20) {
                      status = 'Critical';
                      badgeClass = 'badge-danger';
                    } else if (temp > 30 || temp < 15 || humidity > 80 || humidity < 30) {
                      status = 'Warning';
                      badgeClass = 'badge-warning';
                    }
                    
                    return (
                      <span className={`badge ${badgeClass}`}>
                        {status}
                      </span>
                    );
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemperatureHumidityReport;