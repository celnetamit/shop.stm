'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function WaterRipples() {
  const [jqueryLoaded, setJqueryLoaded] = useState(false);

  useEffect(() => {
    if (!jqueryLoaded) return;

    const initRipples = () => {
      const $ = (window as any).jQuery;
      if ($ && $.fn.ripples) {
        const heroElement = $('.home-v3-hero');
        const bgCanvasElement = $('.home-v3-hero-bg-canvas');
        if (heroElement.length > 0 && bgCanvasElement.length > 0) {
          try {
            // Apply custom water ripples to the absolute, blurred and darkened background container
            bgCanvasElement.ripples({
              resolution: 512,
              dropRadius: 12,
              perturbance: 0.02, // Optimized perturbance for distinct, beautiful reflections
              interactive: false // Disable default interaction to prevent coordinates warping on child elements
            });

            // Ultra-calmed custom mouse tracker: 250ms time throttle & 45px distance threshold
            let lastDropTime = 0;
            let lastX = 0;
            let lastY = 0;

            const handleMouseMove = (e: any) => {
              const now = Date.now();
              // Restrict to maximum 1 ripple every 250ms (extremely calm, sparse drops on hover)
              if (now - lastDropTime < 250) return;

              const el = heroElement[0];
              if (!el) return;
              const rect = el.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              // Only drop if mouse moved a significant distance (45px) to prevent clusters of waves
              const distance = Math.hypot(x - lastX, y - lastY);
              if (distance < 45) return;

              // Crisp, beautifully defined wave drop directly on the background canvas
              bgCanvasElement.ripples('drop', x, y, 12, 0.015);
              lastDropTime = now;
              lastX = x;
              lastY = y;
            };

            heroElement.on('mousemove', handleMouseMove);

            // Initial wave drops to instantly showcase dynamic water surface
            setTimeout(() => {
              const w = bgCanvasElement.outerWidth() || 800;
              const h = bgCanvasElement.outerHeight() || 400;
              bgCanvasElement.ripples('drop', w / 2, h / 2, 14, 0.03);
            }, 800);

            setTimeout(() => {
              const w = bgCanvasElement.outerWidth() || 800;
              const h = bgCanvasElement.outerHeight() || 400;
              bgCanvasElement.ripples('drop', w * 0.35, h * 0.45, 12, 0.02);
              bgCanvasElement.ripples('drop', w * 0.65, h * 0.55, 12, 0.02);
            }, 1500);

            // Periodically drop a dynamic ripple every 24 seconds (very sparse auto waves)
            const interval = setInterval(() => {
              const w = bgCanvasElement.outerWidth() || 800;
              const h = bgCanvasElement.outerHeight() || 400;
              const rx = Math.random() * w;
              const ry = Math.random() * h;
              bgCanvasElement.ripples('drop', rx, ry, 10, 0.015);
            }, 24000);

            (bgCanvasElement as any).data('ripple-interval', interval);
          } catch (err) {
            console.error('Failed to initialize ripples WebGL instance:', err);
          }
        }
      }
    };

    const $ = (window as any).jQuery;
    if ($ && $.fn.ripples) {
      initRipples();
    } else {
      const checkInterval = setInterval(() => {
        const $ = (window as any).jQuery;
        if ($ && $.fn.ripples) {
          clearInterval(checkInterval);
          initRipples();
        }
      }, 50);
      
      return () => clearInterval(checkInterval);
    }

    return () => {
      const $ = (window as any).jQuery;
      if ($ && $.fn.ripples) {
        try {
          const heroElement = $('.home-v3-hero');
          const bgCanvasElement = $('.home-v3-hero-bg-canvas');
          heroElement.off('mousemove'); // Clean up cursor tracker from parent container
          const interval = bgCanvasElement.data('ripple-interval');
          if (interval) clearInterval(interval);
          bgCanvasElement.ripples('destroy');
        } catch (e) {
          // Silent catch for destroy instances
        }
      }
    };
  }, [jqueryLoaded]);

  return (
    <>
      <Script
        src="https://code.jquery.com/jquery-3.6.0.min.js"
        strategy="lazyOnload"
        id="jquery-cdn"
        onLoad={() => {
          setJqueryLoaded(true);
        }}
      />
      {jqueryLoaded && (
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js"
          strategy="lazyOnload"
          id="ripples-cdn"
        />
      )}
    </>
  );
}
