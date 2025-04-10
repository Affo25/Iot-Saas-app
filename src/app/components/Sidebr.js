'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useUserRoleStore from '../../app/store/userRoleStore'; // import Zustand role store

function Sidebar() {
  const role = useUserRoleStore((state) => state.role); // get role from global state

  // Define different menus for roles
  const adminMenus = [
    { menu_url: '/', menu_title: 'Dashboard' },
    { menu_url: '/Dashboard/Customers', menu_title: 'Customers' },
    { menu_url: '/Dashboard/Device', menu_title: 'Devices' },
  ];

  const customerMenus = [
    { menu_url: '/', menu_title: 'Dashboard' },
    { menu_url: '/Dashboard/CustomersDevice', menu_title: 'Customers Devices' },
    { menu_url: '/page2', menu_title: 'Reports' },
  ];

  // Combine common menus or switch completely
  const menuList = role === 'Admin' ? adminMenus : customerMenus;

  return (
    <div className="nk-sidebar nk-sidebar-fixed is-dark" data-content="sidebarMenu">
      <div className="nk-sidebar-element nk-sidebar-head">
        <div className="nk-sidebar-brand">
          <Link href="/" className="logo-link nk-sidebar-logo">
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
            <span className="nio-version">General</span>
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
              {menuList.map((menu, index) => (
                <li className="nk-menu-item" key={index}>
                  <Link href={menu.menu_url} className="nk-menu-link">
                    <span className="nk-menu-icon">
                      <em className="icon ni ni-dashlite"></em>
                    </span>
                    <span className="nk-menu-text">{menu.menu_title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
