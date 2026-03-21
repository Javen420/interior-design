"use client";
import React from "react";
import { Rect, Line, Circle, Arc, Group, Text } from "react-konva";

// ─── Design tokens ─────────────────────────────────────────────────────────────
export const FP = {
  FLOOR_BG: "#F3EFE8",
  WALL: "#1C1C28",
  WALL_T_M: 0.15,       // external wall thickness in metres
  PARTITION: "#1C1C28", // internal partition — same hue, drawn thinner
  WALL_T_PARTITION: 0.09, // partition thickness in metres
  FURN_STROKE: "#2C2C38",
  FURN_DETAIL: "rgba(44,44,56,0.32)",
  LABEL: "rgba(0,0,0,0.5)",
  DOOR_SWING: "rgba(28,28,40,0.06)",
  GLASS_FILL: "#D4EAF5",
  GLASS_STROKE: "#7BB8D4",
  SELECT_STROKE: "#C4A265",
  SELECT_SHADOW: "rgba(196,162,101,0.45)",
} as const;

// Must match ConfiguratorContent's SCALE constant.
export const SCALE = 80;

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function classify(name: string, category: string): string {
  const n = name.toLowerCase();
  if (n.includes("sofa") || n.includes("loveseat") || n.includes("sectional"))
    return "sofa";
  if (n.includes("armchair") || n.includes("accent chair")) return "armchair";
  if (n.includes("bed") && !n.includes("cabinet")) return "bed";
  if (n.includes("wardrobe") || n.includes("locker")) return "wardrobe";
  if (
    n.includes("nightstand") ||
    n.includes("side table") ||
    n.includes("end table") ||
    (n.includes("cube") && !n.includes("coffee"))
  )
    return "side-table";
  if (
    n.includes("coffee") ||
    n.includes("wabi low") ||
    n.includes("boomerang") ||
    n.includes("nero marble") ||
    n.includes("round table") ||
    n.includes("simple round")
  )
    return "coffee-table";
  if (
    n.includes("dining table") ||
    n.includes("family oak") ||
    n.includes("marble dining") ||
    n.includes("industrial dining")
  )
    return "dining-table";
  if (
    n.includes("dining chair") ||
    n.includes("wishbone") ||
    n.includes("tolix") ||
    (n.includes("velvet") && n.includes("chair"))
  )
    return "dining-chair";
  if (n.includes("desk") || n.includes("bench desk")) return "desk";
  if (
    n.includes("shelf") ||
    n.includes("shelves") ||
    n.includes("bookshelf") ||
    n.includes("string shelf") ||
    n.includes("rack")
  )
    return "shelf";
  if (
    n.includes("tv") ||
    n.includes("console") ||
    n.includes("credenza") ||
    n.includes("media") ||
    n.includes("entertainment")
  )
    return "tv-console";
  if (
    n.includes("cabinet") ||
    n.includes("pantry") ||
    n.includes("buffet") ||
    n.includes("sideboard") ||
    n.includes("display cabinet")
  )
    return "cabinet";
  if (
    n.includes("lamp") ||
    n.includes("pendant") ||
    n.includes("chandelier") ||
    n.includes("lantern") ||
    n.includes("floor lamp") ||
    n.includes("table lamp") ||
    n.includes("light")
  )
    return "lamp";
  if (n.includes("rug") || n.includes(" mat")) return "rug";
  if (
    n.includes("plant") ||
    n.includes("planter") ||
    n.includes("fig") ||
    n.includes("snake plant")
  )
    return "plant";
  if (n.includes("art") || n.includes("print") || n.includes("canvas print"))
    return "art";
  if (n.includes("cushion") || n.includes("throw")) return "cushion";
  return category.toLowerCase();
}

// ─── Category interior detail renderer ────────────────────────────────────────
function Interior({
  type,
  W,
  D,
  z,
}: {
  type: string;
  W: number;
  D: number;
  z: number;
}): React.ReactElement | null {
  const dc = FP.FURN_DETAIL;
  const dw = Math.max(0.5, 0.7 * z);

  switch (type) {
    case "sofa": {
      const rail = D * 0.24;
      return (
        <>
          <Rect
            x={0}
            y={0}
            width={W}
            height={rail}
            fill={dc}
            cornerRadius={2}
          />
          {W > 70 * z && (
            <Line
              points={[W / 2, rail, W / 2, D * 0.95]}
              stroke={dc}
              strokeWidth={dw}
            />
          )}
        </>
      );
    }

    case "armchair": {
      const rail = D * 0.28;
      const arm = W * 0.16;
      return (
        <>
          <Rect
            x={0}
            y={0}
            width={W}
            height={rail}
            fill={dc}
            cornerRadius={2}
          />
          <Rect x={0} y={0} width={arm} height={D} fill={dc} cornerRadius={2} />
          <Rect
            x={W - arm}
            y={0}
            width={arm}
            height={D}
            fill={dc}
            cornerRadius={2}
          />
        </>
      );
    }

    case "bed": {
      const headH = D * 0.22;
      const pilW = W * 0.28;
      const pilH = D * 0.14;
      const pilY = headH + D * 0.06;
      return (
        <>
          <Rect
            x={0}
            y={0}
            width={W}
            height={headH}
            fill={dc}
            cornerRadius={2}
          />
          <Rect
            x={W * 0.1}
            y={pilY}
            width={pilW}
            height={pilH}
            fill="rgba(255,255,255,0.25)"
            stroke={dc}
            strokeWidth={dw}
            cornerRadius={2}
          />
          <Rect
            x={W - W * 0.1 - pilW}
            y={pilY}
            width={pilW}
            height={pilH}
            fill="rgba(255,255,255,0.25)"
            stroke={dc}
            strokeWidth={dw}
            cornerRadius={2}
          />
        </>
      );
    }

    case "wardrobe": {
      return (
        <>
          <Line points={[0, 0, W, D]} stroke={dc} strokeWidth={dw} />
          <Line points={[W, 0, 0, D]} stroke={dc} strokeWidth={dw} />
          <Line
            points={[W / 2, 0, W / 2, D]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "shelf": {
      const n = Math.max(2, Math.min(5, Math.floor(D / (14 * z))));
      const step = D / (n + 1);
      return (
        <>
          {Array.from({ length: n }, (_, i) => (
            <Line
              key={i}
              points={[2 * z, (i + 1) * step, W - 2 * z, (i + 1) * step]}
              stroke={dc}
              strokeWidth={dw}
            />
          ))}
        </>
      );
    }

    case "tv-console": {
      return (
        <>
          <Line
            points={[6 * z, D * 0.33, W - 6 * z, D * 0.33]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[6 * z, D * 0.67, W - 6 * z, D * 0.67]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "cabinet": {
      return (
        <>
          <Line
            points={[W / 2, 2 * z, W / 2, D - 2 * z]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[2 * z, D / 2, W - 2 * z, D / 2]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "coffee-table": {
      const aspect = W / D;
      if (aspect > 0.7 && aspect < 1.4) {
        const r = Math.min(W, D) / 2 - 4 * z;
        return (
          <Circle
            x={W / 2}
            y={D / 2}
            radius={Math.max(1, r)}
            stroke={dc}
            strokeWidth={dw}
          />
        );
      }
      return (
        <>
          <Line points={[0, 0, W, D]} stroke={dc} strokeWidth={dw} />
          <Line points={[W, 0, 0, D]} stroke={dc} strokeWidth={dw} />
        </>
      );
    }

    case "side-table": {
      const r = Math.min(W, D) / 2 - 3 * z;
      return (
        <Circle
          x={W / 2}
          y={D / 2}
          radius={Math.max(1, r)}
          stroke={dc}
          strokeWidth={dw}
        />
      );
    }

    case "dining-table": {
      return (
        <>
          <Line
            points={[W / 2, 2 * z, W / 2, D - 2 * z]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[2 * z, D / 2, W - 2 * z, D / 2]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "dining-chair": {
      const r = Math.min(W, D) * 0.32;
      return <Circle x={W / 2} y={D / 2} radius={r} fill={dc} />;
    }

    case "desk": {
      return (
        <>
          <Rect x={0} y={0} width={W} height={D * 0.18} fill={dc} />
          <Line
            points={[W / 2, D * 0.18, W / 2, D - 2 * z]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "lamp": {
      const cx = W / 2,
        cy = D / 2;
      const r = Math.min(W, D) * 0.3;
      return (
        <>
          <Circle x={cx} y={cy} radius={r} stroke={dc} strokeWidth={dw} />
          <Line
            points={[cx, cy - r * 1.5, cx, cy + r * 1.5]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[cx - r * 1.5, cy, cx + r * 1.5, cy]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "plant": {
      const cx = W / 2,
        cy = D / 2;
      const r = Math.min(W, D) * 0.38;
      return (
        <>
          <Circle x={cx} y={cy} radius={r} fill={dc} opacity={0.28} />
          <Line
            points={[
              cx - r * 0.7,
              cy - r * 0.7,
              cx + r * 0.7,
              cy + r * 0.7,
            ]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[
              cx + r * 0.7,
              cy - r * 0.7,
              cx - r * 0.7,
              cy + r * 0.7,
            ]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[cx, cy - r, cx, cy + r]}
            stroke={dc}
            strokeWidth={dw}
          />
          <Line
            points={[cx - r, cy, cx + r, cy]}
            stroke={dc}
            strokeWidth={dw}
          />
        </>
      );
    }

    case "rug": {
      const p = 4 * z;
      return (
        <Rect
          x={p}
          y={p}
          width={W - 2 * p}
          height={D - 2 * p}
          stroke={dc}
          strokeWidth={dw}
          dash={[4 * z, 3 * z]}
        />
      );
    }

    case "art": {
      return (
        <>
          <Line points={[0, 0, W, D]} stroke={dc} strokeWidth={dw} />
          <Line points={[W, 0, 0, D]} stroke={dc} strokeWidth={dw} />
        </>
      );
    }

    default:
      return null;
  }
}

// ─── FurnitureSymbol ──────────────────────────────────────────────────────────
export interface FurnitureSymbolProps {
  name: string;
  category: string;
  color: string;
  pxW: number;
  pxD: number;
  isSelected: boolean;
  showLabel: boolean;
  zoom: number;
}

export function FurnitureSymbol({
  name,
  category,
  color,
  pxW,
  pxD,
  isSelected,
  showLabel,
  zoom,
}: FurnitureSymbolProps): React.ReactElement {
  const type = classify(name, category);
  const isCircular =
    type === "lamp" || type === "plant" || type === "dining-chair";
  const strokeColor = isSelected ? FP.SELECT_STROKE : FP.FURN_STROKE;
  const strokeW = Math.max(0.8, (isSelected ? 1.5 : 1) * zoom);

  return (
    <>
      <Rect
        width={pxW}
        height={pxD}
        fill={hexToRgba(color, 0.5)}
        stroke={strokeColor}
        strokeWidth={strokeW}
        cornerRadius={isCircular ? Math.min(pxW, pxD) / 2 : 2}
        shadowColor={isSelected ? FP.SELECT_SHADOW : undefined}
        shadowBlur={isSelected ? 14 : 0}
      />
      <Interior type={type} W={pxW} D={pxD} z={zoom} />
      {showLabel && pxW > 20 * zoom && pxD > 12 * zoom && (
        <Text
          text={name.toUpperCase()}
          x={2 * zoom}
          y={pxD / 2 - Math.max(3, 4.5 * zoom)}
          width={pxW - 4 * zoom}
          fontSize={Math.max(5, 6.5 * zoom)}
          fill={FP.LABEL}
          align="center"
          fontStyle="bold"
          ellipsis
          wrap="none"
          listening={false}
        />
      )}
    </>
  );
}

// ─── ArchDoor ─────────────────────────────────────────────────────────────────
export interface ArchDoorDef {
  x: number;
  y: number;
  width: number;
  side?: string;
  orientation?: "horizontal" | "vertical";
}

interface ArchDoorProps {
  door: ArchDoorDef;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
}

export function ArchDoor({
  door,
  canvasWidth,
  canvasHeight,
  zoom,
}: ArchDoorProps): React.ReactElement {
  const WALL_T = FP.WALL_T_M * SCALE * zoom;
  const sw = door.width * SCALE * zoom;
  const side =
    door.side ?? (door.orientation === "vertical" ? "left" : "top");
  const cx = door.x * SCALE * zoom;
  const cy = door.y * SCALE * zoom;

  let hingeX = 0,
    hingeY = 0;
  let leafEndX = 0,
    leafEndY = 0;
  let arcRotation = 0;
  let gapX = 0,
    gapY = 0,
    gapW = 0,
    gapH = 0;

  switch (side) {
    case "top":
      hingeX = cx - sw / 2;
      hingeY = WALL_T / 2;
      leafEndX = hingeX;
      leafEndY = hingeY + sw;
      arcRotation = 0; // East → South (CW into room)
      gapX = cx - sw / 2;
      gapY = -WALL_T / 2;
      gapW = sw;
      gapH = WALL_T;
      break;
    case "bottom":
      hingeX = cx + sw / 2;
      hingeY = canvasHeight - WALL_T / 2;
      leafEndX = hingeX;
      leafEndY = hingeY - sw;
      arcRotation = 180; // West → North (CW into room)
      gapX = cx - sw / 2;
      gapY = canvasHeight - WALL_T / 2;
      gapW = sw;
      gapH = WALL_T;
      break;
    case "left":
      hingeX = WALL_T / 2;
      hingeY = cy + sw / 2;
      leafEndX = hingeX + sw;
      leafEndY = hingeY;
      arcRotation = 270; // North → East (CW into room)
      gapX = -WALL_T / 2;
      gapY = cy - sw / 2;
      gapW = WALL_T;
      gapH = sw;
      break;
    case "right":
      hingeX = canvasWidth - WALL_T / 2;
      hingeY = cy - sw / 2;
      leafEndX = hingeX - sw;
      leafEndY = hingeY;
      arcRotation = 90; // South → West (CW into room)
      gapX = canvasWidth - WALL_T / 2;
      gapY = cy - sw / 2;
      gapW = WALL_T;
      gapH = sw;
      break;
    default:
      hingeX = cx - sw / 2;
      hingeY = WALL_T / 2;
      leafEndX = hingeX;
      leafEndY = hingeY + sw;
      arcRotation = 0;
      gapX = cx - sw / 2;
      gapY = -WALL_T / 2;
      gapW = sw;
      gapH = WALL_T;
  }

  const lw = Math.max(0.8, zoom);

  return (
    <Group listening={false}>
      {/* Erase wall at door opening */}
      <Rect x={gapX} y={gapY} width={gapW} height={gapH} fill={FP.FLOOR_BG} />
      {/* Swing area fill */}
      <Arc
        x={hingeX}
        y={hingeY}
        innerRadius={0}
        outerRadius={sw}
        rotation={arcRotation}
        angle={90}
        fill={FP.DOOR_SWING}
        strokeEnabled={false}
      />
      {/* Swing arc hairline */}
      <Arc
        x={hingeX}
        y={hingeY}
        innerRadius={sw - lw * 1.2}
        outerRadius={sw}
        rotation={arcRotation}
        angle={90}
        fill={FP.WALL}
        strokeEnabled={false}
        opacity={0.35}
      />
      {/* Door leaf at 90° open position */}
      <Line
        points={[hingeX, hingeY, leafEndX, leafEndY]}
        stroke={FP.WALL}
        strokeWidth={lw * 1.3}
        opacity={0.7}
      />
      {/* Jamb lines — thin perpendicular lines at each side of the gap */}
      {side === "top" && (
        <>
          <Line
            points={[gapX, 0, gapX, WALL_T]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
          <Line
            points={[gapX + gapW, 0, gapX + gapW, WALL_T]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
        </>
      )}
      {side === "bottom" && (
        <>
          <Line
            points={[gapX, canvasHeight - WALL_T / 2, gapX, canvasHeight + WALL_T / 2]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
          <Line
            points={[gapX + gapW, canvasHeight - WALL_T / 2, gapX + gapW, canvasHeight + WALL_T / 2]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
        </>
      )}
      {side === "left" && (
        <>
          <Line
            points={[0, gapY, WALL_T, gapY]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
          <Line
            points={[0, gapY + gapH, WALL_T, gapY + gapH]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
        </>
      )}
      {side === "right" && (
        <>
          <Line
            points={[canvasWidth - WALL_T, gapY, canvasWidth + WALL_T / 2, gapY]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
          <Line
            points={[canvasWidth - WALL_T, gapY + gapH, canvasWidth + WALL_T / 2, gapY + gapH]}
            stroke={FP.WALL}
            strokeWidth={lw}
            opacity={0.55}
          />
        </>
      )}
    </Group>
  );
}

// ─── ArchWindow ───────────────────────────────────────────────────────────────
export interface ArchWindowDef {
  x: number;
  y: number;
  width: number;
  side: string;
}

interface ArchWindowProps {
  window: ArchWindowDef;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
}

export function ArchWindow({
  window: w,
  canvasWidth,
  canvasHeight,
  zoom,
}: ArchWindowProps): React.ReactElement {
  const WALL_T = FP.WALL_T_M * SCALE * zoom;
  const wl = w.width * SCALE * zoom;
  const wx = w.x * SCALE * zoom;
  const wy = w.y * SCALE * zoom;

  let gapX = 0,
    gapY = 0,
    gapW = 0,
    gapH = 0;
  let midPts: number[] = [];
  const pad = 2;

  switch (w.side) {
    case "top":
      gapX = wx;
      gapY = -WALL_T / 2;
      gapW = wl;
      gapH = WALL_T;
      midPts = [wx + pad, WALL_T / 2, wx + wl - pad, WALL_T / 2];
      break;
    case "bottom":
      gapX = wx;
      gapY = canvasHeight - WALL_T / 2;
      gapW = wl;
      gapH = WALL_T;
      midPts = [
        wx + pad,
        canvasHeight - WALL_T / 2,
        wx + wl - pad,
        canvasHeight - WALL_T / 2,
      ];
      break;
    case "left":
      gapX = -WALL_T / 2;
      gapY = wy;
      gapW = WALL_T;
      gapH = wl;
      midPts = [WALL_T / 2, wy + pad, WALL_T / 2, wy + wl - pad];
      break;
    case "right":
    default:
      gapX = canvasWidth - WALL_T / 2;
      gapY = wy;
      gapW = WALL_T;
      gapH = wl;
      midPts = [canvasWidth, wy + pad, canvasWidth, wy + wl - pad];
      break;
  }

  const lw = Math.max(0.7, zoom * 0.85);

  return (
    <Group listening={false}>
      {/* Glass fill — replaces the wall section */}
      <Rect x={gapX} y={gapY} width={gapW} height={gapH} fill={FP.GLASS_FILL} />
      {/* Window frame outline */}
      <Rect
        x={gapX}
        y={gapY}
        width={gapW}
        height={gapH}
        fill="transparent"
        stroke={FP.GLASS_STROKE}
        strokeWidth={lw}
      />
      {/* Centre glazing line */}
      <Line
        points={midPts}
        stroke={FP.GLASS_STROKE}
        strokeWidth={lw * 1.3}
        opacity={0.8}
      />
    </Group>
  );
}
