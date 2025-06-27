'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

function Sidebr() {
  const [role, setRole] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const adminMenuItems = [
    { menu_url: '/Pages', menu_title: 'Dashboard', icon: 'ni-home' },
    { menu_url: '/Pages/customers', menu_title: 'Customers', icon: 'ni-users' },
    { menu_url: '/Pages/device', menu_title: 'Products', icon: 'ni-wifi' },
    { menu_url: '/Pages/devicelogs', menu_title: 'Log History', icon: 'ni-rss' },
  ];

  const customerMenuItems = [
    { menu_url: '/Pages', menu_title: 'Dashboard', icon: 'ni-home' },
    { menu_url: '/Pages/customersdevice', menu_title: 'Customers Products', icon: 'ni-wifi' },
    { menu_url: '/Pages/devicelogs', menu_title: 'Log History', icon: 'ni-rss' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) setRole(storedRole);
    }
  }, []);

  const handleNavigate = (menu_url) => {
    if (pathname === menu_url) return;

    NProgress.start();
    // setTimeout(() => NProgress.set(0.1), 200);
    // setTimeout(() => NProgress.set(0.3), 200);
    // setTimeout(() => NProgress.set(0.7), 200);
    // setTimeout(() => NProgress.set(0.7), 200);
    // setTimeout(() => NProgress.set(0.9), 200);
    // setTimeout(() => NProgress.set(1.0), 200);
    setTimeout(() => {
      router.push(menu_url);
      NProgress.done();
    }, 10000);
  };

  return (
    <div className="nk-sidebar nk-sidebar-fixed is-light" data-content="sidebarMenu">
      <div className="nk-sidebar-element nk-sidebar-head">
        <div className="nk-sidebar-brand">
          <Link href="/Pages" className="logo-link nk-sidebar-logo">
            <Image
              className="logo-light logo-img"
              src="/images/logo.png"
              alt="logo"
              width={100}
              height={50}
            />
            <img
              className="logo-dark logo-img"
              src="/images/logo-dark.png"
              alt="logo-dark"
            />
            <span className="nio-version">QRCode Generator</span>
          </Link>
        </div>
        <div className="nk-menu-trigger mr-n2">
          <Link href="#" className="nk-nav-toggle nk-quick-nav-icon d-xl-none" data-target="sidebarMenu">
            <em className="icon ni ni-arrow-left"></em>
          </Link>
        </div>
      </div>

      <div className="nk-sidebar-element">
        <div className="nk-sidebar-content">
          <div className="nk-sidebar-menu" data-simplebar>
            <ul className="nk-menu">
              {role ? (
                (role === 'Customer' ? customerMenuItems : adminMenuItems).map((menu, index) => {
                  const isActive = pathname === menu.menu_url;
                  return (
                    <li key={index} className={`nk-menu-item ${isActive ? 'active' : ''}`}>
                      <button
                        onClick={() => handleNavigate(menu.menu_url)}
                        className={`w-full text-left nk-menu-link px-4 py-2 mx-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-white font-semibold pl-6 pr-4'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="nk-menu-icon">
                          <em className={`icon ni ${menu.icon}`}></em>
                        </span>
                        <span className="nk-menu-text">{menu.menu_title}</span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="nk-menu-item">
                  <div className="nk-menu-link block px-4 py-2 mx-2 text-gray-500">
                    <span className="nk-menu-text">Loading menu...</span>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebr;
