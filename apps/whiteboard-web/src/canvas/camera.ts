// TODO(ja): kamera (pan/zoom) i transformacje ekran ↔ świat.
const MAX_ZOOM: number = 2;
const MIN_ZOOM: number = 0.1;

export type Point = { x: number; y: number };

export type Camera = {
  // TODO(ja): zastanów się, w jakich jednostkach trzymasz offset (ekran czy świat?)
  x: number;
  y: number;
  zoom: number;
};

export function screenToWorld(camera: Camera, screen: Point): Point {
  return { x: screen.x / camera.zoom + camera.x, y: screen.y / camera.zoom + camera.y };
}

export function worldToScreen(camera: Camera, world: Point): Point {
  return { x: (world.x - camera.x) * camera.zoom, y: (world.y - camera.y) * camera.zoom };
}

// TODO(ja): panBy(camera, dx, dy), zoomAt(camera, factor, anchor) – zoom względem punktu pod kursorem.

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return { x: camera.x - dx / camera.zoom, y: camera.y - dy / camera.zoom, zoom: camera.zoom };
}

export function zoomAt(camera: Camera, factor: number, anchor: Point): Camera {
  const newZoom = zoomValue(camera.zoom, factor);
  return {
    x: screenToWorld(camera, anchor).x - anchor.x / newZoom,
    y: screenToWorld(camera, anchor).y - anchor.y / newZoom,
    zoom: newZoom,
  };
}

function zoomValue(zoom: number, factor: number): number {
  const newZoom: number = zoom * factor;
  if (newZoom <= MAX_ZOOM && newZoom >= MIN_ZOOM) {
    return newZoom;
  } else {
    if (newZoom > MAX_ZOOM) return MAX_ZOOM;
    return MIN_ZOOM;
  }
}
