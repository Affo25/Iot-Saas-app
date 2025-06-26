'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PagesLayout() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/Pages/Auth/Login');
      return;
    }
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Redirect customers to their designated page
        if (parsedUser.userRole === 'Customer') {
          router.push('/Pages/customersdevice');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/Pages/Auth/Login');
        return;
      }
    }
    
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isCustomer = user?.userRole === 'Customer';
  const isAdmin = user?.userRole === 'Admin';

  return (
    <div className="container-fluid">
      <div className="nk-content-body">
        <div className="nk-block-head nk-block-head-sm">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title page-title">
                {isCustomer ? 'Customer Dashboard' : 'Admin Dashboard'}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-inner">
              <h5 className="card-title">
                Welcome, {user?.full_name || user?.email || 'User'}!
              </h5>
              <p className="card-text">
                {isCustomer 
                  ? 'This is your customer dashboard. You can view your devices and reports from here.'
                  : 'This is your admin dashboard. You can manage customers, devices, and view all reports from here.'
                }
              </p>
              
              <div className="mt-4">
                <h6>Your Account Details:</h6>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> {user?.email}</li>
                  <li><strong>Contact:</strong> {user?.contact || 'N/A'}</li>
                  <li><strong>Package:</strong> {user?.package_name || 'N/A'}</li>
                  <li><strong>Status:</strong> {user?.status || 'Active'}</li>
                  <li><strong>Role:</strong> {user?.userRole}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Role-based Quick Actions */}
        <div className="nk-block mt-4">
          <div className="row g-4">
            {isCustomer ? (
              // Customer Actions
              <>
                <div className="col-md-6">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title">Device Performance</h6>
                      <p className="card-text">View your device performance reports.</p>
                      <Link href="/Pages/reports/device-performance" className="btn btn-primary">
                        View Performance
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title">Temperature & Humidity</h6>
                      <p className="card-text">Monitor temperature and humidity data.</p>
                      <Link href="/Pages/reports/temperature-humidity" className="btn btn-primary">
                        View Data
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Admin Actions
              <>
                <div className="col-md-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title">Customer Management</h6>
                      <p className="card-text">Manage your customers and their accounts.</p>
                      <Link href="/Pages/customers" className="btn btn-primary">
                        Manage Customers
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title">Device Management</h6>
                      <p className="card-text">Manage devices and assign them to customers.</p>
                      <Link href="/Pages/device" className="btn btn-primary">
                        Manage Devices
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card card-bordered">
                    <div className="card-inner">
                      <h6 className="card-title">Device Logs</h6>
                      <p className="card-text">View all device logs and activity.</p>
                      <Link href="/Pages/devicelogs" className="btn btn-primary">
                        View Logs
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="nk-block mt-4">
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
        </div>
      </div>
    </div>
  );
} 