'use client';
import { startRenderLoop } from '@/canvas/render-loop';
import { type RenderState } from '@/canvas/render-loop';
import { useEffect, useRef } from 'react';

/**
 * Fullscreen <canvas> that keeps its backing store in sync with its CSS size × devicePixelRatio.
 * Deliberately draws nothing – rendering, camera and the rAF loop live in `src/canvas/` (learning zone).
 */

const getState = (): RenderState => ({
  model: {
    shapes: {
      a: { id: 'a', type: 'rectangle', x: 30, y: 50, w: 50, h: 30, color: 'red' },
      b: { id: 'b', type: 'rectangle', x: 50, y: 60, w: 100, h: 120, color: 'blue' },
    },
    order: ['a', 'b'],
  },
  camera: {
    x: 0,
    y: 0,
    zoom: 2,
  },
});

export function BoardCanvas({ boardId }: { boardId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stopRenderLoop = startRenderLoop(canvas, getState);

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
      stopRenderLoop();
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
