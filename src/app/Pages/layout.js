'use client';

import "bootstrap/dist/css/bootstrap.min.css";
import dynamic from "next/dynamic";
import Sidebar from "../components/Theme/Sidebr";
import  {ToastProvider}  from '../providers/ToastProvider';
import Script from "next/script";
import Header from "../components/Theme/Headers";
import { Inter } from "next/font/google";
import { usePathname } from 'next/navigation';
import Footers from "../components/Theme/Footers";

const BootstrapBundle = dynamic(() => import("bootstrap/dist/js/bootstrap.bundle.min.js"), { ssr: false });
const Jquery = dynamic(() => import("jquery/dist/jquery.min.js"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export default function PagesLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className={`nk-app-root ${inter.className}`}>
      <div className="nk-main">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <div className="nk-wrap">
          <Header />
          <div className="nk-content">
            <div className="container-fluid">
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
  );
}