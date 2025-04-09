"use client"; // Mark this as a Client Component

import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../public/assets/css/dashlite.css";
import dynamic from "next/dynamic";
import Footers from "./components/Footers";
import Sidebar from "./components/Sidebr";
import { ToastProvider } from './providers/ToastProvider';
import Script from "next/script";
import Header from "./components/Headers";

// Dynamically import Bootstrap and jQuery on the client side
const BootstrapBundle = dynamic(() => import("bootstrap/dist/js/bootstrap.bundle.min.js"), {
  ssr: false, // Disable SSR for this import
});

const Jquery = dynamic(() => import("jquery/dist/jquery.min.js"), {
  ssr: false, // Disable SSR for this import
});

export default function RootLayout({ children }) {
  // Static menu items

  return (
    <html lang="en">
      <body className="bg-lighter npc-general has-sidebar">
        <div className="nk-app-root">
          <div className="nk-main">
            {/* Sidebar */}
            <Sidebar />
            {/* Main Content */}
            <div className="nk-wrap">
              <Header/>
              <div className="nk-content">
                <div className="container-fluid">
                  <div className="nk-content-inner">{children}</div>
                </div>
              </div>
              <Footers />
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastProvider />

        {/* Load scripts asynchronously using next/script */}
        <Script
          src="/Content/assets/js/bundle.js?ver=1.4.0"
          strategy="afterInteractive" // Load after the page has been rendered
        />
        <Script
          src="/Content/assets/js/scripts.js?ver=1.4.0"
          strategy="afterInteractive" // Load after the page has been rendered
        />
      </body>
    </html>
  );
}
