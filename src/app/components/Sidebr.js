
import React from 'react'
import Link from "next/link"; // Import the Link component
import Image from 'next/image';



function Sidebar() {
    const menuList = [
        { menu_url: "/", menu_title: "Dashboard" },
        { menu_url: "/Dashboard/Customers", menu_title: "Customers" },
        { menu_url: "/page2", menu_title: "Packages" },
        { menu_url: "/page3", menu_title: "Users" },
        { menu_url: "/Dashboard/Device", menu_title: "Devices" },
        { menu_url: "/page5", menu_title: "Product Mngement"},
      ];

  return (
    <div className="nk-sidebar nk-sidebar-fixed is-dark" data-content="sidebarMenu">
    <div className="nk-sidebar-element nk-sidebar-head">
      <div className="nk-sidebar-brand">
        <Link href="/" className="logo-link nk-sidebar-logo">
        <Image
  className="logo-light logo-img"
  src="/images/logo.png"
  alt="logo"
  width={100}  // Replace with your image's actual width
  height={50}  // Replace with your image's actual height
  srcSet="/images/logo2x.png 2x"  // For high DPI screens
/>
          <img
            className="logo-dark logo-img"
            src="../../public/images/logo-dark.png"
            srcSet="../../public/images/logo-dark2x.png 2x"
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
                      {/* Static Menu Items with Link Component */}
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
  )
}

export default Sidebar
