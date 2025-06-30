"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
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

function Device2Report() {
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
      console.log("serialCode", deviceCode);
      dispatch(fetchDeviceLogsBySerialCode(deviceCode));
    }
  }, [dispatch, deviceCode]);

  useEffect(() => {
    if (deviceLogs) {
      setFilteredData(deviceLogs);
    }
  }, [deviceLogs]);

  // Process data for charts - Enhanced for meta data visualization by hour
  const getChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];

    // First, extract all unique meta keys from all logs
    const allMetaKeys = new Set();
    filteredData.forEach(log => {
      if (log.meta && typeof log.meta === 'object') {
        Object.keys(log.meta).forEach(key => allMetaKeys.add(key));
      }
    });
    
    const metaKeysArray = Array.from(allMetaKeys);
    console.log('Found meta keys:', metaKeysArray);

    // Group data by hour with meta data information
    const hourlyData = filteredData.reduce((acc, log) => {
      const date = new Date(log.created_at);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!acc[hourKey]) {
        acc[hourKey] = { 
          count: 0,
          hour: hour,
          metaData: {}
        };
        
        // Initialize all meta keys for this hour
        metaKeysArray.forEach(key => {
          acc[hourKey].metaData[key] = [];
        });
      }
      
      // Process meta data if it exists
      if (log.meta && typeof log.meta === 'object') {
        Object.entries(log.meta).forEach(([key, value]) => {
          if (acc[hourKey].metaData[key]) {
            // Try to convert to number if possible, otherwise count occurrences
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              acc[hourKey].metaData[key].push(numValue);
            } else {
              // For non-numeric values, we'll count occurrences
              acc[hourKey].metaData[key].push(1);
            }
          }
        });
      }
      
      acc[hourKey].count += 1;
      return acc;
    }, {});

    // Create array for all 24 hours with data or zeros
    const chartData = [];
    for (let i = 0; i < 24; i++) {
      const hourKey = `${i.toString().padStart(2, '0')}:00`;
      const data = hourlyData[hourKey];
      
      const hourEntry = {
        name: hourKey,
        hour: i,
        readings: data ? data.count : 0
      };
      
      if (data && data.count > 0) {
        // Process each meta key
        metaKeysArray.forEach(key => {
          const values = data.metaData[key] || [];
          if (values.length > 0) {
            // Just count occurrences for this meta key
            hourEntry[key] = values.length;
          } else {
            hourEntry[key] = 0;
          }
        });
      } else {
        // No data for this hour
        metaKeysArray.forEach(key => {
          hourEntry[key] = 0;
        });
      }
      
      chartData.push(hourEntry);
    }

    return {
      chartData: chartData.sort((a, b) => a.hour - b.hour),
      metaKeys: metaKeysArray
    };
  };

  // Get chart data and meta keys
  const chartResult = getChartData();
  const chartData = chartResult.chartData || [];
  const metaKeys = chartResult.metaKeys || [];


  const getMetaDataRanges = () => {
    if (!filteredData || filteredData.length === 0 || metaKeys.length === 0) return [];

    // Create pie chart data for meta data distribution
    const metaDistribution = {};
    
    filteredData.forEach(log => {
      if (log.meta && typeof log.meta === 'object') {
        Object.keys(log.meta).forEach(key => {
          if (!metaDistribution[key]) {
            metaDistribution[key] = 0;
          }
          metaDistribution[key] += 1;
        });
      }
    });

    return Object.entries(metaDistribution).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  };

  const getStatistics = () => {
    if (!filteredData || filteredData.length === 0) return null;

    const stats = {
      totalReadings: filteredData.length,
      metaDataStats: {}
    };

    // Calculate statistics for each meta key
    metaKeys.forEach(key => {
      let count = 0;
      filteredData.forEach(log => {
        if (log.meta && log.meta[key] !== undefined) {
          count++;
        }
      });

      stats.metaDataStats[key] = {
        count: count
      };
    });

    return stats;
  };

  // Get statistics and data for charts
  const statistics = getStatistics();
  const metaDataRanges = getMetaDataRanges();

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
    const data = filteredData.map(log => {
      const row = {
        'Date': new Date(log.created_at).toLocaleDateString(),
        'Time': new Date(log.created_at).toLocaleTimeString(),
        'Serial Code': log.serial_code,
      };
      
      // Add meta data fields
      if (log.meta && typeof log.meta === 'object') {
        Object.entries(log.meta).forEach(([key, value]) => {
          row[`Meta_${key}`] = typeof value === 'object' ? JSON.stringify(value) : value;
        });
      }
      
      return row;
    });

    const workbook = new ExcelJS.Workbook();
    
    // Raw Data Sheet
    const worksheet = workbook.addWorksheet('Raw Data');
    
    // Dynamic columns based on available meta keys
    const baseColumns = [
      { header: 'Date', key: 'Date', width: 15 },
      { header: 'Time', key: 'Time', width: 15 },
      { header: 'Serial Code', key: 'Serial Code', width: 20 }
    ];
    
    // Add meta data columns
    const metaColumns = metaKeys.map(key => ({
      header: `Meta ${key.charAt(0).toUpperCase() + key.slice(1)}`,
      key: `Meta_${key}`,
      width: 20
    }));
    
    worksheet.columns = [...baseColumns, ...metaColumns];

    // Add raw data
    data.forEach(row => {
      worksheet.addRow(row);
    });

    // Hourly Summary Sheet
    const hourlySheet = workbook.addWorksheet('Hourly Summary');
    const hourlySummaryColumns = [
      { header: 'Hour', key: 'hour', width: 10 },
      { header: 'Readings Count', key: 'readings', width: 15 }
    ];
    
    // Add columns for each meta key
    metaKeys.forEach(key => {
      hourlySummaryColumns.push(
        { header: `${key} Count`, key: `count_${key}`, width: 18 }
      );
    });
    
    hourlySheet.columns = hourlySummaryColumns;

    // Add hourly summary data
    chartData.forEach(hourData => {
      if (hourData.readings > 0) {
        const row = {
          hour: hourData.name,
          readings: hourData.readings
        };
        
        // Add meta data counts
        metaKeys.forEach(key => {
          row[`count_${key}`] = hourData[key] || 0;
        });
        
        hourlySheet.addRow(row);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `activity-meta-data-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel report exported successfully!');
  };

  const exportChartsToPDF = async () => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Activity Meta Data Report', 20, yPosition);
      
      // Add device info
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text(`Serial Code: ${deviceCode}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Total Readings: ${statistics?.totalReadings || 0}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Meta Data Fields: ${metaKeys.join(', ')}`, 20, yPosition);
      
      yPosition += 15;
      
      // Add statistics if available
      if (statistics && statistics.metaDataStats) {
        pdf.setFontSize(14);
        pdf.text('Meta Data Statistics Summary:', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        Object.entries(statistics.metaDataStats).forEach(([key, stats]) => {
          pdf.text(`${key} - Count: ${stats.count} occurrences`, 20, yPosition);
          yPosition += 5;
        });
        yPosition += 10;
      }
      
      // Function to add chart to PDF
      const addChartToPDF = async (chartSelector, chartTitle, isNewPage = false) => {
        const chartElement = document.querySelector(chartSelector);
        if (!chartElement) {
          console.warn(`Chart element not found: ${chartSelector}`);
          return false;
        }
        
        if (isNewPage) {
          pdf.addPage();
          yPosition = 20;
        }
        
        try {
          // Convert chart to canvas
          const canvas = await html2canvas(chartElement, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: chartElement.offsetWidth,
            height: chartElement.offsetHeight
          });
          
          // Calculate dimensions for PDF
          const imgWidth = 170; // mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Check if chart fits on current page
          if (yPosition + imgHeight > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Add chart title
          pdf.setFontSize(14);
          pdf.text(chartTitle, 20, yPosition);
          yPosition += 10;
          
          // Add chart image
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
          
          return true;
        } catch (error) {
          console.error(`Error capturing chart ${chartSelector}:`, error);
          return false;
        }
      };
      
      // Wait a moment for charts to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add charts to PDF
      const charts = [
        {
          selector: '#line-chart-container',
          title: 'Hourly Meta Data Trends (Line Chart)',
          isFirst: true
        },
        {
          selector: '#bar-chart-container',
          title: 'Meta Data Combined Bar Chart',
          isFirst: false
        },
        {
          selector: '#pie-chart-container',
          title: 'Meta Data Distribution (Pie Chart)',
          isFirst: false
        }
      ];
      
      let chartsAdded = 0;
      for (let i = 0; i < charts.length; i++) {
        const chart = charts[i];
        const success = await addChartToPDF(chart.selector, chart.title, i > 0 && yPosition > 200);
        if (success) {
          chartsAdded++;
        }
      }
      
      // If no charts were captured, try alternative selectors
      if (chartsAdded === 0) {
        // Try to capture charts with different selectors
        const alternativeSelectors = [
          '.recharts-wrapper',
          '[data-testid="recharts-wrapper"]',
          '.recharts-surface'
        ];
        
        for (const selector of alternativeSelectors) {
          const elements = document.querySelectorAll(selector);
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const chartContainer = element.closest('.card-body') || element.closest('.card') || element;
            
            try {
              if (i > 0) {
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.setFontSize(14);
              pdf.text(`Chart ${i + 1}`, 20, yPosition);
              yPosition += 10;
              
              const canvas = await html2canvas(chartContainer, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
              });
              
              const imgWidth = 170;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, Math.min(imgHeight, 200));
              yPosition += Math.min(imgHeight, 200) + 10;
              
              chartsAdded++;
            } catch (error) {
              console.error('Error capturing alternative chart:', error);
            }
          }
          
          if (chartsAdded > 0) break;
        }
      }
      
      // Add timestamp footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`, 20, 290);
      }
      
      // Save the PDF
      const fileName = `activity-meta-data-charts-${deviceCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success(`PDF report exported successfully! ${chartsAdded} charts included.`);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  // const chartData = getChartData();
  // const temperatureRanges = getTemperatureRanges();
  // const humidityRanges = getHumidityRanges();
  // const statistics = getStatistics();



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
                      <p className="mt-2">Loading Device WCS4-01 data...</p>
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
                      <p>Error loading Device WCS4-01 data: {error}</p>
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
    <>
      {/* Custom CSS for Meta Data Buttons */}
      <style jsx>{`
        .meta-data-btn {
          margin: 0.25rem !important;
          display: inline-block;
          vertical-align: middle;
          min-width: auto;
          text-align: center;
        }
        
        .meta-data-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
          z-index: 1;
        }
        
        .meta-value-btn {
          min-width: 60px !important;
          max-width: 120px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          font-size: 0.75rem !important;
          border-radius: 6px !important;
        }
        
        .table th {
          white-space: nowrap !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          background-color: #f8f9fa !important;
          border-bottom: 2px solid #dee2e6 !important;
        }
        
        .table td {
          vertical-align: middle !important;
          padding: 8px 12px !important;
        }
        
        .meta-data-btn:active {
          transform: translateY(0) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .meta-data-container {
          max-width: 350px;
          overflow-x: auto;
          padding: 0.5rem !important;
          margin: -0.25rem;
          background: rgba(248, 249, 250, 0.5);
          border-radius: 0.5rem;
          min-height: 3rem;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 0.5rem !important;
        }
        
        .meta-data-container::-webkit-scrollbar {
          height: 6px;
        }
        
        .meta-data-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .meta-data-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .meta-data-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .meta-data-container .btn {
          flex-shrink: 0;
          margin: 0 !important;
        }
        
        @media (max-width: 768px) {
          .meta-data-btn {
            font-size: 0.65rem !important;
            padding: 0.25rem 0.5rem !important;
            margin: 0.15rem !important;
          }
          
          .meta-data-container {
            max-width: 250px;
            gap: 0.25rem !important;
            padding: 0.375rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .meta-data-btn {
            font-size: 0.6rem !important;
            padding: 0.2rem 0.4rem !important;
          }
          
          .meta-data-container {
            max-width: 200px;
          }
        }
      `}</style>
      
      <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Activity Meta Data Report</h3>
            <div className="nk-block-des text-soft">
              <p>Serial Code: <strong>{deviceCode}</strong> | Activity logs and meta data analysis</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-danger"
                  onClick={exportChartsToPDF}
                  text="Export Charts PDF"
                  icon="ni-file-pdf"
                />
              </li>
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
              <div style={{"border-top": "4px solid #2D68C4"}} className="card card-bordered">
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
              <div style={{"border-top": "4px solid #2D68C4"}} className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Temperature</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{30}°C</span>
                      <span className="sub-title">
                        <span className="change down text-danger">
                          <em className="icon ni ni-arrow-long-down"></em>Min: {20}°C
                        </span>
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>Max: {40}°C
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div style={{"border-top": "4px solid #2D68C4"}} className="card card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Humidity</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{10}%</span>
                      <span className="sub-title">
                        <span className="change down text-danger">
                          <em className="icon ni ni-arrow-long-down"></em>Min: {20}%
                        </span>
                        <span className="change up text-success">
                          <em className="icon ni ni-arrow-long-up"></em>Max: {30}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div style={{"border-top": "4px solid #2D68C4"}} className="card card-bordered">
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
          {/* Line Chart - Meta Data by Hour */}
          <div className="col-lg-12">
            <div className="card" id="line-chart-card">
              <div className="card-header">
                <h5 className="card-title">Hourly Meta Data Trends</h5>
                <p className="text-muted">Meta data values distribution by hour of the day</p>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {metaKeys.map((key, index) => (
                    <span key={index} className="badge badge-soft-info">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="card-body" id="line-chart-container">
                {metaKeys.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ni ni-activity text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="text-muted mt-3">No Meta Data Available</h5>
                    <p className="text-muted">No meta data fields found in the activity logs to display.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        orientation="left"
                        label={{ value: 'Meta Data Count', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const { payload } = props;
                          return [
                            `${value} occurrences`,
                            `${name} - Total Readings: ${payload.readings}`
                          ];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      {metaKeys.map((key, index) => (
                        <Line 
                          key={key}
                          type="monotone" 
                          dataKey={key} 
                          stroke={COLORS[index % COLORS.length]} 
                          strokeWidth={2} 
                          name={key.charAt(0).toUpperCase() + key.slice(1)}
                          dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, fill: COLORS[index % COLORS.length] }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Combined Bar Chart */}
        <div className="row mt-4">
          <div className="col-lg-12">
            <div className="card" id="bar-chart-card">
              <div className="card-header">
                <h5 className="card-title">Meta Data Combined Bar Chart</h5>
                <p className="text-muted">Side-by-side comparison of meta data values by hour</p>
              </div>
              <div className="card-body" id="bar-chart-container">
                {metaKeys.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="ni ni-bar-chart text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="text-muted mt-3">No Meta Data Available</h5>
                    <p className="text-muted">No meta data fields found in the activity logs to display.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        orientation="left"
                        label={{ value: 'Meta Data Count', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const { payload } = props;
                          return [
                            `${value} occurrences`,
                            `${name} - Total Readings: ${payload.readings}`
                          ];
                        }}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Legend />
                      {metaKeys.map((key, index) => (
                        <Bar 
                          key={key}
                          dataKey={key} 
                          fill={COLORS[index % COLORS.length]}
                          name={key.charAt(0).toUpperCase() + key.slice(1)}
                          radius={[2, 2, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>


       

       
        {/* Raw Data Table */}
        <div className="row mt-4">
          <div className="col-12">
            <DataTable
              text={`Raw Meta Data Activity Logs (${filteredData.length} records)`}
              data={filteredData || []}
              loading={loading}
              title="Raw Meta Data Activity Logs"
              searchPlaceholder="Search logs..."
              emptyMessage="No meta data found."
              itemsPerPage={10}
              buttonShow={false}
              showInfoColumn={false}
              showActions={false}
              tableName="MetaDataActivityLog"
              searchableFields={['serial_code', 'created_at', 'meta', ...metaKeys]}
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
                // Dynamically create columns for each meta data key
                ...metaKeys.map((key, index) => ({
                  header: key.charAt(0).toUpperCase() + key.slice(1),
                  accessor: `meta.${key}`,
                  render: (value, item) => {
                    const metaValue = item.meta && item.meta[key];
                    
                    if (metaValue === undefined || metaValue === null) {
                      return <span className="badge badge-secondary">N/A</span>;
                    }


                    // Truncate long values for button display
                    const displayValue = typeof metaValue === 'object' 
                      ? 'Object' 
                      : String(metaValue).length > 15 
                        ? String(metaValue).substring(0, 15) + '...' 
                        : String(metaValue);

                    return (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary meta-value-btn"
                        title={`Click to view full content: ${key}: ${typeof metaValue === 'object' ? JSON.stringify(metaValue) : String(metaValue)}`}
                        style={{
                          cursor: 'pointer',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          maxWidth: '100px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          backgroundColor: COLORS[index % COLORS.length] + '20',
                          borderColor: COLORS[index % COLORS.length],
                          color: COLORS[index % COLORS.length]
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          e.target.style.backgroundColor = COLORS[index % COLORS.length];
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.backgroundColor = COLORS[index % COLORS.length] + '20';
                          e.target.style.color = COLORS[index % COLORS.length];
                        }}
                      >
                        {displayValue}
                      </button>
                    );
                  },
                })),

                // {
                //   header: "Status",
                //   accessor: "temperature",
                //   render: (value, item) => {
                //     if (!item) {
                //       return <span className="badge badge-secondary">Unknown</span>;
                //     }

                //     const temp = value !== null && value !== undefined ? value : 0;
                //     const humidity = item.humidity !== null && item.humidity !== undefined ? item.humidity : 0;
                //     let status = 'Normal';
                //     let badgeClass = 'badge-success';

                //     if (temp > 35 || temp < 10 || humidity > 90 || humidity < 20) {
                //       status = 'Critical';
                //       badgeClass = 'badge-danger';
                //     } else if (temp > 30 || temp < 15 || humidity > 80 || humidity < 30) {
                //       status = 'Warning';
                //       badgeClass = 'badge-warning';
                //     }

                //     return (
                //       <span className={`badge ${badgeClass}`}>
                //         {status}
                //       </span>
                //     );
                //   },
                // },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function Device2ReportWrapper() {
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
      <Device2Report />
    </Suspense>
  );
}

export default Device2ReportWrapper;