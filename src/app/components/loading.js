// components/TopLoadingBar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/router';

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 500); // Adjust timing if needed
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-blue-500 z-[9999] animate-pulse transition-all duration-300" />
      )}
    </>
  );
}
