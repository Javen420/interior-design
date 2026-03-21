import type { CatalogItem, GenerateDesignInput, PlacedItem } from "./types";
import type { RoomTemplate } from "@/data/roomTemplates";
import { pickByCategory } from "./catalogFilter";
import { snapToGrid, clampToRoomBounds } from "./placement";

const sg = snapToGrid;

function nameHas(name: string, ...words: string[]): boolean {
  const lower = name.toLowerCase();
  return words.some((w) => lower.includes(w));
}

function toPlaced(
  item: CatalogItem,
  pos: { x: number; y: number; rotation: number },
  idx: number,
  roomWidth: number,
  roomLength: number,
): PlacedItem {
  const clamped = clampToRoomBounds(
    pos.x,
    pos.y,
    item.width,
    item.depth,
    roomWidth,
    roomLength,
  );
  return {
    id: `item-${idx}`,
    catalogId: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    width: item.width,
    depth: item.depth,
    x: sg(clamped.x),
    y: sg(clamped.y),
    rotation: pos.rotation,
    color: item.color,
  };
}

/**
 * Deterministic living-room layout planner.
 *
 * For apartment templates, placement is scoped to `template.livingRoom` sub-bounds
 * so furniture lands in the correct room. For single-room templates the full
 * canvas is used (same as before).
 *
 * Layout (all coordinates are absolute canvas metres):
 *
 *  ┌────────────────────────────────────────────────────────┐  baseY
 *  │  shelf   [TV console — centred]    plant/lamp          │  top wall of LR
 *  │                                                        │
 *  │           [rug spanning seating group]                 │
 *  │                [coffee table — centred]                │
 *  │                                                        │
 *  │  lamp  [sofa — door-free half] side-table             │  bottom wall of LR
 *  └────────────────────────────────────────────────────────┘  baseY + roomL
 */
export function planLivingRoom(
  template: RoomTemplate,
  full: CatalogItem[],
  filtered: CatalogItem[],
  input: GenerateDesignInput,
): PlacedItem[] {
  const budgetFriendly = input.priorities.includes("budget-friendly");

  // For apartment templates, scope placement to the living room sub-bounds.
  // For single-room templates, use the full canvas.
  const lr = template.livingRoom;
  const baseX = lr?.x ?? 0;
  const baseY = lr?.y ?? 0;
  const roomW = lr?.width  ?? template.width;
  const roomL = lr?.length ?? template.length;

  // Only respect door clearance if the door is physically inside the LR zone.
  // For apartment templates the main door is in the Hall, not the LR, so it
  // must not constrain sofa placement in the living room.
  const door = template.doors.find(
    (d) =>
      d.side === "bottom" &&
      d.type !== "internal" &&
      d.y >= baseY &&
      d.y <= baseY + roomL,
  ) as { x: number; y: number; width: number; side: string } | undefined;

  // First window adjacent to the living room (top wall preferred, right wall fallback)
  const win = template.windows.find((w) => {
    if (w.side === "top")   return w.x >= baseX && w.x <= baseX + roomW;
    if (w.side === "right") return w.y >= baseY && w.y <= baseY + roomL;
    return false;
  }) as { x: number; y: number; width: number; side: string } | undefined;

  const pick = (
    cat: string,
    count: number,
    pred?: (n: string) => boolean,
  ): CatalogItem[] =>
    pickByCategory(filtered, full, cat, count, budgetFriendly, pred);

  const placed: PlacedItem[] = [];
  let idx = 0;

  function place(item: CatalogItem, absX: number, absY: number, rotation = 0) {
    placed.push(toPlaced(item, { x: absX, y: absY, rotation }, idx++, template.width, template.length));
  }

  // ─── Door-clearance boundary ─────────────────────────────────────────────
  // For a bottom-wall door inside the LR, keep seating left of the gap + 400 mm.
  // Right boundary in ABSOLUTE x (includes baseX).
  let seatingMaxX = baseX + roomW - 0.15;
  if (door && door.side === "bottom") {
    const doorLeftEdge = door.x - door.width / 2;
    seatingMaxX = doorLeftEdge - 0.4;
  }

  // ─── 1. TV console ── centred on top wall, flush ─────────────────────────
  const [tvCon] = pick(
    "Storage",
    1,
    (n) =>
      nameHas(n, "tv", "media", "console", "entertainment", "credenza", "retro", "unit", "onyx") &&
      !nameHas(n, "shelf", "rack", "bookcase"),
  );

  let tvConAbsX = baseX + sg((roomW - 1.6) / 2);
  let tvConEndX = tvConAbsX + 1.6;

  if (tvCon) {
    tvConAbsX = baseX + sg((roomW - tvCon.width) / 2);
    tvConEndX = tvConAbsX + tvCon.width;
    place(tvCon, tvConAbsX, baseY);
  }

  // ─── 2. Bookshelf ── right of TV console, against top wall ───────────────
  const [shelf] = pick(
    "Storage",
    1,
    (n) =>
      nameHas(n, "shelf", "rack", "bookcase", "shelves", "bookshelf", "step shelf") &&
      !nameHas(n, "tv", "media", "console", "entertainment"),
  );

  if (shelf) {
    const shelfAbsX = sg(tvConEndX + 0.15);
    if (shelfAbsX + shelf.width <= baseX + roomW - 0.15) {
      place(shelf, shelfAbsX, baseY);
    } else {
      const leftX = sg(tvConAbsX - shelf.width - 0.15);
      if (leftX >= baseX + 0.15) place(shelf, leftX, baseY);
    }
  }

  // ─── 3. Sofa ── back flush against LR bottom wall, left of door ──────────
  const [sofa] = pick(
    "Seating",
    1,
    (n) => nameHas(n, "sofa", "couch", "sectional", "seater"),
  );

  let sofaX = baseX + 0.15;
  let sofaY = baseY + sg(roomL - (sofa?.depth ?? 0.9) - 0.05);
  const sofaW = sofa?.width ?? 2.1;
  const sofaD = sofa?.depth ?? 0.9;

  if (sofa) {
    const availW = seatingMaxX - (baseX + 0.15);
    sofaX = baseX + sg(0.15 + Math.max(0, (availW - sofa.width) / 2));
    sofaX = Math.min(sofaX, sg(seatingMaxX - sofa.width));
    sofaY = baseY + sg(roomL - sofa.depth - 0.05);
    place(sofa, sofaX, sofaY);
  }

  // ─── 4. Coffee table ── centred with sofa, 450 mm in front ───────────────
  const [coffee] = pick("Tables", 1, (n) =>
    nameHas(n, "coffee", "wabi", "boomerang", "nero", "round", "simple round", "norra", "slate", "mill cart"),
  );

  let coffeeX = sofaX;
  let coffeeY = sofaY - sg((coffee?.depth ?? 0.6) + 0.45);

  if (coffee) {
    coffeeX = sg(sofaX + (sofaW - coffee.width) / 2);
    coffeeY = sg(sofaY - coffee.depth - 0.45);
    place(coffee, coffeeX, coffeeY);
  }

  // ─── 5. Rug ── spans the whole seating group ─────────────────────────────
  const [rug] = pick("Decor", 1, (n) => nameHas(n, "rug", "carpet", "mat"));

  if (rug) {
    const rugX = sg(sofaX + (sofaW - rug.width) / 2);
    const rugY = sg(sofaY + 0.25 - rug.depth);
    place(rug, rugX, rugY);
  }

  // ─── 6. Side table ── right end of sofa, clear of door swing ────────────
  const [sideTable] = pick("Bedroom", 1, (n) =>
    nameHas(n, "nightstand", "side table", "cube side", "accent table", "round night", "cube"),
  );

  if (sideTable) {
    const stX = sg(sofaX + sofaW + 0.05);
    const stY = sg(sofaY + (sofaD - sideTable.depth) / 2);
    if (stX + sideTable.width <= seatingMaxX && stX + sideTable.width <= baseX + roomW - 0.15) {
      place(sideTable, stX, stY);
    }
  }

  // ─── 7. Floor lamp ── left of sofa corner ────────────────────────────────
  const lamps = pick("Lighting", 2);
  if (lamps[0]) {
    const lW = lamps[0].width;
    const lampX = sg(sofaX - lW - 0.1);
    const lampY = sg(sofaY + sofaD / 2 - lamps[0].depth / 2);
    if (lampX >= baseX + 0.15) place(lamps[0], lampX, lampY);
  }

  // ─── 8. Second lamp ── right wall / window area ──────────────────────────
  if (lamps[1]) {
    const l = lamps[1];
    const lampX = sg(baseX + roomW - l.width - 0.2);
    const lampY = win
      ? sg(win.y + win.width / 2 - l.depth / 2)
      : sg(baseY + roomL * 0.45);
    place(l, lampX, lampY);
  }

  // ─── 9. Plant ── right wall at window sill ────────────────────────────────
  const [plant] = pick("Decor", 1, (n) =>
    nameHas(n, "plant", "tree", "pot", "greenery", "monstera", "fiddle", "snake", "planter", "fig"),
  );

  if (plant) {
    const plantX = sg(baseX + roomW - plant.width - 0.15);
    const plantY = win ? sg(win.y + 0.1) : sg(baseY + roomL * 0.3);
    place(plant, plantX, plantY);
  }

  return placed;
}
