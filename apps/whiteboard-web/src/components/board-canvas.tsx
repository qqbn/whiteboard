'use client';

import { useEffect, useRef } from 'react';

/**
 * Fullscreen <canvas> that keeps its backing store in sync with its CSS size × devicePixelRatio.
 * Deliberately draws nothing – rendering, camera and the rAF loop live in `src/canvas/` (learning zone).
 */
export function BoardCanvas({ boardId }: { boardId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncBackingStore = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
      const width = Math.round(cssWidth * dpr);
      const height = Math.round(cssHeight * dpr);
      // Assigning width/height clears the canvas, so only do it when something changed.
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    // CSS size changes (window resize, layout).
    const resizeObserver = new ResizeObserver(syncBackingStore);
    resizeObserver.observe(canvas);

    // DPR changes without a CSS resize (browser zoom, moving the window to another monitor).
    // A `resolution` media query only matches the current DPR, so re-subscribe after each change.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = () => {
      syncBackingStore();
      watchDpr();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDprChange);
    };
    watchDpr();

    return () => {
      resizeObserver.disconnect();
      dprQuery?.removeEventListener('change', onDprChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-board-id={boardId}
      className="block h-full w-full touch-none"
      aria-label="Whiteboard canvas"
    />
  );
}
