import type { RoomTemplate } from "@/data/roomTemplates";
import type { LayoutZone } from "./types";

const WALL_MARGIN = 0.15; // metres gap between item and wall
const TV_ZONE_DEPTH = 0.65; // depth allocated to the TV-console strip
const SOFA_ZONE_DEPTH = 1.1; // depth allocated to the sofa strip

/**
 * Builds the four functional zones for a rectangular living room.
 *
 * Coordinate system: y=0 is the top wall, y=length is the bottom wall.
 *
 *  ┌────────────────────────────┐  y=0
 *  │       TV / Storage         │  ← tvZone
 *  ├────────────────────────────┤
 *  │    Coffee Table (centre)   │  ← coffeeZone
 *  ├────────────────────────────┤
 *  │   Circulation / Accent     │  ← circulationZone
 *  ├────────────────────────────┤
 *  │     Sofa / Seating         │  ← sofaZone
 *  └────────────────────────────┘  y=length
 */
export function buildLivingRoomZones(template: RoomTemplate): LayoutZone[] {
  const { width, length } = template;

  const tvZone: LayoutZone = {
    id: "tv",
    label: "TV / Storage",
    x: WALL_MARGIN,
    y: WALL_MARGIN,
    width: width - 2 * WALL_MARGIN,
    length: TV_ZONE_DEPTH,
    anchorWall: "top",
  };

  const sofaY = length - SOFA_ZONE_DEPTH - WALL_MARGIN;
  const sofaZone: LayoutZone = {
    id: "sofa",
    label: "Sofa / Seating",
    x: WALL_MARGIN,
    y: sofaY,
    width: width - 2 * WALL_MARGIN,
    length: SOFA_ZONE_DEPTH,
    anchorWall: "bottom",
  };

  // Coffee table sits in the gap between TV zone and sofa, centred horizontally
  const coffeeTop = WALL_MARGIN + TV_ZONE_DEPTH + 0.5;
  const coffeeBottom = sofaY - 0.3;
  const coffeeZone: LayoutZone = {
    id: "coffee",
    label: "Coffee Table",
    x: width * 0.2,
    y: coffeeTop,
    width: width * 0.6,
    length: Math.max(0.4, coffeeBottom - coffeeTop),
    anchorWall: "center",
  };

  // Circulation / accent zone covers the full middle band
  const circulationZone: LayoutZone = {
    id: "circulation",
    label: "Circulation / Accent",
    x: WALL_MARGIN,
    y: WALL_MARGIN + TV_ZONE_DEPTH,
    width: width - 2 * WALL_MARGIN,
    length: sofaY - WALL_MARGIN - TV_ZONE_DEPTH,
    anchorWall: "center",
  };

  return [tvZone, sofaZone, coffeeZone, circulationZone];
}
