import { NextRequest, NextResponse } from "next/server";
import furnitureCatalog from "../../../../data/furniture-catalog.json";
import roomTemplates from "../../../../data/room-templates.json";
import styleProfiles from "../../../../data/style-profiles.json";
import { hdb3roomBTOTemplate } from "@/data/roomTemplates";
import {
  pickFurnishPlan,
  placeFurnishPlan,
  trimPlanToBudget,
  type SpaceDef,
} from "@/lib/apartmentFurnish";
import { generateDesign } from "@/lib/layoutGenerator";

// ── Shared request type ───────────────────────────────────────────────────────

interface GenerateRequest {
  flatType: string;
  roomType: string;
  styles: string[];
  colorTone: string;
  priorities: string[];
  budgetMin: number;
  budgetMax: number;
  inspirationStyle: string | null;
}

type CatalogItem = (typeof furnitureCatalog)[number];

// ── Legacy helpers (bedroom / kitchen / entire-flat paths) ────────────────────
// These remain here until bedroom and kitchen planners are added to
// src/lib/layoutGenerator/. Do not call them for living-room requests.

function pickItems(
  catalog: CatalogItem[],
  roomType: string,
  styles: string[],
  priorities: string[],
  budgetMin: number,
  budgetMax: number,
  colorTone: string,
) {
  const styleLower = styles.map((s) => s.toLowerCase());
  let filtered = catalog.filter(
    (item) =>
      item.styles.some((s) => styleLower.includes(s.toLowerCase())) &&
      (item.colorTones.includes(colorTone) ||
        item.colorTones.includes("neutral")),
  );

  const roomSets: Record<string, Record<string, number>> = {
    bedroom: { Bedroom: 4, Lighting: 2, Decor: 2, Workspace: 1 },
    kitchen: { Dining: 6, Lighting: 1, Decor: 1 },
    "": {
      Seating: 2,
      Tables: 2,
      Storage: 4,
      Lighting: 5,
      Decor: 6,
      Bedroom: 2,
      Dining: 3,
      Workspace: 1,
    },
  };
  const needed = roomSets[roomType] ?? roomSets[""];
  const isBudgetFriendly = priorities.includes("budget-friendly");
  const selected: CatalogItem[] = [];

  for (const [category, count] of Object.entries(needed)) {
    let pool = filtered.filter((i) => i.category === category);
    if (pool.length === 0) pool = catalog.filter((i) => i.category === category);
    pool.sort((a, b) => (isBudgetFriendly ? a.price - b.price : b.price - a.price));
    selected.push(...pool.slice(0, count));
  }

  let total = selected.reduce((s, i) => s + i.price, 0);
  while (total > budgetMax && selected.length > 3) {
    const most = selected.reduce((a, b) => (b.price > a.price ? b : a));
    const idx = selected.indexOf(most);
    const cheaper = catalog
      .filter((i) => i.category === most.category && i.price < most.price)
      .sort((a, b) => b.price - a.price);
    if (cheaper.length > 0) {
      selected[idx] = cheaper[0];
    } else {
      selected.splice(idx, 1);
    }
    total = selected.reduce((s, i) => s + i.price, 0);
  }
  return selected;
}

function placeItems(
  items: CatalogItem[],
  roomWidth: number,
  roomLength: number,
  roomType: string,
  priorities: string[],
) {
  const margin = priorities.includes("maximize-space") ? 0.15 : 0.1;
  const placed: Array<{
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
    id: string;
  }> = [];
  let wallRight = margin;
  let wallLeft = margin;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let x = 0, y = 0, rotation = 0;

    if (item.category === "Seating") {
      x = margin;
      y = roomLength - item.depth - margin;
    } else if (item.category === "Bedroom" && item.name.toLowerCase().includes("bed") && !item.name.toLowerCase().includes("side")) {
      x = (roomWidth - item.width) / 2;
      y = margin;
    } else if (item.category === "Bedroom" && item.name.toLowerCase().includes("wardrobe")) {
      x = roomWidth - item.width - margin;
      y = margin;
    } else if (item.category === "Bedroom" && (item.name.toLowerCase().includes("nightstand") || item.name.toLowerCase().includes("side table"))) {
      const bed = placed.find((p) => p.name.toLowerCase().includes("bed"));
      const sideCount = placed.filter((p) => p.name.toLowerCase().includes("nightstand") || p.name.toLowerCase().includes("side table")).length;
      if (bed) {
        x = sideCount === 0 ? bed.x - item.width - 0.1 : bed.x + bed.width + 0.1;
        y = bed.y + 0.3;
      } else {
        x = margin; y = margin;
      }
    } else if (item.category === "Workspace") {
      x = margin; y = roomLength / 2;
    } else if (item.category === "Tables") {
      x = (roomWidth - item.width) / 2;
      y = (roomLength - item.depth) / 2;
    } else if (item.category === "Dining" && item.name.toLowerCase().includes("table")) {
      x = (roomWidth - item.width) / 2;
      y = (roomLength - item.depth) / 2;
    } else if (item.category === "Dining" && item.name.toLowerCase().includes("chair")) {
      const table = placed.find((p) => p.name.toLowerCase().includes("table"));
      const chairCount = placed.filter((p) => p.name.toLowerCase().includes("chair")).length;
      if (table) {
        const positions = [
          { x: table.x - 0.05, y: table.y - item.depth - 0.05 },
          { x: table.x + table.width - item.width + 0.05, y: table.y - item.depth - 0.05 },
          { x: table.x - 0.05, y: table.y + table.depth + 0.05 },
          { x: table.x + table.width - item.width + 0.05, y: table.y + table.depth + 0.05 },
        ];
        const pos = positions[chairCount % 4];
        x = pos.x; y = pos.y;
      } else {
        x = 0.5 + chairCount * 0.6; y = 0.5;
      }
    } else if (item.category === "Storage") {
      x = roomWidth - item.width - margin;
      y = wallRight;
      wallRight += item.depth + 0.3;
      if (wallRight > roomLength - 1) { x = margin; y = wallLeft; wallLeft += item.depth + 0.3; }
    } else if (item.category === "Lighting") {
      const lCount = placed.filter((p) => p.category === "Lighting").length;
      x = lCount === 0 ? roomWidth - item.width - margin : margin;
      y = lCount === 0 ? roomLength - item.depth - margin : margin;
    } else if (item.category === "Decor") {
      const dCount = placed.filter((p) => p.category === "Decor").length;
      x = margin + dCount * (roomWidth / 4);
      y = margin + (dCount % 2) * (roomLength - item.depth - 2 * margin);
      if (x + item.width > roomWidth) x = roomWidth - item.width - margin;
    } else {
      x = margin + i * 0.5; y = margin + i * 0.3;
    }

    x = Math.max(0, Math.min(roomWidth - item.width, x));
    y = Math.max(0, Math.min(roomLength - item.depth, y));
    x = Math.round(x * 4) / 4;
    y = Math.round(y * 4) / 4;

    placed.push({
      catalogId: item.id, name: item.name, category: item.category,
      price: item.price, width: item.width, depth: item.depth,
      x, y, rotation, color: item.color, id: `item-${i}`,
    });
  }
  return placed;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body: GenerateRequest = await request.json();

  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // ── Path A: full 3-BR apartment ───────────────────────────────────────────
  if (body.roomType === "full-apartment") {
    if (body.flatType !== "3room-bto") {
      return NextResponse.json(
        { error: "Full apartment layout is only available for 3-room BTO." },
        { status: 400 },
      );
    }
    // Use hdb3roomBTOTemplate as the authoritative source — it has correctly
    // gapped wall segments for all internal door openings.
    const apt = hdb3roomBTOTemplate;
    const catalog = furnitureCatalog as CatalogItem[];
    let plan = pickFurnishPlan(catalog, apt.spaces as SpaceDef[], body.styles, body.colorTone, body.priorities);
    plan = trimPlanToBudget(plan, catalog, body.budgetMax);
    const placedItems = placeFurnishPlan(plan, apt.spaces as SpaceDef[]);
    const styleProfile = (styleProfiles as Array<{ id: string; name: string; colorPalette: string[] }>)
      .find((p) => p.name.toLowerCase() === (body.styles[0] ?? "").toLowerCase());
    return NextResponse.json({
      room: {
        width: apt.width, length: apt.length,
        walls: apt.walls, doors: apt.doors, windows: apt.windows,
        layoutId: apt.id, spaces: apt.spaces,
      },
      items: placedItems,
      totalCost: placedItems.reduce((s, i) => s + i.price, 0),
      averageCost: apt.averageCost,
      styleApplied: body.styles[0] ?? "Scandinavian",
      colorPalette: styleProfile?.colorPalette ?? ["#F5F0E8", "#D4B896", "#8B7355", "#2C2C2C", "#E8DFD0"],
    });
  }

  // ── Path B: single living room (new layout generator) ────────────────────
  if (body.roomType === "living-room") {
    const result = generateDesign(body);
    return NextResponse.json(result);
  }

  // ── Path C: no focus area selected — default to apartment shell view ──────
  // When the user skips the "Focus Area" step the roomType is an empty string.
  // Previously this fell through to a hardcoded 4-wall open box. Now we route
  // through generateDesign() so the correct multi-room template is used.
  if (!body.roomType) {
    const result = generateDesign({ ...body, roomType: "living-room" });
    return NextResponse.json(result);
  }

  // ── Path D: bedroom / kitchen legacy path ────────────────────────────────
  const catalog = furnitureCatalog as CatalogItem[];

  const template = (roomTemplates as Array<{
    id: string; flatType: string; roomType: string;
    width: number; length: number; sqm: number; averageCost: number;
    walls: { x1: number; y1: number; x2: number; y2: number }[];
    doors: { x: number; y: number; width: number; side: string }[];
    windows: { x: number; y: number; width: number; side: string }[];
  }>).find((t) => t.flatType === body.flatType && t.roomType === body.roomType);

  if (!template) {
    return NextResponse.json({ error: "Room template not found" }, { status: 404 });
  }

  const selectedItems = pickItems(catalog, body.roomType, body.styles, body.priorities, body.budgetMin, body.budgetMax, body.colorTone);
  const placedItems = placeItems(selectedItems, template.width, template.length, body.roomType, body.priorities);
  const totalCost = placedItems.reduce((s, i) => s + i.price, 0);
  const styleProfile = (styleProfiles as Array<{ id: string; name: string; colorPalette: string[] }>)
    .find((p) => p.name.toLowerCase() === (body.styles[0] ?? "").toLowerCase());

  return NextResponse.json({
    room: {
      width: template.width, length: template.length,
      walls: template.walls, doors: template.doors, windows: template.windows,
    },
    items: placedItems,
    totalCost,
    averageCost: template.averageCost,
    styleApplied: body.styles[0] ?? "Scandinavian",
    colorPalette: styleProfile?.colorPalette ?? ["#F5F0E8", "#D4B896", "#8B7355", "#2C2C2C", "#E8DFD0"],
  });
}
