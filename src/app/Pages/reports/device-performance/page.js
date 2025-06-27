"use client";
import React, { useState, useEffect, Suspense } from "react";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { fetchDeviceLogsBySerialCode } from '../../../store/slices/deviceLogSlice';
import DataTable from '../../../components/Tables/DataTable';
import ThemeButton from "../../../components/Theme/dynamicButton";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function DevicePerformanceReport() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get('serialCode');
  
  const { deviceLogs, loading, error } = useSelector((state) => state.deviceLog);
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredData, setFilteredData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  useEffect(() => {
    if (deviceCode) {
      dispatch(fetchDeviceLogsBySerialCode(deviceCode));
    }
  }, [dispatch, deviceCode]);

  useEffect(() => {
    if (deviceLogs) {
      setFilteredData(deviceLogs);
      calculatePerformanceMetrics(deviceLogs);
    }
  }, [deviceLogs]);

  const calculatePerformanceMetrics = (data) => {
    if (!data || data.length === 0) return;

    const now = new Date();
    const last24Hours = data.filter(log => 
      (now - new Date(log.created_at)) <= 24 * 60 * 60 * 1000
    );
    const last7Days = data.filter(log => 
      (now - new Date(log.created_at)) <= 7 * 24 * 60 * 60 * 1000
    );

    // Calculate uptime (assuming logs every hour means device is active)
    const expectedLogsPerDay = 24; // 1 log per hour
    const actualLogsToday = last24Hours.length;
    const uptimePercentage = Math.min((actualLogsToday / expectedLogsPerDay) * 100, 100);

    // Calculate data quality score
    const validLogs = data.filter(log => 
      log.temperature !== null && 
      log.humidity !== null && 
      log.temperature >= -50 && 
      log.temperature <= 100 &&
      log.humidity >= 0 && 
      log.humidity <= 100
    );
    const dataQualityScore = (validLogs.length / data.length) * 100;

    // Calculate response consistency
    const intervals = [];
    for (let i = 1; i < data.length; i++) {
      const interval = new Date(data[i].created_at) - new Date(data[i-1].created_at);
      intervals.push(interval);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const consistencyScore = intervals.length > 0 ? 
      100 - (intervals.reduce((acc, interval) => acc + Math.abs(interval - avgInterval), 0) / intervals.length / avgInterval * 100) : 0;

    setPerformanceMetrics({
      uptime: uptimePercentage.toFixed(1),
      dataQuality: dataQualityScore.toFixed(1),
      consistency: Math.max(0, consistencyScore).toFixed(1),
      totalLogs: data.length,
      logsLast24h: last24Hours.length,
      logsLast7d: last7Days.length,
      avgInterval: (avgInterval / (1000 * 60)).toFixed(1) // in minutes
    });
  };

  // Process data for charts
  const getPerformanceChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // Group data by day
    const dailyData = {};
    filteredData.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          logs: [],
          temperature: [],
          humidity: []
        };
      }
      dailyData[date].logs.push(log);
      dailyData[date].temperature.push(log.temperature || 0);
      dailyData[date].humidity.push(log.humidity || 0);
    });

    return Object.values(dailyData).map(day => ({
      date: day.date,
      logsCount: day.logs.length,
      avgTemperature: (day.temperature.reduce((a, b) => a + b, 0) / day.temperature.length).toFixed(1),
      avgHumidity: (day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length).toFixed(1),
      dataQuality: ((day.logs.filter(log => 
        log.temperature !== null && 
        log.humidity !== null && 
        log.temperature >= -50 && 
        log.temperature <= 100 &&
        log.humidity >= 0 && 
        log.humidity <= 100
      ).length / day.logs.length) * 100).toFixed(1)
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getRadarData = () => {
    if (!performanceMetrics) return [];
    
    return [
      {
        subject: 'Uptime',
        A: parseFloat(performanceMetrics.uptime),
        fullMark: 100
      },
      {
        subject: 'Data Quality',
        A: parseFloat(performanceMetrics.dataQuality),
        fullMark: 100
      },
      {
        subject: 'Consistency',
        A: parseFloat(performanceMetrics.consistency),
        fullMark: 100
      },
      {
        subject: 'Response Rate',
        A: Math.min((performanceMetrics.logsLast24h / 24) * 100, 100),
        fullMark: 100
      },
      {
        subject: 'Reliability',
        A: (parseFloat(performanceMetrics.uptime) + parseFloat(performanceMetrics.dataQuality)) / 2,
        fullMark: 100
      }
    ];
  };

  const getHourlyActivity = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      logs: 0
    }));

    filteredData.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hourlyData[hour].logs++;
    });

    return hourlyData;
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
    calculatePerformanceMetrics(filtered);
    toast.success(`Filtered ${filtered.length} records`);
  };

  const clearFilter = () => {
    setFilteredData(deviceLogs);
    calculatePerformanceMetrics(deviceLogs);
    setDateRange({ startDate: '', endDate: '' });
    toast.success('Filter cleared');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Performance Summary Sheet
    const summarySheet = workbook.addWorksheet('Performance Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    if (performanceMetrics) {
      summarySheet.addRows([
        { metric: 'Device Uptime', value: `${performanceMetrics.uptime}%`, status: parseFloat(performanceMetrics.uptime) > 95 ? 'Excellent' : parseFloat(performanceMetrics.uptime) > 80 ? 'Good' : 'Poor' },
        { metric: 'Data Quality Score', value: `${performanceMetrics.dataQuality}%`, status: parseFloat(performanceMetrics.dataQuality) > 95 ? 'Excellent' : parseFloat(performanceMetrics.dataQuality) > 80 ? 'Good' : 'Poor' },
        { metric: 'Response Consistency', value: `${performanceMetrics.consistency}%`, status: parseFloat(performanceMetrics.consistency) > 80 ? 'Excellent' : parseFloat(performanceMetrics.consistency) > 60 ? 'Good' : 'Poor' },
        { metric: 'Total Logs', value: performanceMetrics.totalLogs, status: 'Info' },
        { metric: 'Logs (Last 24h)', value: performanceMetrics.logsLast24h, status: 'Info' },
        { metric: 'Logs (Last 7d)', value: performanceMetrics.logsLast7d, status: 'Info' },
        { metric: 'Avg Log Interval', value: `${performanceMetrics.avgInterval} min`, status: 'Info' }
      ]);
    }

    // Detailed Data Sheet
    const dataSheet = workbook.addWorksheet('Detailed Performance Data');
    dataSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Device Code', key: 'device_code', width: 20 },
      { header: 'Temperature (°C)', key: 'temperature', width: 18 },
      { header: 'Humidity (%)', key: 'humidity', width: 15 },
      { header: 'Data Quality', key: 'quality', width: 15 }
    ];

    filteredData.forEach(log => {
      const isValidData = log.temperature !== null && 
                         log.humidity !== null && 
                         log.temperature >= -50 && 
                         log.temperature <= 100 &&
                         log.humidity >= 0 && 
                         log.humidity <= 100;
      
      dataSheet.addRow({
        date: new Date(log.created_at).toLocaleDateString(),
        time: new Date(log.created_at).toLocaleTimeString(),
        device_code: log.device_code,
        temperature: log.temperature,
        humidity: log.humidity,
        quality: isValidData ? 'Valid' : 'Invalid'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `device-performance-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const performanceChartData = getPerformanceChartData();
  const radarData = getRadarData();
  const hourlyActivity = getHourlyActivity();

  if (loading) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="card">
                  <div className="card-body">
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading performance data...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="card">
                  <div className="card-body">
                    <div className="text-center text-danger">
                      <p>Error loading performance data: {error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Device Performance Report</h3>
            <div className="nk-block-des text-soft">
              <p>Serial Code: <strong>{deviceCode}</strong> | Comprehensive performance analysis and metrics</p>
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

        {/* Performance Metrics Cards */}
        {performanceMetrics && (
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Device Uptime</h6>
                    </div>
                    <div className="card-tools">
                      <em className={`card-hint-icon ni ni-help-fill ${parseFloat(performanceMetrics.uptime) > 95 ? 'text-success' : parseFloat(performanceMetrics.uptime) > 80 ? 'text-warning' : 'text-danger'}`}></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{performanceMetrics.uptime}%</span>
                      <span className="sub-title">
                        <span className={`change ${parseFloat(performanceMetrics.uptime) > 95 ? 'up text-success' : 'down text-danger'}`}>
                          <em className={`icon ni ni-arrow-long-${parseFloat(performanceMetrics.uptime) > 95 ? 'up' : 'down'}`}></em>
                          {parseFloat(performanceMetrics.uptime) > 95 ? 'Excellent' : parseFloat(performanceMetrics.uptime) > 80 ? 'Good' : 'Poor'}
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
                      <h6 className="title">Data Quality</h6>
                    </div>
                    <div className="card-tools">
                      <em className={`card-hint-icon ni ni-help-fill ${parseFloat(performanceMetrics.dataQuality) > 95 ? 'text-success' : parseFloat(performanceMetrics.dataQuality) > 80 ? 'text-warning' : 'text-danger'}`}></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{performanceMetrics.dataQuality}%</span>
                      <span className="sub-title">
                        <span className={`change ${parseFloat(performanceMetrics.dataQuality) > 95 ? 'up text-success' : 'down text-danger'}`}>
                          <em className={`icon ni ni-arrow-long-${parseFloat(performanceMetrics.dataQuality) > 95 ? 'up' : 'down'}`}></em>
                          Valid Data
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
                      <h6 className="title">Response Rate</h6>
                    </div>
                    <div className="card-tools">
                      <em className="card-hint-icon ni ni-help-fill text-info"></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{performanceMetrics.logsLast24h}/24</span>
                      <span className="sub-title">
                        <span className="change up text-info">
                          <em className="icon ni ni-clock"></em>
                          {performanceMetrics.avgInterval} min avg
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
                      <h6 className="title">Total Activity</h6>
                    </div>
                    <div className="card-tools">
                      <em className="card-hint-icon ni ni-help-fill text-primary"></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{performanceMetrics.totalLogs}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>
                          {performanceMetrics.logsLast7d} this week
                        </span>
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
                <h5 className="card-title">Daily Performance Metrics</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="logsCount" fill="#8884d8" name="Daily Logs Count" />
                    <Line yAxisId="right" type="monotone" dataKey="dataQuality" stroke="#ff7300" strokeWidth={3} name="Data Quality %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Performance Radar</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-lg-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">24-Hour Activity Pattern</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Logs Count']} />
                    <Area type="monotone" dataKey="logs" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Data Table */}
        <div className="row mt-4">
          <div className="col-12">
            <DataTable
              text={`Performance Data (${filteredData.length} records)`}
              data={filteredData || []}
              loading={loading}
              title="Device Performance Logs"
              searchPlaceholder="Search performance logs..."
              emptyMessage="No performance data found."
              itemsPerPage={10}
              buttonShow={false}
              showInfoColumn={false}
              showActions={false}
              tableName="DevicePerformanceLog"
              searchableFields={['device_code', 'temperature', 'humidity', 'created_at', 'meta']}
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
                  render: (value) => (
                    <span className="badge badge-warning">{value}</span>
                  ),
                },
                {
                  header: "Temperature",
                  accessor: "temperature",
                  render: (value) => (
                    <span className="text-info">{value !== null && value !== undefined ? value : 'N/A'}°C</span>
                  ),
                },
                {
                  header: "Humidity",
                  accessor: "humidity",
                  render: (value) => (
                    <span className="text-info">{value !== null && value !== undefined ? value : 'N/A'}%</span>
                  ),
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
                  header: "Data Quality",
                  accessor: "temperature",
                  render: (value, item) => {
                    if (!item) {
                      return <span className="badge badge-secondary">Unknown</span>;
                    }
                    
                    const isValid = value !== null && value !== undefined &&
                                   item.humidity !== null && item.humidity !== undefined &&
                                   value >= -50 && 
                                   value <= 100 &&
                                   item.humidity >= 0 && 
                                   item.humidity <= 100;
                    
                    return (
                      <span className={`badge ${isValid ? 'badge-success' : 'badge-danger'}`}>
                        {isValid ? 'Valid' : 'Invalid'}
                      </span>
                    );
                  },
                },
                {
                  header: "Performance Score",
                  accessor: "temperature",
                  render: (value, item) => {
                    if (!item) {
                      return <span className="badge badge-secondary">N/A</span>;
                    }
                    
                    const temp = value !== null && value !== undefined ? value : 0;
                    const humidity = item.humidity !== null && item.humidity !== undefined ? item.humidity : 0;
                    
                    // Calculate performance score based on data validity and ranges
                    let score = 100;
                    if (temp < -50 || temp > 100) score -= 30;
                    if (humidity < 0 || humidity > 100) score -= 30;
                    if (temp > 35 || temp < 10) score -= 20;
                    if (humidity > 90 || humidity < 20) score -= 20;
                    
                    score = Math.max(0, score);
                    
                    return (
                      <span className={`badge ${score >= 80 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                        {score}%
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

function DevicePerformanceReportWrapper() {
  return (
    <Suspense fallback={
      <div className="nk-content">
        <div className="container-fluid">
          <div className="nk-content-inner">
            <div className="nk-content-body">
              <div className="nk-block">
                <div className="card">
                  <div className="card-body">
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <DevicePerformanceReport />
    </Suspense>
  );
}

export default DevicePerformanceReportWrapper;