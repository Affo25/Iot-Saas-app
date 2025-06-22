'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from './components/SplashScreen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('user-role');
      
      // If user is not logged in, redirect to login page
      if (!token) {
        router.push('/Pages');
      } else {
        // Redirect based on user role
        if (userRole === 'Customer') {
          router.push('/Pages');
        } else {
          router.push('/Pages');
        }
      }
    }
  }, [router]);

  return <SplashScreen />;
}
