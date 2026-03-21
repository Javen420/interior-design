// ── Input ────────────────────────────────────────────────────────────────────

export interface GenerateDesignInput {
  flatType: string;
  roomType: string;
  styles: string[];
  colorTone: string;
  priorities: string[];
  budgetMin: number;
  budgetMax: number;
  inspirationStyle: string | null;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  width: number;
  depth: number;
  color: string;
  styles: string[];
  colorTones: string[];
}

// ── Layout zones ─────────────────────────────────────────────────────────────

export type AnchorWall = "top" | "bottom" | "left" | "right" | "center";

export interface LayoutZone {
  /** Stable identifier used by the planner to look up a specific zone */
  id: string;
  label: string;
  /** Top-left corner of the zone in room coordinates (metres) */
  x: number;
  y: number;
  width: number;
  length: number;
  /** Which wall new items should be pushed toward when placed in this zone */
  anchorWall: AnchorWall;
}

// ── Placed items ──────────────────────────────────────────────────────────────

/** Shape that the frontend store (FurnitureItem) and API consumers expect. */
export interface PlacedItem {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  price: number;
  width: number;
  depth: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
}

// ── Room spaces (floor zones) ─────────────────────────────────────────────────

/**
 * A named rectangular zone inside the apartment.
 * Rendered as a floor-texture fill with an optional label.
 * `floor` controls the texture: wood grain lines vs tile grid.
 */
export interface RoomSpace {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  length: number;
  floor: "wood" | "tile" | "carpet";
}

// ── Room shape ────────────────────────────────────────────────────────────────

export interface RoomShape {
  width: number;
  length: number;
  walls: { x1: number; y1: number; x2: number; y2: number }[];
  /**
   * `type` distinguishes exterior doors (rendered with full swing arc) from
   * interior partition doors (rendered as wall gaps only — swing arcs deferred).
   */
  doors: { x: number; y: number; width: number; side: string; type?: "external" | "internal" }[];
  windows: { x: number; y: number; width: number; side: string }[];
  /** Optional room/zone fills. Rendered if present; absent for single-room views. */
  spaces?: RoomSpace[];
}

// ── Final response ────────────────────────────────────────────────────────────

export interface GeneratedDesignResult {
  room: RoomShape;
  items: PlacedItem[];
  totalCost: number;
  averageCost: number;
  styleApplied: string;
  colorPalette: string[];
}
