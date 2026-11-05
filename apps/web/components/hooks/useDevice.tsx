'use client';
import { useEffect, useState } from 'react';

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', () => setIsMobile(window.innerWidth < 1024));
    return () => window.removeEventListener('resize', () => setIsMobile(window.innerWidth < 1024));
  }, []);
  return {
    isMobile,
    isDesktop: !isMobile,
  };
}
