import { PLANET_RADIUS, SHIP_RENDER_RADIUS } from "../sim/constants";
import { findClosestApproach } from "../sim/closestApproach";
import { tracePreview } from "../sim/predictor";
import { targetPosition } from "../sim/target";
import { length, lengthSq } from "../sim/vec2";
import type { CanvasView } from "./canvas";
import type { GameState } from "../game/state";
import type { Vec2 } from "../sim/vec2";

const COLORS = {
  background: "#0b0f1a",
  planet: "#4a5568",
  targetOrbit: "#f6ad55",
  shipTrace: "#63b3ed",
  shipTraceBurning: "#90cdf4",
  ship: "#e2e8f0",
  target: "#f6ad55",
  marker: "#a0aec0",
};

export function renderFrame(view: CanvasView, state: GameState): void {
  const { ctx } = view;
  const { width, height } = view.getSize();

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  drawPlanet(view);
  drawTargetOrbit(view, state);
  const preview = tracePreview(state.ship);
  drawShipTrace(view, preview.points, state.burnSign !== 0);
  drawApsisMarkers(view, preview.points);
  drawClosestApproach(view, preview, state);
  drawShip(view, state);
  drawTarget(view, state);
}

function drawPlanet(view: CanvasView): void {
  const { ctx } = view;
  const center = view.worldToScreen({ x: 0, y: 0 });
  ctx.beginPath();
  ctx.arc(center.x, center.y, PLANET_RADIUS * view.getScale(), 0, Math.PI * 2);
  ctx.fillStyle = COLORS.planet;
  ctx.fill();
}

function drawTargetOrbit(view: CanvasView, state: GameState): void {
  const { ctx } = view;
  const center = view.worldToScreen({ x: 0, y: 0 });
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, state.level.targetOrbit.radius * view.getScale(), 0, Math.PI * 2);
  ctx.setLineDash([3, 7]);
  ctx.strokeStyle = COLORS.targetOrbit;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawShipTrace(view: CanvasView, points: ReturnType<typeof tracePreview>["points"], burning: boolean): void {
  if (points.length < 2) return;
  const { ctx } = view;
  ctx.save();
  ctx.setLineDash(burning ? [2, 6] : [2, 10]);
  ctx.strokeStyle = burning ? COLORS.shipTraceBurning : COLORS.shipTrace;
  ctx.globalAlpha = burning ? 0.9 : 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const first = view.worldToScreen(points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length; i++) {
    const p = view.worldToScreen(points[i]);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawApsisMarkers(view: CanvasView, points: Vec2[]): void {
  if (points.length === 0) return;
  let nearest = points[0];
  let farthest = points[0];
  let nearestR2 = lengthSq(nearest);
  let farthestR2 = nearestR2;
  for (const p of points) {
    const r2 = lengthSq(p);
    if (r2 < nearestR2) {
      nearestR2 = r2;
      nearest = p;
    }
    if (r2 > farthestR2) {
      farthestR2 = r2;
      farthest = p;
    }
  }
  drawMarker(view, nearest, ["Periapsis", `${Math.round(length(nearest))} u`]);
  drawMarker(view, farthest, ["Apoapsis", `${Math.round(length(farthest))} u`]);
}

function drawClosestApproach(view: CanvasView, preview: ReturnType<typeof tracePreview>, state: GameState): void {
  if (preview.points.length === 0) return;
  const result = findClosestApproach(preview, state.level.targetOrbit, state.t);
  drawMarker(view, preview.points[result.pointIndex], [
    "Closest approach",
    `gap ${result.gap.toFixed(0)} u`,
    `Δv ${result.relativeSpeed.toFixed(1)} u/s`,
  ]);
}

function drawMarker(view: CanvasView, worldPos: Vec2, lines: string[]): void {
  const { ctx } = view;
  const p = view.worldToScreen(worldPos);
  ctx.save();
  ctx.fillStyle = COLORS.marker;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "10px sans-serif";
  ctx.textBaseline = "bottom";
  lines.forEach((line, i) => {
    ctx.fillText(line, p.x + 6, p.y - 5 - (lines.length - 1 - i) * 11);
  });
  ctx.restore();
}

function drawShip(view: CanvasView, state: GameState): void {
  const { ctx } = view;
  const p = view.worldToScreen(state.ship.pos);
  ctx.save();
  ctx.fillStyle = COLORS.ship;
  ctx.beginPath();
  ctx.arc(p.x, p.y, SHIP_RENDER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  const speed = length(state.ship.vel);
  if (speed > 0) {
    const dir = { x: state.ship.vel.x / speed, y: state.ship.vel.y / speed };
    const tip = view.worldToScreen({
      x: state.ship.pos.x + dir.x * 20,
      y: state.ship.pos.y + dir.y * 20,
    });
    ctx.strokeStyle = COLORS.ship;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTarget(view: CanvasView, state: GameState): void {
  const { ctx } = view;
  const pos = targetPosition(state.level.targetOrbit, state.t);
  const p = view.worldToScreen(pos);
  ctx.save();
  ctx.strokeStyle = COLORS.target;
  ctx.lineWidth = 3;
  const r = 6;
  ctx.beginPath();
  ctx.moveTo(p.x - r, p.y - r);
  ctx.lineTo(p.x + r, p.y + r);
  ctx.moveTo(p.x + r, p.y - r);
  ctx.lineTo(p.x - r, p.y + r);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(p.x, p.y, state.level.captureRadius * view.getScale(), 0, Math.PI * 2);
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  ctx.restore();
}
