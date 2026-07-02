'use client';

import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [width, setWidth] = useState(1280);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setWidth(w);
      if (w < 640) setBreakpoint('mobile');
      else if (w < 1024) setBreakpoint('tablet');
      else if (w < 1280) setBreakpoint('desktop');
      else setBreakpoint('wide');
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    breakpoint,
    width,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    isMobileOrTablet: breakpoint === 'mobile' || breakpoint === 'tablet',
  };
}