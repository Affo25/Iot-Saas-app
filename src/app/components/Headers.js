
'use client';

import { useRouter } from 'next/navigation';
import React from 'react'


function Headers() {

  const router = useRouter();

  const handleRedirect = () => {
    router.push('/Auth/Login'); // Redirects to login page
  };


  return (
    <div className="nk-header is-light">
      <div className="container-fluid">
        <div className="nk-header-wrap">
          <div className="nk-menu-trigger d-xl-none ml-n1">
            <a href="#" className="nk-nav-toggle nk-quick-nav-icon" data-target="sidebarMenu"><em className="icon ni ni-menu"></em></a>
          </div>
          <div className="nk-header-brand d-xl-none">
            <a href="html/crypto/index.html" className="logo-link">
              <img className="logo-light logo-img" src="/content/images/logo.png" srcSet="/content/images/logo2x.png 2x" alt="logo" />
              <img className="logo-dark logo-img" src="/content/images/logo-dark.png" srcSet="/content/images/logo-dark2x.png 2x" alt="logo-dark" />
              <span className="nio-version">General</span>
            </a>
          </div>
          {/* Page title would go here */}

          <div className="nk-header-tools">
            <ul className="nk-quick-nav">
              <li className="dropdown user-dropdown">
                <a href="#" className="dropdown-toggle" data-toggle="dropdown">
                  <div className="user-toggle">
                    <div className="user-avatar sm">
                      <em className="icon ni ni-user-alt"></em>
                    </div>
                    <div onClick={handleRedirect} className="user-info d-none d-md-block">
                      Admin
                    </div>
                  </div>
                </a>
                <div className="dropdown-menu dropdown-menu-md dropdown-menu-right dropdown-menu-s1">
                  <div className="dropdown-inner">
                    <ul className="link-list">
                      <li><a href="/logout"><em className="icon ni ni-signout"></em><span>Sign out</span></a></li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Headers