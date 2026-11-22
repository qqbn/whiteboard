'use client';
import { createBoardStore } from '@/canvas/board-store';
import { screenToWorld, type Point } from '@/canvas/camera';
import { hitTest } from '@/canvas/hit-test';
import type { BoardModel, Shape } from '@/canvas/model';
import { startRenderLoop, type RenderState } from '@/canvas/render-loop';
import { boundsFromDrag, isTinyDrag } from '@/lib/drag-rect';
import { translateShape } from '@/lib/move-shape';
import { useCameraStore } from '@/stores/camera-store';
import { useSelectionStore } from '@/stores/selection-store';
import { useToolStore, type ToolType } from '@/stores/tool-store';
import { useEffect, useRef } from 'react';

/**
 * Fullscreen <canvas> that keeps its backing store in sync with its CSS size × devicePixelRatio
 * and translates mouse input into camera movement (pan/zoom) and new shapes.
 * Rendering, camera maths and the rAF loop live in `src/canvas/` (learning zone).
 */

const boardStore = createBoardStore();

/** Id of the shape being dragged out. It only exists in the preview model, never in the store. */
const DRAFT_ID = '__draft__';
const SHAPE_COLOR = '#4f46e5';
/** A drag smaller than this (in world units, both sides) is treated as a click and creates nothing. */
const MIN_SHAPE_SIZE = 4;
/** Pointer travel (canvas pixels) before a click on a shape turns into a move, so clicks don't nudge shapes. */
const MOVE_DEAD_ZONE_PX = 3;
/** Wheel sensitivity: zoom factor = exp(-deltaY * ZOOM_SENSITIVITY), so scrolling back undoes it exactly. */
const ZOOM_SENSITIVITY = 0.0015;
/** Firefox reports wheel deltas in lines instead of pixels; this converts lines to pixels. */
const LINE_HEIGHT_PX = 16;

type DrawableTool = Extract<ToolType, 'rectangle' | 'ellipse'>;

/**
 * What the pointer is currently doing. Lives in a closure variable (not React state) because it
 * changes on every pointermove and nothing in React needs to re-render for it.
 * - `pan`: dragging the camera; `last` is the previous pointer position in canvas pixels.
 * - `draw`: dragging out a new shape; `start`/`current` are in world coordinates.
 * - `move`: dragging an existing shape. `original` is the shape as it was at pointerdown (the store
 *   is not touched until release); `startScreen` is the pointer position in canvas pixels (for the
 *   dead zone), `startWorld` in world coordinates (for the delta); `delta` is the TOTAL offset in
 *   world units since pointerdown; `moved` flips to true once the pointer left the dead zone.
 */
type Interaction =
  | { kind: 'pan'; pointerId: number; last: Point }
  | { kind: 'draw'; pointerId: number; tool: DrawableTool; start: Point; current: Point }
  | {
      kind: 'move';
      pointerId: number;
      original: Shape;
      startScreen: Point;
      startWorld: Point;
      delta: Point;
      moved: boolean;
    };

function isDrawableTool(tool: ToolType): tool is DrawableTool {
  return tool === 'rectangle' || tool === 'ellipse';
}

/** Builds a rectangle/ellipse spanning the drag from `start` to `current` (works for any drag direction). */
function shapeFromDrag(id: string, drag: Extract<Interaction, { kind: 'draw' }>): Shape {
  const { x, y, w, h } = boundsFromDrag(drag.start, drag.current);
  return { id, type: drag.tool, x, y, w, h, color: SHAPE_COLOR };
}

/** Returns a copy of the model with `shape` appended on top, without touching the store. */
function withPreviewShape(model: BoardModel, shape: Shape): BoardModel {
  return {
    shapes: { ...model.shapes, [shape.id]: shape },
    order: [...model.order, shape.id],
  };
}

/** Returns a copy of the model where one existing shape is swapped for `shape` (draw order unchanged). */
function withReplacedShape(model: BoardModel, shape: Shape): BoardModel {
  return { shapes: { ...model.shapes, [shape.id]: shape }, order: model.order };
}

export function BoardCanvas({ boardId }: { boardId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let interaction: Interaction | null = null;
    let spaceHeld = false;

    // Pointer position relative to the canvas' top-left corner, in CSS pixels.
    // This is the coordinate space the camera works in (the render loop applies DPR separately).
    const toCanvasPoint = (event: { clientX: number; clientY: number }): Point => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const toWorldPoint = (event: { clientX: number; clientY: number }): Point =>
      screenToWorld(useCameraStore.getState().camera, toCanvasPoint(event));

    // Picks the mouse cursor that matches what a click-drag would do right now.
    const updateCursor = () => {
      if (interaction?.kind === 'pan') canvas.style.cursor = 'grabbing';
      else if (interaction?.kind === 'move') canvas.style.cursor = 'move';
      else if (spaceHeld) canvas.style.cursor = 'grab';
      else if (isDrawableTool(useToolStore.getState().activeTool))
        canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'default';
    };

    // What the render loop draws each frame: the committed model plus, while the user is
    // dragging out a shape or moving one, a live preview of it. The preview is not in the store, so
    // a cancelled gesture leaves no trace (and a single `add`/`update` on release means one future
    // undo step). The selection outline follows a moved shape because it is drawn from this model.
    const getPreviewModel = (): BoardModel => {
      const model = boardStore.getModel();
      if (interaction?.kind === 'draw') {
        return withPreviewShape(model, shapeFromDrag(DRAFT_ID, interaction));
      }
      if (interaction?.kind === 'move' && interaction.moved) {
        const { original, delta } = interaction;
        return withReplacedShape(model, translateShape(original, delta.x, delta.y));
      }
      return model;
    };

    const getState = (): RenderState => {
      return {
        model: getPreviewModel(),
        camera: useCameraStore.getState().camera,
        selectedId: useSelectionStore.getState().selectedId,
      };
    };

    const stopRenderLoop = startRenderLoop(canvas, getState);

    // Mouse wheel zooms towards the cursor: the world point under the pointer stays put.
    const onWheel = (event: WheelEvent) => {
      // Stops the page (or browser pinch-zoom for ctrl+wheel) from reacting; needs a non-passive listener.
      event.preventDefault();
      const deltaY = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT_PX : event.deltaY;
      const factor = Math.exp(-deltaY * ZOOM_SENSITIVITY);
      useCameraStore.getState().zoomAtScreen(factor, toCanvasPoint(event));
    };

    // Starts a pan (middle button, or left button while holding Space) or a shape drag (left button
    // with the rectangle/ellipse tool), or, with the select tool, selects the shape under the cursor
    // and arms a move gesture on it.
    const onPointerDown = (event: PointerEvent) => {
      if (interaction) return; // one gesture at a time (e.g. ignore a second finger/button)

      const wantsPan = event.button === 1 || (event.button === 0 && spaceHeld);
      const tool = useToolStore.getState().activeTool;

      if (wantsPan) {
        event.preventDefault(); // stops the browser's middle-click autoscroll
        interaction = { kind: 'pan', pointerId: event.pointerId, last: toCanvasPoint(event) };
      } else if (event.button === 0 && isDrawableTool(tool)) {
        const start = toWorldPoint(event);
        interaction = { kind: 'draw', pointerId: event.pointerId, tool, start, current: start };
      } else if (event.button === 0 && tool === 'select') {
        // Select the topmost shape under the cursor, or clear the selection when the click lands on
        // empty space. If a shape was hit, also arm a move: nothing changes until the pointer leaves
        // the dead zone, so a plain click only selects.
        const startWorld = toWorldPoint(event);
        const hitId = hitTest(boardStore.getModel(), startWorld);
        useSelectionStore.getState().select(hitId);
        const original = hitId === null ? undefined : boardStore.get(hitId);
        if (!original) return;
        interaction = {
          kind: 'move',
          pointerId: event.pointerId,
          original,
          startScreen: toCanvasPoint(event),
          startWorld,
          delta: { x: 0, y: 0 },
          moved: false,
        };
      } else {
        return;
      }

      // Keeps delivering move/up events to the canvas even if the pointer leaves it mid-drag.
      canvas.setPointerCapture(event.pointerId);
      updateCursor();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interaction || event.pointerId !== interaction.pointerId) return;

      if (interaction.kind === 'pan') {
        // Delta from our own last position (not `movementX`, which is unreliable under browser zoom).
        const point = toCanvasPoint(event);
        useCameraStore
          .getState()
          .panByScreen(point.x - interaction.last.x, point.y - interaction.last.y);
        interaction.last = point;
      } else if (interaction.kind === 'move') {
        // The dead zone is measured on screen (so it feels the same at any zoom), the delta in the
        // world. The delta is always TOTAL since pointerdown, never accumulated per event.
        if (!interaction.moved) {
          const point = toCanvasPoint(event);
          const travelled = Math.hypot(
            point.x - interaction.startScreen.x,
            point.y - interaction.startScreen.y,
          );
          if (travelled < MOVE_DEAD_ZONE_PX) return;
          interaction.moved = true;
        }
        const world = toWorldPoint(event);
        interaction.delta = {
          x: world.x - interaction.startWorld.x,
          y: world.y - interaction.startWorld.y,
        };
      } else {
        // Converted with the *current* camera, so zooming with the wheel mid-drag stays consistent.
        interaction.current = toWorldPoint(event);
      }
    };

    // Ends the gesture. A finished shape drag is committed to the store as one `add`, a finished
    // move as one `update` of the final position (skipped when the shape never left the dead zone).
    const onPointerUp = (event: PointerEvent) => {
      if (!interaction || event.pointerId !== interaction.pointerId) return;

      if (interaction.kind === 'draw') {
        interaction.current = toWorldPoint(event);
        const shape = shapeFromDrag(crypto.randomUUID(), interaction);
        const size = boundsFromDrag(interaction.start, interaction.current);
        if (!isTinyDrag(size, MIN_SHAPE_SIZE)) boardStore.add(shape);
      } else if (interaction.kind === 'move' && interaction.moved) {
        const { original, delta } = interaction;
        const moved = translateShape(original, delta.x, delta.y);
        boardStore.update(original.id, { x: moved.x, y: moved.y });
      }

      interaction = null;
      updateCursor();
    };

    // Aborts the gesture without committing anything (system interruption, lost capture, Escape).
    const cancelInteraction = () => {
      interaction = null;
      updateCursor();
    };

    // Space turns the left button into a pan handle; Escape cancels a shape drag in progress (or clears the selection when idle).
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable]'))
        return;

      if (event.code === 'Space') {
        event.preventDefault(); // otherwise Space scrolls the page or "clicks" a focused toolbar button
        spaceHeld = true;
        updateCursor();
      } else if (event.key === 'Escape') {
        if (interaction?.kind === 'draw' || interaction?.kind === 'move') cancelInteraction();
        else useSelectionStore.getState().select(null);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      spaceHeld = false;
      updateCursor();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', cancelInteraction);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // Keeps the cursor in sync when the user picks another tool in the toolbar.
    const unsubscribeTool = useToolStore.subscribe(updateCursor);
    updateCursor();

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
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', cancelInteraction);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      unsubscribeTool();
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
