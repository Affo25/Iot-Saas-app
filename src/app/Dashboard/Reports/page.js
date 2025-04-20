'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectToMongo } from '../../lib/mongodb_connection';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // useEffect(() => {
  //   // Check if user is in customer role
  //   const userRole = localStorage.getItem('user-role');
  //   if (userRole !== 'Admins') {
  //     router.push('/');
  //     return;
  //   }

  //   // // Fetch customer's reports
  //   // const fetchReports = async () => {
  //   //   try {
  //   //     setLoading(true);
  //   //     // Get customer ID from localStorage
  //   //     const customerId = localStorage.getItem('customer-id');
  //   //     if (!customerId) {
  //   //       throw new Error('Customer ID not found');
  //   //     }
        
  //   //     // Use the correct API endpoint with the customer ID
  //   //     const response = await fetch(`/api/Reports?customerId=${customerId}`);
  //   //     if (!response.ok) {
  //   //       const errorData = await response.json();
  //   //       throw new Error(errorData.message || 'Failed to fetch reports');
  //   //     }
  //   //     const data = await response.json();
  //   //     setReports(data);
  //   //     setLoading(false);
  //   //   } catch (error) {
  //   //     console.error('Error fetching reports:', error);
  //   //     setError(error.message || 'Failed to load reports. Please try again later.');
  //   //     setLoading(false);
  //   //   }
  //   // };


  // }, [router]);

  if (loading) {
    return (
      <div className="nk-content-body">
        <div className="nk-block-head nk-block-head-sm">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title page-title">Reports</h3>
            </div>
          </div>
        </div>
        <div className="nk-block">
          <div className="card card-bordered card-full">
            <div className="card-inner">
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your reports...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nk-content-body">
        <div className="nk-block-head nk-block-head-sm">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title page-title">Reports</h3>
            </div>
          </div>
        </div>
        <div className="nk-block">
          <div className="card card-bordered card-full">
            <div className="card-inner">
              <div className="alert alert-danger">
                <em className="icon ni ni-cross-circle"></em>
                <span className="lead-text">{error}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Reports</h3>
          </div>
        </div>
      </div>
      <div className="nk-block">
        <div className="card card-bordered card-full">
          <div className="card-inner">
            {reports.length === 0 ? (
              <div className="text-center">
                <em className="icon ni ni-info-fill" style={{ fontSize: '3rem', color: '#8094ae' }}></em>
                <p className="lead mt-3">No reports available yet.</p>
                <p>Reports will appear here once they are generated for your devices.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Report ID</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report._id || report.id}>
                        <td>{report.report_id || report.id}</td>
                        <td>{report.title}</td>
                        <td>{new Date(report.date).toLocaleDateString()}</td>
                        <td>{report.type}</td>
                        <td>
                          <button className="btn btn-sm btn-primary">View</button>
                          <button className="btn btn-sm btn-outline-primary ms-2">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 