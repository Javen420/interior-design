import type { CatalogItem, LayoutZone } from "./types";

const GRID = 0.25; // snap-to-grid resolution in metres

export function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID;
}

export function clampToRoomBounds(
  x: number,
  y: number,
  itemWidth: number,
  itemDepth: number,
  roomWidth: number,
  roomLength: number,
  margin = 0.05,
): { x: number; y: number } {
  return {
    x: Math.max(margin, Math.min(roomWidth - itemWidth - margin, x)),
    y: Math.max(margin, Math.min(roomLength - itemDepth - margin, y)),
  };
}

/**
 * Returns the effective (width, depth) after applying a rotation.
 * Only 0° and 90° are used in practice.
 */
export function getRotatedDimensions(
  item: CatalogItem,
  rotation: number,
): { w: number; d: number } {
  if (rotation === 90 || rotation === 270) {
    return { w: item.depth, d: item.width };
  }
  return { w: item.width, d: item.depth };
}

/**
 * Returns the top-left position to centre an item inside a zone.
 */
export function centerInZone(
  zone: LayoutZone,
  itemWidth: number,
  itemDepth: number,
): { x: number; y: number } {
  return {
    x: zone.x + (zone.width - itemWidth) / 2,
    y: zone.y + (zone.length - itemDepth) / 2,
  };
}

/**
 * Pushes an item toward the zone's anchor wall.
 *
 * `slotOffset` shifts successive items laterally so they don't stack.
 */
export function anchorToWall(
  zone: LayoutZone,
  itemWidth: number,
  itemDepth: number,
  slotOffset = 0,
): { x: number; y: number } {
  switch (zone.anchorWall) {
    case "top":
      return { x: zone.x + slotOffset, y: zone.y };
    case "bottom":
      return { x: zone.x + slotOffset, y: zone.y + zone.length - itemDepth };
    case "left":
      return { x: zone.x, y: zone.y + slotOffset };
    case "right":
      return { x: zone.x + zone.width - itemDepth, y: zone.y + slotOffset };
    case "center":
    default:
      return centerInZone(zone, itemWidth, itemDepth);
  }
}

/**
 * Places the `slotIndex`-th item inside a zone, anchoring it to the zone's wall
 * and advancing laterally for each subsequent item.
 *
 * Clamps the result so the item never escapes the zone bounds.
 */
export function placeInZone(
  zone: LayoutZone,
  item: CatalogItem,
  slotIndex: number,
  rotation = 0,
): { x: number; y: number; rotation: number } {
  const { w, d } = getRotatedDimensions(item, rotation);
  const slotOffset = slotIndex * (w + 0.15);

  const raw = anchorToWall(zone, w, d, slotOffset);

  const x = Math.max(zone.x, Math.min(zone.x + zone.width - w, raw.x));
  const y = Math.max(zone.y, Math.min(zone.y + zone.length - d, raw.y));

  return { x, y, rotation };
}
