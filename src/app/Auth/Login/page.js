'use client'; // if you're in `app/` directory and using client-side logic like form state

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

function SignInPage() {
  return (
    <div className="nk-app-root">
      <div className="nk-split nk-split-page nk-split-md">
        <div className="nk-split-content nk-block-area nk-block-area-column nk-auth-container">
          <div className="absolute-top-right d-lg-none p-3 p-sm-5">
            <button className="toggle btn-white btn btn-icon btn-light" data-target="athPromo">
              <em className="icon ni ni-info"></em>
            </button>
          </div>

          <div className="nk-block nk-block-middle nk-auth-body">
            <div className="brand-logo pb-5">
              <Link href="/" className="logo-link">
                <Image
                  className="logo-light logo-img logo-img-lg"
                  src="/content/images/logo.png"
                  srcSet="/content/images/logo2x.png 2x"
                  alt="logo"
                  width={200}
                  height={60}
                />
                <Image
                  className="logo-dark logo-img logo-img-lg"
                  src="/content/images/logo-dark.png"
                  srcSet="/content/images/logo-dark2x.png 2x"
                  alt="logo-dark"
                  width={200}
                  height={60}
                />
              </Link>
            </div>

            <div className="nk-block-head">
              <div className="nk-block-head-content">
                <h5 className="nk-block-title">Sign-In</h5>
                <div className="nk-block-des">
                  <p>Access the DashLite panel using your email and passcode.</p>
                </div>
              </div>
            </div>

            <form action="/api/login" method="POST">
              <div className="form-group">
                <div className="form-label-group">
                  <label className="form-label" htmlFor="Email">Email or Username</label>
                </div>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="Email"
                  name="Email"
                  placeholder="Enter your email address or username"
                />
              </div>

              <div className="form-group">
                <div className="form-label-group">
                  <label className="form-label" htmlFor="Password">Passcode</label>
                </div>
                <div className="form-control-wrap">
                  <a tabIndex="-1" href="#" className="form-icon form-icon-right passcode-switch" data-target="Password">
                    <em className="passcode-icon icon-show icon ni ni-eye"></em>
                    <em className="passcode-icon icon-hide icon ni ni-eye-off"></em>
                  </a>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="Password"
                    name="Password"
                    placeholder="Enter your passcode"
                  />
                </div>
              </div>

              <div className="form-group">
                <button type="submit" className="btn btn-lg btn-primary btn-block">Sign in</button>
              </div>
            </form>
          </div>
        </div>

        <div className="nk-split-content nk-split-stretch bg-lighter d-flex toggle-break-lg toggle-slide toggle-slide-right" data-content="athPromo" data-toggle-screen="lg" data-toggle-overlay="true">
          <div className="slider-wrap w-100 w-max-550px p-3 p-sm-5 m-auto">
            <div className="slider-init" data-slick='{"dots":true, "arrows":false}'>
              <div className="slider-item">
                <div className="nk-feature nk-feature-center">
                  <div className="nk-feature-img">
                    <Image
                      className="round"
                      src="/content/images/slides/promo-a.png"
                      srcSet="/content/images/slides/promo-a2x.png 2x"
                      alt="Promo"
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="nk-feature-content py-4 p-sm-5">
                    <h4>EventXLite Dashboard</h4>
                    <p>You can start to create your products easily with its user-friendly design & most completed responsive layout.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="slider-dots"></div>
            <div className="slider-arrows"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
