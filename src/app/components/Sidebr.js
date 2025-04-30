'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useUserRoleStore from '../store/userRoleStore';
import { usePathname, useRouter } from 'next/navigation';

function Sidebr() {
  const role = useUserRoleStore((state) => state.role);
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const adminMenus = [
    { menu_url: '/Dashboard/page', menu_title: 'Dashboard', icon: 'ni-dashlite' },
    { menu_url: '/Dashboard/Customers', menu_title: 'Customers', icon: 'ni-users' },
    { menu_url: '/Dashboard/Device', menu_title: 'Devices', icon: 'ni-dashlite' },
    { menu_url: '/Dashboard/DeviceLogs', menu_title: 'DeviceLogs', icon: 'ni-activity' },
    { menu_url: '/Dashboard/CustomersDevice', menu_title: 'CustomersDevice', icon: 'ni-activity' },
    { menu_url: '/Dashboard/Reports', menu_title: 'Reports', icon: 'ni-report' },
  ];

  const customerMenus = [
    { menu_url: '/Dashboard/page', menu_title: 'Dashboard', icon: 'ni-dashlite' },
    { menu_url: '/Dashboard/CustomersDevice', menu_title: 'CustomersDevice', icon: 'ni-activity' },
    { menu_url: '/Dashboard/Reports', menu_title: 'Reports', icon: 'ni-report' },
  ];

  const menuList = role === 'Admin' ? adminMenus : customerMenus;

  // Show loading bar on pathname change
  useEffect(() => {
    if (pathname) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

   return (
      <>
        {loading && (
          <div className="fixed top-0 left-0 right-0 h-[3px] bg-blue-500 z-[9999] animate-pulse transition-all duration-300" />
        )}
  
        <div className="nk-sidebar nk-sidebar-fixed is-light" data-content="sidebarMenu">
          <div className="nk-sidebar-element nk-sidebar-head">
            <div className="nk-sidebar-brand">
              <Link href="/Dashboard" className="logo-link nk-sidebar-logo">
                <Image
                  className="logo-light logo-img"
                  src="/images/logo.png"
                  alt="logo"
                  width={100}
                  height={50}
                  srcSet="/images/logo2x.png 2x"
                />
                <img
                  className="logo-dark logo-img"
                  src="/images/logo-dark.png"
                  srcSet="/images/logo-dark2x.png 2x"
                  alt="logo-dark"
                />
                <span className="nio-version">QRCode Generator</span>
              </Link>
            </div>
            <div className="nk-menu-trigger mr-n2">
              <Link
                href="#"
                className="nk-nav-toggle nk-quick-nav-icon d-xl-none"
                data-target="sidebarMenu"
              >
                <em className="icon ni ni-arrow-left"></em>
              </Link>
            </div>
          </div>
  
          <div className="nk-sidebar-element">
            <div className="nk-sidebar-content">
              <div className="nk-sidebar-menu" data-simplebar>
              <ul className="nk-menu">
    {customerMenus.map((menu, index) => {
      const isActive = pathname === menu.menu_url;
      return (
        <li
          key={index}
          className={`nk-menu-item ${isActive ? 'active' : ''}`}
        >
         <Link
            href={menu.menu_url}
            className={`nk-menu-link block px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
              isActive ? 'bg-primary text-white font-bold' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="nk-menu-icon">
              <em className={`icon ni ${menu.icon}`}></em>
            </span>
            <span className="nk-menu-text">{menu.menu_title}</span>
          </Link>
        </li>
      );
    })}
  </ul>
  
              </div>
            </div>
          </div>
        </div>
      </>
    );
}

export default Sidebr;
