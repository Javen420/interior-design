import type { RoomSpace } from "@/lib/layoutGenerator/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type WallDef = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Omit or "external" for outer walls; "internal" for partition segments. */
  type?: "external" | "internal";
};
type DoorDef = { x: number; y: number; width: number; side: string; type?: "external" | "internal" };
type WindowDef = { x: number; y: number; width: number; side: string };

export interface RoomTemplate {
  id: string;
  name: string;
  flatType: string;
  roomType: string;
  /** Full canvas dimensions (metres). For apartment templates this is the whole flat. */
  width: number;
  length: number;
  sqm: number;
  averageCost: number;
  walls: WallDef[];
  doors: DoorDef[];
  windows: WindowDef[];
  /** Zone fills rendered on the canvas (optional for single-room views). */
  spaces?: RoomSpace[];
  /**
   * For apartment templates: the bounds of the living room zone inside the full canvas.
   * The furniture planner uses these instead of the full width/length so that
   * sofas and TV consoles land in the right room.
   */
  livingRoom?: { x: number; y: number; width: number; length: number };
}

// ── Single-room living room templates ────────────────────────────────────────
//
// Door placement convention: bottom wall, right-of-centre.
// The sofa is positioned on the left/centre side, keeping the door swing clear.

export const livingRoomTemplates: RoomTemplate[] = [
  {
    id: "4room-living",
    name: "4-Room BTO Living Room",
    flatType: "4room-bto",
    roomType: "living-room",
    width: 7.0,
    length: 4.0,
    sqm: 28,
    averageCost: 15000,
    walls: [
      { x1: 0, y1: 0, x2: 7, y2: 0 },
      { x1: 7, y1: 0, x2: 7, y2: 4 },
      { x1: 7, y1: 4, x2: 0, y2: 4 },
      { x1: 0, y1: 4, x2: 0, y2: 0 },
    ],
    // Door on right side: opening x = 5.15–6.05, hinge at x = 6.05
    doors: [{ x: 5.6, y: 4, width: 0.9, side: "bottom" }],
    windows: [{ x: 7, y: 1.5, width: 1.5, side: "right" }],
  },
  {
    id: "5room-living",
    name: "5-Room BTO Living Room",
    flatType: "5room-bto",
    roomType: "living-room",
    width: 8.0,
    length: 4.5,
    sqm: 36,
    averageCost: 20000,
    walls: [
      { x1: 0, y1: 0, x2: 8, y2: 0 },
      { x1: 8, y1: 0, x2: 8, y2: 4.5 },
      { x1: 8, y1: 4.5, x2: 0, y2: 4.5 },
      { x1: 0, y1: 4.5, x2: 0, y2: 0 },
    ],
    // Door on right side: opening x = 6.05–6.95, hinge at x = 6.95
    doors: [{ x: 6.5, y: 4.5, width: 0.9, side: "bottom" }],
    windows: [{ x: 8, y: 1.5, width: 1.8, side: "right" }],
  },
  {
    id: "resale-living",
    name: "Resale HDB Living Room",
    flatType: "resale-hdb",
    roomType: "living-room",
    width: 6.5,
    length: 4.2,
    sqm: 27.3,
    averageCost: 18000,
    walls: [
      { x1: 0, y1: 0, x2: 6.5, y2: 0 },
      { x1: 6.5, y1: 0, x2: 6.5, y2: 4.2 },
      { x1: 6.5, y1: 4.2, x2: 0, y2: 4.2 },
      { x1: 0, y1: 4.2, x2: 0, y2: 0 },
    ],
    // Door on right side: opening x = 4.75–5.65, hinge at x = 5.65
    doors: [{ x: 5.2, y: 4.2, width: 0.9, side: "bottom" }],
    windows: [{ x: 6.5, y: 1.5, width: 1.5, side: "right" }],
  },
];

// ── HDB 3-Room BTO Full Apartment Template ────────────────────────────────────
//
// Overall footprint: 9 m wide × 6 m deep = 54 sqm
//
// Room layout:
//
//  x: 0      3     5.5          9
//     ┌───────┬──────┬───────────┐  y=0  (street facade — windows)
//     │       │      │           │
//     │  LR   │      │  Bedroom1 │
//     │ +Dining│      │ (3.5×3.5) │
//     │(5.5×3.5)     │           │
//     │      [D]     │           │  y≈2.5  LR → BR1 door
//     │       │      │           │
//     ──────[D]──────────────────  y=3.5  horizontal partition
//     │       │      │           │
//     │Kitchen│ Hall │  Bedroom2 │
//     │(3×2.5)│(2.5×2.5)(3.5×2.5)│
//    [D]     [D]    [D]           │  y≈4.75  doors: KT↔Hall, Hall↔BR2
//     │       │      │           │
//     ──────[main door]───────────  y=6  (corridor side)
//
// Internal walls are expressed as wall segments with gaps at door openings.
// Interior doors are flagged type:"internal" — rendered as openings only (no
// swing arc), since ArchDoor assumes outer-wall positions.

export const hdb3roomBTOTemplate: RoomTemplate = {
  id: "3room-bto-apartment",
  name: "3-Room BTO Apartment",
  flatType: "3room-bto",
  roomType: "living-room",
  width: 9.0,
  length: 6.0,
  sqm: 54,
  averageCost: 30000,

  // ── Room zones ──────────────────────────────────────────────────────────
  spaces: [
    { id: "living",   label: "Living / Dining", x: 0,   y: 0,   width: 5.5, length: 3.5, floor: "wood"  },
    { id: "master",   label: "Master Bedroom",    x: 5.5, y: 0,   width: 3.5, length: 3.5, floor: "wood"  },
    { id: "kitchen",  label: "Kitchen",          x: 0,   y: 3.5, width: 3,   length: 2.5, floor: "tile"  },
    { id: "hall",     label: "Entry Hall",       x: 3,   y: 3.5, width: 2.5, length: 2.5, floor: "tile"  },
    { id: "bed2",     label: "Bedroom 2",          x: 5.5, y: 3.5, width: 3.5, length: 2.5, floor: "wood"  },
  ],

  // ── Bounds used by the living-room furniture planner ────────────────────
  livingRoom: { x: 0, y: 0, width: 5.5, length: 3.5 },

  // ── Walls ────────────────────────────────────────────────────────────────
  // Outer walls: the bottom wall is broken for the main entrance door
  // (opening x = 3.8–4.7, centre x = 4.25, hinge at x = 4.7).
  // All other outer walls are solid — ArchWindow overlays handle windows visually.
  //
  // Internal walls are split into segments wherever doors occur.
  //
  // Wall A (vertical, x = 5.5):  separates LR from BR1 (top), Hall from BR2 (bottom)
  //   Door LR→BR1:  centre y = 2.5,  gap y = 2.05–2.95
  //   Door Hall→BR2: centre y = 4.75, gap y = 4.3–5.2
  //
  // Wall B-left (horizontal, y = 3.5, x = 0–5.5): LR below, Kitchen+Hall above
  //   Door LR→Hall: centre x = 3.75, gap x = 3.3–4.2
  //
  // Wall B-right (horizontal, y = 3.5, x = 5.5–9): BR1 above, BR2 below  — solid
  //
  // Wall C (vertical, x = 3, y = 3.5–6): separates Kitchen from Hall
  //   Door KT→Hall:  centre y = 4.75, gap y = 4.3–5.2
  walls: [
    // Outer walls
    { x1: 0,   y1: 0, x2: 9,   y2: 0   },  // top (street facade)
    { x1: 9,   y1: 0, x2: 9,   y2: 6   },  // right
    { x1: 0,   y1: 6, x2: 3.8, y2: 6   },  // bottom-left  (before main door)
    { x1: 4.7, y1: 6, x2: 9,   y2: 6   },  // bottom-right (after main door)
    { x1: 0,   y1: 0, x2: 0,   y2: 6   },  // left

    // Wall A — vertical at x = 5.5 (three segments separated by two door gaps)
    { x1: 5.5, y1: 0,   x2: 5.5, y2: 2.05, type: "internal" },  // above LR→BR1 door
    { x1: 5.5, y1: 2.95, x2: 5.5, y2: 4.3,  type: "internal" },  // between LR→BR1 and Hall→BR2 doors
    { x1: 5.5, y1: 5.2,  x2: 5.5, y2: 6,    type: "internal" },  // below Hall→BR2 door

    // Wall B-left — horizontal at y = 3.5 (two segments with LR→Hall gap)
    { x1: 0,   y1: 3.5, x2: 3.3, y2: 3.5, type: "internal" },  // left of LR→Hall door
    { x1: 4.2, y1: 3.5, x2: 5.5, y2: 3.5, type: "internal" },  // right of LR→Hall door

    // Wall B-right — horizontal at y = 3.5 (solid, no door between BR1 and BR2)
    { x1: 5.5, y1: 3.5, x2: 9,   y2: 3.5, type: "internal" },

    // Wall C — vertical at x = 3 (two segments with KT→Hall gap)
    { x1: 3, y1: 3.5, x2: 3, y2: 4.3, type: "internal" },  // above KT→Hall door
    { x1: 3, y1: 5.2, x2: 3, y2: 6,   type: "internal" },  // below KT→Hall door
  ],

  // ── Doors ────────────────────────────────────────────────────────────────
  // External: rendered with full ArchDoor swing arc (existing system).
  // Internal: wall gap only for Phase 1; swing arcs added in a later phase.
  doors: [
    // External — main entrance (corridor side, entering the Hall)
    { x: 4.25, y: 6,   width: 0.9, side: "bottom" },

    // Internal — LR → Bedroom 1 (in Wall A, upper section)
    { x: 5.5,  y: 2.5,  width: 0.9, side: "right",  type: "internal" },
    // Internal — LR → Hall (in Wall B-left)
    { x: 3.75, y: 3.5,  width: 0.9, side: "bottom", type: "internal" },
    // Internal — Hall → Bedroom 2 (in Wall A, lower section)
    { x: 5.5,  y: 4.75, width: 0.9, side: "right",  type: "internal" },
    // Internal — Kitchen → Hall (in Wall C)
    { x: 3,    y: 4.75, width: 0.9, side: "right",  type: "internal" },
  ],

  // ── Windows ──────────────────────────────────────────────────────────────
  windows: [
    // Living room — large bay window and smaller dining window (top wall)
    { x: 1.0, y: 0, width: 2.0, side: "top"   },
    { x: 3.5, y: 0, width: 0.8, side: "top"   },
    // Bedroom 1 — window on top wall
    { x: 6.5, y: 0, width: 1.8, side: "top"   },
    // Bedroom 2 — window on right wall
    { x: 9,   y: 4.0, width: 1.0, side: "right" },
    // Kitchen — window on left wall (air-well / service yard side)
    { x: 0,   y: 4.5, width: 0.8, side: "left"  },
  ],
};
