import type { Vec2 } from "../sim/vec2";

export interface CanvasView {
  ctx: CanvasRenderingContext2D;
  worldToScreen(p: Vec2): Vec2;
  getScale(): number;
  getSize(): { width: number; height: number };
  /** Re-fits the view to a new world radius — needed when switching to a level with a different orbit scale. */
  setWorldRadius(radius: number): void;
  destroy(): void;
}

/**
 * Sets up DPR-correct canvas sizing and a world<->screen transform centered
 * on the planet. worldRadius is the largest radius (e.g. the target orbit,
 * with margin) that must fit within the shorter viewport dimension.
 */
export function createCanvasView(canvas: HTMLCanvasElement, initialWorldRadius: number): CanvasView {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  let cssWidth = 0;
  let cssHeight = 0;
  let scale = 1;
  let worldRadius = initialWorldRadius;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = (Math.min(cssWidth, cssHeight) / 2 / worldRadius) * 0.9;
  }

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function worldToScreen(p: Vec2): Vec2 {
    return { x: cssWidth / 2 + p.x * scale, y: cssHeight / 2 - p.y * scale };
  }

  return {
    ctx,
    worldToScreen,
    getScale: () => scale,
    getSize: () => ({ width: cssWidth, height: cssHeight }),
    setWorldRadius: (radius: number) => {
      worldRadius = radius;
      resize();
    },
    destroy: () => observer.disconnect(),
  };
}
