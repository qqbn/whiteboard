import { create } from 'zustand';
import { panBy, zoomAt } from '@/canvas/camera';
import type { Camera, Point } from '@/canvas/camera';

export const INITIAL_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

type CameraState = {
  camera: Camera;
  /** `dx`/`dy` w pikselach ekranu (delta kursora). */
  panByScreen: (dx: number, dy: number) => void;
  /** `anchor` w pikselach ekranu, względem lewego górnego rogu canvasa. */
  zoomAtScreen: (factor: number, anchor: Point) => void;
  resetCamera: () => void;
};

/** UI-only state (kamera to widok, nie dokument). Renderer czyta ją przez `useCameraStore.getState()`. */
export const useCameraStore = create<CameraState>()((set) => ({
  camera: INITIAL_CAMERA,
  panByScreen: (dx, dy) => set((state) => ({ camera: panBy(state.camera, dx, dy) })),
  zoomAtScreen: (factor, anchor) =>
    set((state) => ({ camera: zoomAt(state.camera, factor, anchor) })),
  resetCamera: () => set({ camera: INITIAL_CAMERA }),
}));

export type { Camera, Point };
