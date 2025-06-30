'use client';

import "bootstrap/dist/css/bootstrap.min.css";
import dynamic from "next/dynamic";
import Sidebar from "../components/Theme/Sidebr";
import  {ToastProvider}  from '../providers/ToastProvider';
import Script from "next/script";
import Header from "../components/Theme/Headers";
import { Inter } from "next/font/google";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Footers from "../components/Theme/Footers";

const BootstrapBundle = dynamic(() => import("bootstrap/dist/js/bootstrap.bundle.min.js"), { ssr: false });
const Jquery = dynamic(() => import("jquery/dist/jquery.min.js"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export default function PagesLayout({ children }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Check if current path is an auth page
  const isAuthPage = pathname?.includes('/Auth/');

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event) => {
      const { collapsed } = event.detail;
      setSidebarCollapsed(collapsed);
    };

    window.addEventListener('toggleSidebar', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('toggleSidebar', handleSidebarToggle);
    };
  }, []);

  // If it's an auth page, render without sidebar and header - full screen
  if (isAuthPage) {
    return (
      <>
        <style jsx global>{`
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: none !important;
          }
          .nk-app-root {
            margin: 0 !important;
            padding: 0 !important;
          }
        `}</style>
        <div 
          className={inter.className} 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            margin: 0, 
            padding: 0, 
            height: '100vh', 
            width: '100vw',
            overflow: 'auto'
          }}
        >
          {children}
        </div>

        {/* Toast Notifications */}
        <ToastProvider />

        {/* Load scripts asynchronously */}
        <Script src="/public/Content/assets/js/bundle.js?ver=1.4.0" strategy="afterInteractive" />
        <Script src="/public/Content/assets/js/scripts.js?ver=1.4.0" strategy="afterInteractive" />
      </>
    );
  }

  // Regular pages with sidebar and header
  return (
    <>
      <div className={`nk-app-root ${inter.className}`}>
      <div className="nk-main">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div 
          className="nk-wrap"
          
        >
          <Header />
          <div className="nk-content">
            <div className="container-fluid" >
              <div className="nk-content-inner">{children}</div>
            </div>
          </div>
          <Footers />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastProvider />

      {/* Load scripts asynchronously */}
      <Script src="/public/Content/assets/js/bundle.js?ver=1.4.0" strategy="afterInteractive" />
      <Script src="/public/Content/assets/js/scripts.js?ver=1.4.0" strategy="afterInteractive" />
    </div>
    </>
  );
}