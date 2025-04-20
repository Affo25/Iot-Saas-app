'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/Auth/Login');
      return;
    }
    
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
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

  return (
    <div className="container-fluid">
      <div className="nk-content-body">
        <div className="nk-block-head nk-block-head-sm">
          <div className="nk-block-between">
            <div className="nk-block-head-content">
              <h3 className="nk-block-title page-title">Dashboard</h3>
            </div>
          </div>
        </div>
        
        <div className="nk-block">
          <div className="card card-bordered">
            <div className="card-inner">
              <h5 className="card-title">Welcome, {user?.full_name || 'User'}!</h5>
              <p className="card-text">
                This is your dashboard. You can manage your devices and view reports from here.
              </p>
              
              <div className="mt-4">
                <h6>Your Account Details:</h6>
                <ul className="list-unstyled">
                  <li><strong>Email:</strong> {user?.email}</li>
                  <li><strong>Contact:</strong> {user?.contact}</li>
                  <li><strong>Package:</strong> {user?.package_name}</li>
                  <li><strong>Status:</strong> {user?.status}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 