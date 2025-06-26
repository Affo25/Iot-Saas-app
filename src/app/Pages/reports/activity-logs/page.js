"use client";
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
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { fetchDeviceLogsBySerialCode } from '../../../store/slices/deviceLogSlice';
import DataTable from '../../../components/Tables/DataTable';
import ThemeButton from "../../../components/Theme/dynamicButton";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

function ActivityLogsReport() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get('deviceCode');
  
  const { deviceLogs, loading, error } = useSelector((state) => state.deviceLog);
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredData, setFilteredData] = useState([]);
  const [activityStats, setActivityStats] = useState(null);

  useEffect(() => {
    if (deviceCode) {
      dispatch(fetchDeviceLogsBySerialCode(deviceCode));
    }
  }, [dispatch, deviceCode]);

  useEffect(() => {
    if (deviceLogs) {
      setFilteredData(deviceLogs);
      calculateActivityStats(deviceLogs);
    }
  }, [deviceLogs]);

  const calculateActivityStats = (data) => {
    if (!data || data.length === 0) return;

    const now = new Date();
    const last24Hours = data.filter(log => 
      (now - new Date(log.created_at)) <= 24 * 60 * 60 * 1000
    );
    const last7Days = data.filter(log => 
      (now - new Date(log.created_at)) <= 7 * 24 * 60 * 60 * 1000
    );
    const last30Days = data.filter(log => 
      (now - new Date(log.created_at)) <= 30 * 24 * 60 * 60 * 1000
    );

    // Calculate activity patterns
    const hourlyActivity = Array.from({ length: 24 }, () => 0);
    const dailyActivity = {};
    const monthlyActivity = {};

    data.forEach(log => {
      const date = new Date(log.created_at);
      const hour = date.getHours();
      const day = date.toLocaleDateString();
      const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      hourlyActivity[hour]++;
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    });

    // Find peak activity times
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const peakDay = Object.keys(dailyActivity).reduce((a, b) => 
      dailyActivity[a] > dailyActivity[b] ? a : b
    );

    // Calculate activity trends
    const recentActivity = last7Days.length;
    const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const previousWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekActivity = data.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= previousWeekStart && logDate <= previousWeekEnd;
    }).length;

    const activityTrend = recentActivity - previousWeekActivity;
    const trendPercentage = previousWeekActivity > 0 ? 
      ((activityTrend / previousWeekActivity) * 100).toFixed(1) : 0;

    setActivityStats({
      total: data.length,
      last24h: last24Hours.length,
      last7d: last7Days.length,
      last30d: last30Days.length,
      peakHour: `${peakHour}:00`,
      peakDay,
      avgPerDay: (data.length / Object.keys(dailyActivity).length).toFixed(1),
      activityTrend: trendPercentage,
      trendDirection: activityTrend >= 0 ? 'up' : 'down',
      hourlyActivity,
      dailyActivity,
      monthlyActivity
    });
  };

  // Process data for charts
  const getActivityTimelineData = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    // Group by hour for the last 24 hours
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      logs: 0,
      avgTemp: 0,
      avgHumidity: 0,
      tempReadings: [],
      humidityReadings: []
    }));

    const last24Hours = filteredData.filter(log => 
      (new Date() - new Date(log.created_at)) <= 24 * 60 * 60 * 1000
    );

    last24Hours.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hourlyData[hour].logs++;
      hourlyData[hour].tempReadings.push(log.temperature || 0);
      hourlyData[hour].humidityReadings.push(log.humidity || 0);
    });

    return hourlyData.map(data => ({
      ...data,
      avgTemp: data.tempReadings.length > 0 ? 
        (data.tempReadings.reduce((a, b) => a + b, 0) / data.tempReadings.length).toFixed(1) : 0,
      avgHumidity: data.humidityReadings.length > 0 ? 
        (data.humidityReadings.reduce((a, b) => a + b, 0) / data.humidityReadings.length).toFixed(1) : 0
    }));
  };

  const getDailyActivityData = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const dailyData = {};
    filteredData.forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          logs: 0,
          temperatures: [],
          humidities: []
        };
      }
      dailyData[date].logs++;
      dailyData[date].temperatures.push(log.temperature || 0);
      dailyData[date].humidities.push(log.humidity || 0);
    });

    return Object.values(dailyData)
      .map(day => ({
        date: day.date,
        logs: day.logs,
        avgTemp: (day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length).toFixed(1),
        avgHumidity: (day.humidities.reduce((a, b) => a + b, 0) / day.humidities.length).toFixed(1)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  };

  const getActivityDistribution = () => {
    if (!activityStats) return [];
    
    return [
      { name: 'Last 24 Hours', value: activityStats.last24h, color: '#0088FE' },
      { name: 'Last 7 Days', value: activityStats.last7d - activityStats.last24h, color: '#00C49F' },
      { name: 'Last 30 Days', value: activityStats.last30d - activityStats.last7d, color: '#FFBB28' },
      { name: 'Older', value: activityStats.total - activityStats.last30d, color: '#FF8042' }
    ].filter(item => item.value > 0);
  };

  const getScatterData = () => {
    if (!filteredData || filteredData.length === 0) return [];
    
    return filteredData.slice(0, 100).map((log, index) => ({
      x: log.temperature || 0,
      y: log.humidity || 0,
      z: index,
      time: new Date(log.created_at).toLocaleString()
    }));
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
    calculateActivityStats(filtered);
    toast.success(`Filtered ${filtered.length} records`);
  };

  const clearFilter = () => {
    setFilteredData(deviceLogs);
    calculateActivityStats(deviceLogs);
    setDateRange({ startDate: '', endDate: '' });
    toast.success('Filter cleared');
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    
    // Activity Summary Sheet
    const summarySheet = workbook.addWorksheet('Activity Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Details', key: 'details', width: 30 }
    ];

    if (activityStats) {
      summarySheet.addRows([
        { metric: 'Total Activity Logs', value: activityStats.total, details: 'All time activity count' },
        { metric: 'Last 24 Hours', value: activityStats.last24h, details: 'Recent activity' },
        { metric: 'Last 7 Days', value: activityStats.last7d, details: 'Weekly activity' },
        { metric: 'Last 30 Days', value: activityStats.last30d, details: 'Monthly activity' },
        { metric: 'Peak Activity Hour', value: activityStats.peakHour, details: 'Most active time of day' },
        { metric: 'Peak Activity Day', value: activityStats.peakDay, details: 'Most active date' },
        { metric: 'Average Per Day', value: activityStats.avgPerDay, details: 'Daily average logs' },
        { metric: 'Activity Trend', value: `${activityStats.activityTrend}%`, details: `Trend is ${activityStats.trendDirection}` }
      ]);
    }

    // Detailed Activity Data Sheet
    const dataSheet = workbook.addWorksheet('Activity Logs');
    dataSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Device Code', key: 'device_code', width: 20 },
      { header: 'Temperature (°C)', key: 'temperature', width: 18 },
      { header: 'Humidity (%)', key: 'humidity', width: 15 },
      { header: 'Activity Type', key: 'activity_type', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    filteredData.forEach(log => {
      const temp = log.temperature || 0;
      const humidity = log.humidity || 0;
      let activityType = 'Normal';
      let status = 'Active';
      
      if (temp > 30 || humidity > 80) {
        activityType = 'High Activity';
      } else if (temp < 15 || humidity < 30) {
        activityType = 'Low Activity';
      }
      
      dataSheet.addRow({
        date: new Date(log.created_at).toLocaleDateString(),
        time: new Date(log.created_at).toLocaleTimeString(),
        device_code: log.device_code,
        temperature: log.temperature,
        humidity: log.humidity,
        activity_type: activityType,
        status: status
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `activity-logs-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const timelineData = getActivityTimelineData();
  const dailyActivityData = getDailyActivityData();
  const activityDistribution = getActivityDistribution();
  const scatterData = getScatterData();

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
            <h3 className="nk-block-title page-title">Activity Logs Report</h3>
            <div className="nk-block-des text-soft">
              <p>Serial Code: <strong>{deviceCode}</strong> | Comprehensive activity analysis and patterns</p>
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

        {/* Activity Statistics Cards */}
        {activityStats && (
          <div className="row mt-4">
            <div className="col-md-3">
              <div className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Activity</h6>
                    </div>
                    <div className="card-tools">
                      <em className="card-hint-icon ni ni-activity text-primary"></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{activityStats.total}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>
                          {activityStats.avgPerDay} per day
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
                      <h6 className="title">Recent Activity</h6>
                    </div>
                    <div className="card-tools">
                      <em className="card-hint-icon ni ni-clock text-info"></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{activityStats.last24h}</span>
                      <span className="sub-title">
                        <span className="change up text-info">
                          <em className="icon ni ni-clock"></em>
                          Last 24 hours
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
                      <h6 className="title">Peak Activity</h6>
                    </div>
                    <div className="card-tools">
                      <em className="card-hint-icon ni ni-bar-chart text-warning"></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{activityStats.peakHour}</span>
                      <span className="sub-title">
                        <span className="change up text-warning">
                          <em className="icon ni ni-clock"></em>
                          Peak hour
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
                      <h6 className="title">Activity Trend</h6>
                    </div>
                    <div className="card-tools">
                      <em className={`card-hint-icon ni ni-trend-${activityStats.trendDirection} ${activityStats.trendDirection === 'up' ? 'text-success' : 'text-danger'}`}></em>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{activityStats.activityTrend}%</span>
                      <span className="sub-title">
                        <span className={`change ${activityStats.trendDirection} ${activityStats.trendDirection === 'up' ? 'text-success' : 'text-danger'}`}>
                          <em className={`icon ni ni-arrow-long-${activityStats.trendDirection}`}></em>
                          vs last week
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
                <h5 className="card-title">24-Hour Activity Timeline</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        value, 
                        name === 'logs' ? 'Activity Count' : name === 'avgTemp' ? 'Avg Temperature (°C)' : 'Avg Humidity (%)'
                      ]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="logs" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.8} name="Activity Count" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Activity Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={activityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Daily Activity Trend (Last 14 Days)</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Activity Count']} />
                    <Bar dataKey="logs" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Temperature vs Humidity Scatter</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={scatterData}>
                    <CartesianGrid />
                    <XAxis type="number" dataKey="x" name="Temperature" unit="°C" />
                    <YAxis type="number" dataKey="y" name="Humidity" unit="%" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Readings" data={scatterData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Data Table */}
        <div className="row mt-4">
          <div className="col-12">
            <DataTable
              text={`Activity Logs (${filteredData.length} records)`}
              data={filteredData || []}
              loading={loading}
              title="Device Activity Logs"
              searchPlaceholder="Search activity logs..."
              emptyMessage="No activity logs found."
              itemsPerPage={15}
              buttonShow={false}
              showInfoColumn={false}
              showActions={false}
              tableName="DeviceActivityLog"
              searchableFields={['device_code', 'temperature', 'humidity', 'created_at']}
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
                  header: "Device Code",
                  accessor: "device_code",
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
                  header: "Activity Level",
                  accessor: "temperature",
                  render: (value, item) => {
                    if (!item) {
                      return <span className="badge badge-secondary">Unknown</span>;
                    }
                    
                    const temp = value !== null && value !== undefined ? value : 0;
                    const humidity = item.humidity !== null && item.humidity !== undefined ? item.humidity : 0;
                    let level = 'Normal';
                    let badgeClass = 'badge-success';
                    
                    if (temp > 30 || humidity > 80) {
                      level = 'High';
                      badgeClass = 'badge-danger';
                    } else if (temp < 15 || humidity < 30) {
                      level = 'Low';
                      badgeClass = 'badge-warning';
                    }
                    
                    return (
                      <span className={`badge ${badgeClass}`}>
                        {level}
                      </span>
                    );
                  },
                },
                {
                  header: "Time Since Last",
                  accessor: "created_at",
                  render: (value, item, index, data) => {
                    if (index === 0 || !data || !data[index - 1] || !data[index - 1].created_at) {
                      return <span className="text-muted">First</span>;
                    }
                    
                    const currentTime = new Date(value);
                    const previousTime = new Date(data[index - 1].created_at);
                    
                    if (isNaN(currentTime.getTime()) || isNaN(previousTime.getTime())) {
                      return <span className="text-muted">N/A</span>;
                    }
                    
                    const diffMinutes = Math.round((currentTime - previousTime) / (1000 * 60));
                    
                    return (
                      <span className={`badge ${diffMinutes > 120 ? 'badge-danger' : diffMinutes > 60 ? 'badge-warning' : 'badge-success'}`}>
                        {diffMinutes}m
                      </span>
                    );
                  },
                },
                {
                  header: "Status",
                  accessor: "created_at",
                  render: (value) => {
                    if (!value) {
                      return <span className="badge badge-secondary">Unknown</span>;
                    }
                    
                    const now = new Date();
                    const logTime = new Date(value);
                    
                    if (isNaN(logTime.getTime())) {
                      return <span className="badge badge-secondary">Invalid</span>;
                    }
                    
                    const diffHours = (now - logTime) / (1000 * 60 * 60);
                    
                    return (
                      <span className={`badge ${diffHours < 1 ? 'badge-success' : diffHours < 24 ? 'badge-info' : 'badge-secondary'}`}>
                        {diffHours < 1 ? 'Recent' : diffHours < 24 ? 'Today' : 'Historical'}
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


export default ActivityLogsReport;