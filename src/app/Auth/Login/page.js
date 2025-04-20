'use client'; // if you're in `app/` directory and using client-side logic like form state

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useLoginStore from '../../store/LoginStore';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { NextResponse } from 'next/server';
import useUserRoleStore from '../../store/userRoleStore';



function SignInPage() {
  const router = useRouter();
  const setRole = useUserRoleStore((state) => state.setRole);
  const role = useUserRoleStore((state) => state.role);
  const { formData = { email: '', password: '', userRole:"" }, formErrors = {}, loading = false, setFormData, login } = useLoginStore();

  useEffect(() => {
    // Initialize form data if needed
    if (!formData.email && !formData.password && !formData.userRole) {
      setFormData({ email: '', password: '',userRole:'' });
    }
  }, []);

  const handleRoleClick = (role) => {
    setRole(role);
    console.log("Selected Role:", role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!formData.email || !formData.password || !formData.userRole) {
        toast.error('Please enter both email and password or select user role');
        return;
      }

      const userData = {
        email: formData.email,
        password: formData.password,
        userRole: formData.userRole
      };
      console.log(userData);

      // Call login function from store
      const result = await login(userData);

      if (result && result.success) {
        console.log("Login successful, redirecting...",result);
        // Use window.location for a hard navigation
        //window.location.href = '/Dashboard/layout';
        const userRole = result.user?.userRole;
        setRole(userRole);
        console.log(result.userRole);
        router.push("/Dashboard");

      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

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
                  src="/images/logo.png"
                  srcSet="/images/logo2x.png 2x"
                  alt="logo"
                  width={200}
                  height={60}
                />
                <Image
                  className="logo-dark logo-img logo-img-lg"
                  src="/images/logo-dark.png"
                  srcSet="/images/logo-dark2x.png 2x"
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

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div className="form-label-group">
                  <label className="form-label" htmlFor="email">Email or Username</label>
                </div>
                <input
                  type="text"
                  className={`form-control form-control-lg ${formErrors?.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData?.email || ''}
                  onChange={handleChange}
                  placeholder="Enter your email address or username"
                />
                {formErrors?.email && (
                  <div className="invalid-feedback">{formErrors.email}</div>
                )}
              </div>

              <div className="form-group">
                <div className="form-label-group">
                  <label className="form-label" htmlFor="password">Passcode</label>
                </div>
                <div className="form-control-wrap">
                  <a tabIndex="-1" href="#" className="form-icon form-icon-right passcode-switch" data-target="password">
                    <em className="passcode-icon icon-show icon ni ni-eye"></em>
                    <em className="passcode-icon icon-hide icon ni ni-eye-off"></em>
                  </a>
                  <input
                    type="password"
                    className={`form-control form-control-lg ${formErrors?.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData?.password || ''}
                    onChange={handleChange}
                    placeholder="Enter your passcode"
                  />
                  {formErrors?.password && (
                    <div className="invalid-feedback">{formErrors.password}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-group">
                  <label className="form-label" htmlFor="userRole">User Role</label>
                </div>
                <div className="form-control-wrap">
                  <select
                    className={`form-control form-control-lg ${formErrors?.userRole ? 'is-invalid' : ''}`}
                    id="userRole"
                    name="userRole"
                    value={formData?.userRole || ''}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select User role</option>
                    <option value="Admin">Admin</option>
                    <option value="Customer">Customer</option>
                  </select>
                  {formErrors?.userRole && (
                    <div className="invalid-feedback">{formErrors.userRole}</div>
                  )}
                </div>
              </div>


              <div className="form-group">
                <button
                  type="submit"
                  className="btn btn-lg btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
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
                      src="/images/slides/promo-a.png"
                      srcSet="/images/slides/promo-a2x.png 2x"
                      alt="Promo"
                      width={300}
                      height={300}
                    />
                  </div>
                  <div className="nk-feature-content py-4">
                    <h4 className="nk-feature-title">Manage your devices</h4>
                    <p className="nk-feature-text">Easily manage and monitor your IoT devices from a single dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInPage;
