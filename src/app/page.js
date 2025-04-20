'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from './components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    // If we're in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      // If user is already logged in, redirect to dashboard
      if (token) {
        setShowSplash(false);
        router.push('/Dashboard');
      }
    }
  }, [router]);

  // Show splash screen or redirect
  return showSplash ? <SplashScreen /> : null;
}
