"use client";
import React, { Suspense } from "react";
import CustomerDevicesContent from './CustomerDevicesContent';

// Loading component for Suspense fallback
function CustomerDevicesLoading() {
  return (
    <div className="nk-content-body">
      <div className="nk-block-head nk-block-head-sm p-0">
        <div className="nk-block-between">
          <div className="nk-block-head-content">
            <h3 className="nk-block-title page-title">Customer Devices</h3>
            <div className="nk-block-des text-soft">
              <p>Loading customer devices...</p>
            </div>
          </div>
        </div>
      </div>
      <div className="nk-block">
        <div className="card card-bordered">
          <div className="card-inner">
            <div className="d-flex align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary mr-2" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <span>Loading customer devices...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function Page() {
  return (
    <Suspense fallback={<CustomerDevicesLoading />}>
      <CustomerDevicesContent />
    </Suspense>
  );
}