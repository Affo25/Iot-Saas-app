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
      console.log("serialCode", deviceCode);
      dispatch(fetchDeviceLogsBySerialCode(deviceCode));
    }
  }, [dispatch, deviceCode]);

  useEffect(() => {
    if (deviceLogs) {
      setFilteredData(deviceLogs);
    }
  }, [deviceLogs]);

  // Process data for charts - Enhanced for better hourly visualization
  const getChartData = () => {
    if (!filteredData || filteredData.length === 0) return [];

    // Group data by hour with more detailed information
    const hourlyData = filteredData.reduce((acc, log) => {
      const date = new Date(log.created_at);
      const hour = date.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!acc[hourKey]) {
        acc[hourKey] = { 
          temperature: [], 
          humidity: [], 
          count: 0,
          hour: hour
        };
      }
      
      if (log.temperature !== null && log.temperature !== undefined) {
        acc[hourKey].temperature.push(log.temperature);
      }
      if (log.humidity !== null && log.humidity !== undefined) {
        acc[hourKey].humidity.push(log.humidity);
      }
      acc[hourKey].count += 1;
      return acc;
    }, {});

    // Create array for all 24 hours with data or zeros
    const chartData = [];
    for (let i = 0; i < 24; i++) {
      const hourKey = `${i.toString().padStart(2, '0')}:00`;
      const data = hourlyData[hourKey];
      
      if (data && data.count > 0) {
        const avgTemp = data.temperature.length > 0 
          ? (data.temperature.reduce((a, b) => a + b, 0) / data.temperature.length).toFixed(1)
          : 0;
        const avgHumidity = data.humidity.length > 0 
          ? (data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length).toFixed(1)
          : 0;
        const maxTemp = data.temperature.length > 0 ? Math.max(...data.temperature).toFixed(1) : 0;
        const minTemp = data.temperature.length > 0 ? Math.min(...data.temperature).toFixed(1) : 0;
        const maxHumidity = data.humidity.length > 0 ? Math.max(...data.humidity).toFixed(1) : 0;
        const minHumidity = data.humidity.length > 0 ? Math.min(...data.humidity).toFixed(1) : 0;
        
        chartData.push({
          name: hourKey,
          hour: i,
          temperature: parseFloat(avgTemp),
          humidity: parseFloat(avgHumidity),
          maxTemp: parseFloat(maxTemp),
          minTemp: parseFloat(minTemp),
          maxHumidity: parseFloat(maxHumidity),
          minHumidity: parseFloat(minHumidity),
          readings: data.count
        });
      } else {
        chartData.push({
          name: hourKey,
          hour: i,
          temperature: 0,
          humidity: 0,
          maxTemp: 0,
          minTemp: 0,
          maxHumidity: 0,
          minHumidity: 0,
          readings: 0
        });
      }
    }

    return chartData.sort((a, b) => a.hour - b.hour);
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
    const data = filteredData.map(log => ({
      'Date': new Date(log.created_at).toLocaleDateString(),
      'Time': new Date(log.created_at).toLocaleTimeString(),
      'Temperature (°C)': log.temperature,
      'Humidity (%)': log.humidity,
      'Serial Code': log.serial_code,
    }));

    const workbook = new ExcelJS.Workbook();
    
    // Raw Data Sheet
    const worksheet = workbook.addWorksheet('Raw Data');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 15 },
      { header: 'Serial Code', key: 'serial_code', width: 20 },
      { header: 'Temperature (°C)', key: 'temperature', width: 18 },
      { header: 'Humidity (%)', key: 'humidity', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Add raw data
    data.forEach(log => {
      const temp = log['Temperature (°C)'];
      const humidity = log['Humidity (%)'];
      let status = 'Normal';
      
      if (temp > 35 || temp < 10 || humidity > 90 || humidity < 20) {
        status = 'Critical';
      } else if (temp > 30 || temp < 15 || humidity > 80 || humidity < 30) {
        status = 'Warning';
      }

      worksheet.addRow({
        date: log['Date'],
        time: log['Time'],
        serial_code: log['Serial Code'],
        temperature: temp,
        humidity: humidity,
        status: status
      });
    });

    // Hourly Summary Sheet
    const hourlySheet = workbook.addWorksheet('Hourly Summary');
    hourlySheet.columns = [
      { header: 'Hour', key: 'hour', width: 10 },
      { header: 'Readings Count', key: 'readings', width: 15 },
      { header: 'Avg Temperature (°C)', key: 'avgTemp', width: 20 },
      { header: 'Min Temperature (°C)', key: 'minTemp', width: 20 },
      { header: 'Max Temperature (°C)', key: 'maxTemp', width: 20 },
      { header: 'Avg Humidity (%)', key: 'avgHumidity', width: 18 },
      { header: 'Min Humidity (%)', key: 'minHumidity', width: 18 },
      { header: 'Max Humidity (%)', key: 'maxHumidity', width: 18 }
    ];

    // Add hourly summary data
    chartData.forEach(hourData => {
      if (hourData.readings > 0) {
        hourlySheet.addRow({
          hour: hourData.name,
          readings: hourData.readings,
          avgTemp: hourData.temperature,
          minTemp: hourData.minTemp,
          maxTemp: hourData.maxTemp,
          avgHumidity: hourData.humidity,
          minHumidity: hourData.minHumidity,
          maxHumidity: hourData.maxHumidity
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `temperature-humidity-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.xlsx`);
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
      pdf.text('Temperature & Humidity Report', 20, yPosition);
      
      // Add device info
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text(`Serial Code: ${deviceCode}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Total Readings: ${statistics?.totalReadings || 0}`, 20, yPosition);
      
      yPosition += 15;
      
      // Add statistics if available
      if (statistics) {
        pdf.setFontSize(14);
        pdf.text('Statistics Summary:', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.text(`Temperature - Min: ${statistics.temperature.min}°C | Max: ${statistics.temperature.max}°C | Avg: ${statistics.temperature.avg}°C`, 20, yPosition);
        yPosition += 5;
        pdf.text(`Humidity - Min: ${statistics.humidity.min}% | Max: ${statistics.humidity.max}% | Avg: ${statistics.humidity.avg}%`, 20, yPosition);
        yPosition += 15;
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

      // Function to add DataTable to PDF
      const addDataTableToPDF = async () => {
        try {
          // Find the DataTable container
          const dataTableSelectors = [
            '#data-table-container',
            '[data-table-wrapper="TemperatureHumidityLog"]',
            '.data-table-wrapper',
            '.card:has(table)',
            'table'
          ];
          
          let tableElement = null;
          for (const selector of dataTableSelectors) {
            tableElement = document.querySelector(selector);
            if (tableElement) break;
          }
          
          if (!tableElement) {
            console.warn('DataTable element not found');
            return false;
          }
          
          // Add new page for table
          pdf.addPage();
          yPosition = 20;
          
          // Add table title
          pdf.setFontSize(14);
          pdf.text('Raw Temperature & Humidity Data Table', 20, yPosition);
          yPosition += 10;
          
          // Capture the table
          const canvas = await html2canvas(tableElement, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: Math.min(tableElement.scrollWidth, 1200),
            height: Math.min(tableElement.scrollHeight, 1500)
          });
          
          // Calculate dimensions for PDF
          const imgWidth = 170; // mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add table image - might span multiple pages
          const maxHeightPerPage = 250; // mm
          let remainingHeight = imgHeight;
          let sourceY = 0;
          
          while (remainingHeight > 0) {
            const heightThisPage = Math.min(remainingHeight, maxHeightPerPage);
            const cropRatio = heightThisPage / imgHeight;
            
            // Create cropped canvas for this page
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCanvas.width = canvas.width;
            croppedCanvas.height = canvas.height * cropRatio;
            
            croppedCtx.drawImage(
              canvas,
              0, sourceY * canvas.height / imgHeight,
              canvas.width, canvas.height * cropRatio,
              0, 0,
              canvas.width, canvas.height * cropRatio
            );
            
            const croppedImgData = croppedCanvas.toDataURL('image/png');
            pdf.addImage(croppedImgData, 'PNG', 20, yPosition, imgWidth, heightThisPage);
            
            remainingHeight -= heightThisPage;
            sourceY += heightThisPage;
            
            if (remainingHeight > 0) {
              pdf.addPage();
              yPosition = 20;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error capturing DataTable:', error);
          return false;
        }
      };
      
      // Wait a moment for charts to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add charts to PDF
      const charts = [
        {
          selector: '#line-chart-container',
          title: 'Hourly Temperature & Humidity Trends (Line Chart)',
          isFirst: true
        },
        {
          selector: '#bar-chart-container',
          title: 'Temperature & Humidity Combined Bar Chart',
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
      
      // Add DataTable to PDF
      const tableAdded = await addDataTableToPDF();
      
      // Add timestamp footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`, 20, 290);
      }
      
      // Save the PDF
      const fileName = `temperature-humidity-report-${deviceCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      const successMessage = `PDF report exported successfully! ${chartsAdded} charts and ${tableAdded ? '1 data table' : '0 data tables'} included.`;
      toast.success(successMessage);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  const exportDataTableToPDF = async () => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation for tables
      let yPosition = 20;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Temperature & Humidity Data Table', 20, yPosition);
      
      // Add device info
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text(`Serial Code: ${deviceCode}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPosition);
      
      yPosition += 5;
      pdf.text(`Total Records: ${filteredData.length}`, 20, yPosition);
      
      yPosition += 15;
      
      // Find the DataTable container
      const dataTableSelectors = [
        '#data-table-container',
        '[data-table-wrapper="TemperatureHumidityLog"]',
        '.data-table-wrapper',
        '.card:has(table)',
        'table'
      ];
      
      let tableElement = null;
      for (const selector of dataTableSelectors) {
        tableElement = document.querySelector(selector);
        if (tableElement) break;
      }
      
      if (!tableElement) {
        toast.error('DataTable not found. Please ensure the table is visible.');
        return;
      }
      
      // Wait for table to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capture the table
      const canvas = await html2canvas(tableElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: Math.min(tableElement.scrollWidth, 1400),
        height: Math.min(tableElement.scrollHeight, 2000)
      });
      
      // Calculate dimensions for PDF (landscape)
      const imgWidth = 250; // mm (landscape width)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add table image - might span multiple pages
      const maxHeightPerPage = 180; // mm
      let remainingHeight = imgHeight;
      let sourceY = 0;
      
      while (remainingHeight > 0) {
        const heightThisPage = Math.min(remainingHeight, maxHeightPerPage);
        
        if (sourceY > 0) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Create cropped canvas for this page
        const cropRatio = heightThisPage / imgHeight;
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        croppedCanvas.width = canvas.width;
        croppedCanvas.height = canvas.height * cropRatio;
        
        croppedCtx.drawImage(
          canvas,
          0, sourceY * canvas.height / imgHeight,
          canvas.width, canvas.height * cropRatio,
          0, 0,
          canvas.width, canvas.height * cropRatio
        );
        
        const croppedImgData = croppedCanvas.toDataURL('image/png');
        pdf.addImage(croppedImgData, 'PNG', 20, yPosition, imgWidth, heightThisPage);
        
        remainingHeight -= heightThisPage;
        sourceY += heightThisPage;
      }
      
      // Add timestamp footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(`Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`, 20, 200);
      }
      
      // Save the PDF
      const fileName = `temperature-humidity-table-${deviceCode}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('Data table exported to PDF successfully!');
      
    } catch (error) {
      console.error('Error exporting table to PDF:', error);
      toast.error('Failed to export table to PDF. Please try again.');
    }
  };

  const chartData = getChartData();
  const temperatureRanges = getTemperatureRanges();
  const humidityRanges = getHumidityRanges();
  const statistics = getStatistics();



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
                      <p className="mt-2">Loading temperature and humidity data...</p>
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
                      <p>Error loading temperature and humidity data: {error}</p>
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
            <h3 className="nk-block-title page-title">Temperature & Humidity Report</h3>
            <div className="nk-block-des text-soft">
              <p>Serial Code: <strong>{deviceCode}</strong> | Comprehensive temperature and humidity analysis</p>
            </div>
          </div>
          <div className="nk-block-head-content">
            <ul className="nk-block-tools gx-3">
              <li>
                <ThemeButton
                  color="btn-danger"
                  onClick={exportChartsToPDF}
                  text="Export Full PDF"
                  icon="ni-file-pdf"
                />
              </li>
              <li>
                <ThemeButton
                  color="btn-outline-danger"
                  onClick={exportDataTableToPDF}
                  text="Export Table PDF"
                  icon="ni-table"
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
              <div style={{"border-top": "4px solid #2D68C4"}} className="card card-bordered">
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
          {/* Line Chart - Temperature & Humidity by Hour */}
          <div className="col-lg-12">
            <div className="card" id="line-chart-card">
              <div className="card-header">
                <h5 className="card-title">Hourly Temperature & Humidity Trends</h5>
                <p className="text-muted">Average temperature and humidity readings by hour of the day</p>
              </div>
              <div className="card-body" id="line-chart-container">
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
                      yAxisId="temp"
                      orientation="left"
                      label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="humidity"
                      orientation="right"
                      label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const { payload } = props;
                        if (name === 'temperature') {
                          return [
                            `${value}°C (Avg)`,
                            `Temperature - Readings: ${payload.readings}, Min: ${payload.minTemp}°C, Max: ${payload.maxTemp}°C`
                          ];
                        }
                        if (name === 'humidity') {
                          return [
                            `${value}% (Avg)`,
                            `Humidity - Readings: ${payload.readings}, Min: ${payload.minHumidity}%, Max: ${payload.maxHumidity}%`
                          ];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Legend />
                    <Line 
                      yAxisId="temp"
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ff6b6b" 
                      strokeWidth={3} 
                      name="Temperature (°C)"
                      dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#ff6b6b' }}
                    />
                    <Line 
                      yAxisId="humidity"
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#4ecdc4" 
                      strokeWidth={3} 
                      name="Humidity (%)"
                      dot={{ fill: '#4ecdc4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#4ecdc4' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>


        {/* Combined Bar Chart */}
        <div className="row mt-4">
          <div className="col-lg-12">
            <div className="card" id="bar-chart-card">
              <div className="card-header">
                <h5 className="card-title">Temperature & Humidity Combined Bar Chart</h5>
                <p className="text-muted">Side-by-side comparison of temperature and humidity by hour</p>
              </div>
              <div className="card-body" id="bar-chart-container">
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
                      yAxisId="temp"
                      orientation="left"
                      label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="humidity"
                      orientation="right"
                      label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name, props) => {
                        const { payload } = props;
                        if (name === 'Temperature') {
                          return [
                            `${value}°C (Avg)`,
                            `Temperature - ${payload.readings} readings`
                          ];
                        }
                        if (name === 'Humidity') {
                          return [
                            `${value}% (Avg)`,
                            `Humidity - ${payload.readings} readings`
                          ];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      yAxisId="temp"
                      dataKey="temperature" 
                      fill="#ff6b6b"
                      name="Temperature"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="humidity"
                      dataKey="humidity" 
                      fill="#4ecdc4"
                      name="Humidity"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>



        {/* Hourly Statistics Table */}
        {/* <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title">Hourly Statistics Summary</h5>
                <p className="text-muted">Detailed breakdown of temperature and humidity by hour</p>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th>Hour</th>
                        <th>Readings Count</th>
                        <th>Avg Temp (°C)</th>
                        <th>Min Temp (°C)</th>
                        <th>Max Temp (°C)</th>
                        <th>Avg Humidity (%)</th>
                        <th>Min Humidity (%)</th>
                        <th>Max Humidity (%)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((hourData, index) => {
                        if (hourData.readings === 0) return null;
                        
                        const tempStatus = hourData.temperature > 30 ? 'hot' : 
                                         hourData.temperature < 15 ? 'cold' : 'normal';
                        const humidityStatus = hourData.humidity > 80 ? 'high' : 
                                             hourData.humidity < 30 ? 'low' : 'normal';
                        
                        const overallStatus = (tempStatus === 'normal' && humidityStatus === 'normal') ? 'optimal' :
                                            (tempStatus === 'hot' || tempStatus === 'cold' || humidityStatus === 'high' || humidityStatus === 'low') ? 'attention' : 'normal';
                        
                        return (
                          <tr key={index}>
                            <td><strong>{hourData.name}</strong></td>
                            <td>
                              <span className="badge badge-info">{hourData.readings}</span>
                            </td>
                            <td>
                              <span className={`badge ${hourData.temperature > 30 ? 'badge-danger' : hourData.temperature < 15 ? 'badge-warning' : 'badge-success'}`}>
                                {hourData.temperature}°C
                              </span>
                            </td>
                            <td>{hourData.minTemp}°C</td>
                            <td>{hourData.maxTemp}°C</td>
                            <td>
                              <span className={`badge ${hourData.humidity > 80 ? 'badge-danger' : hourData.humidity < 30 ? 'badge-warning' : 'badge-info'}`}>
                                {hourData.humidity}%
                              </span>
                            </td>
                            <td>{hourData.minHumidity}%</td>
                            <td>{hourData.maxHumidity}%</td>
                            <td>
                              <span className={`badge ${
                                overallStatus === 'optimal' ? 'badge-success' :
                                overallStatus === 'attention' ? 'badge-warning' : 'badge-secondary'
                              }`}>
                                {overallStatus === 'optimal' ? 'Optimal' :
                                 overallStatus === 'attention' ? 'Attention' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {chartData.filter(h => h.readings > 0).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No hourly data available for the selected time range.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div> */}

        {/* Raw Data Table */}
        <div className="row mt-4">
          <div className="col-12" id="data-table-container">
            <DataTable
              text={`Raw Temperature & Humidity Data (${filteredData.length} records)`}
              data={filteredData || []}
              loading={loading}
              title="Raw Temperature & Humidity Logs"
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
                // {
                //   header: "Meta Data",
                //   accessor: "meta",
                //   render: (value) => {
                //     if (!value || Object.keys(value).length === 0) {
                //       return <span className="badge badge-secondary">No Data</span>;
                //     }

                //     // Convert meta object to badges
                //     const metaEntries = Object.entries(value);
                //     return (
                //       <div className="d-flex flex-wrap gap-1">
                //         {metaEntries.map(([key, val], index) => (
                //           <span
                //             key={index}
                //             className="badge badge-outline-success"
                //             title={`${key}: ${val}`}
                //           >
                //             {key}: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                //           </span>
                //         ))}
                //       </div>
                //     );
                //   },
                // },
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

function TemperatureHumidityReportWrapper() {
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
      <TemperatureHumidityReport />
    </Suspense>
  );
}

export default TemperatureHumidityReportWrapper;