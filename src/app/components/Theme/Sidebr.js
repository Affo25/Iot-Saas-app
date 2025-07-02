'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import './sidebar.css';

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
    { menu_url: '/Pages/customerDashboard', menu_title: 'Dashboard', icon: 'ni-home' },
    { menu_url: '/Pages/customersdevice', menu_title: 'Customers Products', icon: 'ni-wifi' },
    { menu_url: '/Pages/devicelogs', menu_title: 'Log History', icon: 'ni-rss' },
  ];

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) setRole(storedRole);
  }, []);

  const handleNavigate = (menu_url) => {
    if (pathname === menu_url) return;
    NProgress.start();
    setTimeout(() => {
      router.push(menu_url);
      NProgress.done();
    }, 400);
  };

  const menuItems = role === 'Customer' ? customerMenuItems : adminMenuItems;

  return (
    <div
      className="nk-sidebar nk-sidebar-fixed is-light nk-sidebar"
      data-content-height="true"
      data-content="sidebarMenu"
      style={{ transition: 'width 0.3s ease', overflow: 'hidden' }}
    >
      {/* Brand Section */}
      <div className="nk-sidebar-element nk-sidebar-head border-bottom px-3 py-3">
        <div className="nk-sidebar-brand flex items-center">
          <Link href="/Pages" className="flex items-center gap-2">
            <Image
              src="/images/main-logo.png"
              alt="Logo"
              width={160}
              height={80}
              className="transition-all duration-300"
              style={{
                filter: 'invert(18%) sepia(99%) saturate(7492%) hue-rotate(215deg) brightness(95%) contrast(95%)',
              }}
            />

            {/* <span className="text-base font-semibold font-sans-serif">IOT SAAS</span> */}
          </Link>
        </div>
      </div>

      {/* Menu List */}
      <div className="nk-sidebar-element">
        <div className="nk-sidebar-content transition-all duration-300">
          <div className="nk-sidebar-menu" data-simplebar>
            <ul className="nk-menu mt-3">
              {menuItems.map((menu, index) => {
                const isActive = pathname === menu.menu_url;
                return (
                  <li key={index} className="nk-menu-item relative">
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-lg"></span>
                    )}
                    <button
                      onClick={() => handleNavigate(menu.menu_url)}
                      className={`nk-menu-link flex items-center w-full text-left px-4 py-2 pl-5 transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-primary font-semibold'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="nk-menu-icon">
                        <em className={`icon ni ${menu.icon}`}></em>
                      </span>
                      <span className="nk-menu-text ml-3">{menu.menu_title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebr;
