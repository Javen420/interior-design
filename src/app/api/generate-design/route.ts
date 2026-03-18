import { NextRequest, NextResponse } from "next/server";
import furnitureCatalog from "../../../../data/furniture-catalog.json";
import roomTemplates from "../../../../data/room-templates.json";
import styleProfiles from "../../../../data/style-profiles.json";

// PRODUCTION: Replace with ML layout model (e.g., LayoutGPT, custom transformer) or call Claude API with room constraints

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

function pickItems(
  catalog: CatalogItem[],
  roomType: string,
  styles: string[],
  priorities: string[],
  budgetMin: number,
  budgetMax: number,
  colorTone: string,
) {
  // Filter catalog to matching style + color tone
  const styleLower = styles.map((s) => s.toLowerCase());
  let filtered = catalog.filter(
    (item) =>
      item.styles.some((s) => styleLower.includes(s.toLowerCase())) &&
      (item.colorTones.includes(colorTone) ||
        item.colorTones.includes("neutral")),
  );

  // Items needed per room type
  const roomSets: Record<string, Record<string, number>> = {
    "living-room": { Seating: 1, Tables: 1, Storage: 2, Lighting: 2, Decor: 3 },
    bedroom: { Bedroom: 4, Lighting: 2, Decor: 2, Workspace: 1 },
    kitchen: { Dining: 6, Lighting: 1, Decor: 1 },
    "": {
      // Entire house/flat layout - combine furniture for all rooms
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
  const needed = roomSets[roomType] || roomSets[""];

  const isBudgetFriendly = priorities.includes("budget-friendly");
  const selected: CatalogItem[] = [];

  for (const [category, count] of Object.entries(needed)) {
    let categoryItems = filtered.filter((i) => i.category === category);
    if (categoryItems.length === 0) {
      categoryItems = catalog.filter((i) => i.category === category);
    }
    // Sort by price
    categoryItems.sort((a, b) =>
      isBudgetFriendly ? a.price - b.price : b.price - a.price,
    );
    for (let i = 0; i < Math.min(count, categoryItems.length); i++) {
      selected.push(categoryItems[i]);
    }
  }

  // Trim to stay within budget
  let totalCost = selected.reduce((s, i) => s + i.price, 0);
  while (totalCost > budgetMax && selected.length > 3) {
    const mostExpensive = selected.reduce((prev, curr) =>
      curr.price > prev.price ? curr : prev,
    );
    const idx = selected.indexOf(mostExpensive);
    const cheaper = catalog
      .filter(
        (i) =>
          i.category === mostExpensive.category &&
          i.price < mostExpensive.price,
      )
      .sort((a, b) => b.price - a.price);
    if (cheaper.length > 0) {
      selected[idx] = cheaper[0];
    } else {
      selected.splice(idx, 1);
    }
    totalCost = selected.reduce((s, i) => s + i.price, 0);
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
  const maximizeSpace = priorities.includes("maximize-space");
  const margin = maximizeSpace ? 0.15 : 0.1;
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

  // Track which wall positions are used
  let wallCursor = { top: margin, right: margin, bottom: margin, left: margin };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let x = 0,
      y = 0,
      rotation = 0;
    const jitter = () => (Math.random() - 0.5) * 0.2;

    if (["Seating"].includes(item.category)) {
      // Sofa against longest wall (bottom)
      x = margin + jitter();
      y = roomLength - item.depth - margin;
      rotation = 0;
    } else if (
      item.category === "Bedroom" &&
      item.name.toLowerCase().includes("bed")
    ) {
      // Bed centred against top wall
      x = (roomWidth - item.width) / 2 + jitter();
      y = margin;
      rotation = 0;
    } else if (
      item.category === "Bedroom" &&
      item.name.toLowerCase().includes("wardrobe")
    ) {
      // Wardrobe against side wall
      x = roomWidth - item.width - margin;
      y = margin + jitter();
      rotation = 0;
    } else if (
      item.category === "Bedroom" &&
      (item.name.toLowerCase().includes("nightstand") ||
        item.name.toLowerCase().includes("side table"))
    ) {
      // Side tables next to bed
      const bedItem = placed.find((p) => p.name.toLowerCase().includes("bed"));
      if (bedItem) {
        const sideTableCount = placed.filter(
          (p) =>
            p.name.toLowerCase().includes("nightstand") ||
            p.name.toLowerCase().includes("side table"),
        ).length;
        if (sideTableCount === 0) {
          x = bedItem.x - item.width - 0.1;
          y = bedItem.y + 0.3;
        } else {
          x = bedItem.x + bedItem.width + 0.1;
          y = bedItem.y + 0.3;
        }
      } else {
        x = margin;
        y = margin;
      }
    } else if (item.category === "Workspace") {
      // Desk against a wall
      x = margin;
      y = roomLength / 2;
      rotation = 0;
    } else if (item.category === "Tables") {
      // Coffee table centrally
      x = (roomWidth - item.width) / 2 + jitter();
      y = (roomLength - item.depth) / 2 + jitter();
    } else if (
      item.category === "Dining" &&
      item.name.toLowerCase().includes("table")
    ) {
      x = (roomWidth - item.width) / 2;
      y = (roomLength - item.depth) / 2;
    } else if (
      item.category === "Dining" &&
      item.name.toLowerCase().includes("chair")
    ) {
      const table = placed.find((p) => p.name.toLowerCase().includes("table"));
      const chairCount = placed.filter((p) =>
        p.name.toLowerCase().includes("chair"),
      ).length;
      if (table) {
        const positions = [
          { x: table.x - 0.05, y: table.y - item.depth - 0.05 },
          {
            x: table.x + table.width - item.width + 0.05,
            y: table.y - item.depth - 0.05,
          },
          { x: table.x - 0.05, y: table.y + table.depth + 0.05 },
          {
            x: table.x + table.width - item.width + 0.05,
            y: table.y + table.depth + 0.05,
          },
        ];
        const pos = positions[chairCount % 4];
        x = pos.x;
        y = pos.y;
      } else {
        x = 0.5 + chairCount * 0.6;
        y = 0.5;
      }
    } else if (item.category === "Storage") {
      // Against walls
      x = roomWidth - item.width - margin;
      y = wallCursor.right;
      wallCursor.right += item.depth + 0.3;
      if (wallCursor.right > roomLength - 1) {
        x = margin;
        y = wallCursor.left;
        wallCursor.left += item.depth + 0.3;
      }
    } else if (item.category === "Lighting") {
      // Corners or next to seating
      const lightCount = placed.filter((p) => p.category === "Lighting").length;
      if (lightCount === 0) {
        x = roomWidth - item.width - margin;
        y = roomLength - item.depth - margin;
      } else {
        x = margin;
        y = margin;
      }
    } else if (item.category === "Decor") {
      const decorCount = placed.filter((p) => p.category === "Decor").length;
      // spread around the room
      x = margin + decorCount * (roomWidth / 4);
      y = margin + (decorCount % 2) * (roomLength - item.depth - 2 * margin);
      if (x + item.width > roomWidth) x = roomWidth - item.width - margin;
    } else {
      x = margin + i * 0.5;
      y = margin + i * 0.3;
    }

    // Clamp within room bounds
    x = Math.max(0, Math.min(roomWidth - item.width, x));
    y = Math.max(0, Math.min(roomLength - item.depth, y));
    // Snap to 0.25m grid
    x = Math.round(x * 4) / 4;
    y = Math.round(y * 4) / 4;

    placed.push({
      catalogId: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      width: item.width,
      depth: item.depth,
      x,
      y,
      rotation,
      color: item.color,
      id: `item-${i}`,
    });
  }

  return placed;
}

export async function POST(request: NextRequest) {
  const body: GenerateRequest = await request.json();

  // Simulate AI delay (2.5s)
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Find room template
  let template = (
    roomTemplates as Array<{
      id: string;
      flatType: string;
      roomType: string;
      width: number;
      length: number;
      sqm: number;
      averageCost: number;
      walls: { x1: number; y1: number; x2: number; y2: number }[];
      doors: { x: number; y: number; width: number; side: string }[];
      windows: { x: number; y: number; width: number; side: string }[];
    }>
  ).find((t) => t.flatType === body.flatType && t.roomType === body.roomType);

  // If no room type selected (empty string), use a larger template for entire flat
  if (!template && !body.roomType) {
    const flatDimensions: Record<
      string,
      { width: number; length: number; sqm: number }
    > = {
      "3room-bto": { width: 8, length: 8.5, sqm: 68 },
      "4room-bto": { width: 9.5, length: 9.5, sqm: 93 },
      "5room-bto": { width: 11, length: 10, sqm: 113 },
      "resale-hdb": { width: 9, length: 9, sqm: 85 },
    };
    const dims = flatDimensions[body.flatType] || flatDimensions["4room-bto"];
    template = {
      id: `${body.flatType}-entire`,
      flatType: body.flatType,
      roomType: "",
      width: dims.width,
      length: dims.length,
      sqm: dims.sqm,
      averageCost: 3000,
      walls: [
        { x1: 0, y1: 0, x2: dims.width, y2: 0 },
        { x1: dims.width, y1: 0, x2: dims.width, y2: dims.length },
        { x1: dims.width, y1: dims.length, x2: 0, y2: dims.length },
        { x1: 0, y1: dims.length, x2: 0, y2: 0 },
      ],
      doors: [{ x: dims.width / 2, y: 0, width: 1, side: "top" }],
      windows: [{ x: 0.5, y: 0, width: 1.5, side: "top" }],
    };
  }

  if (!template) {
    return NextResponse.json(
      { error: "Room template not found" },
      { status: 404 },
    );
  }

  const selectedItems = pickItems(
    furnitureCatalog as CatalogItem[],
    body.roomType,
    body.styles,
    body.priorities,
    body.budgetMin,
    body.budgetMax,
    body.colorTone,
  );

  const placedItems = placeItems(
    selectedItems,
    template.width,
    template.length,
    body.roomType,
    body.priorities,
  );

  const totalCost = placedItems.reduce((s, i) => s + i.price, 0);

  const styleProfile = (
    styleProfiles as Array<{
      id: string;
      name: string;
      colorPalette: string[];
    }>
  ).find((p) => p.name.toLowerCase() === (body.styles[0] || "").toLowerCase());

  return NextResponse.json({
    room: {
      width: template.width,
      length: template.length,
      walls: template.walls,
      doors: template.doors,
      windows: template.windows,
    },
    items: placedItems,
    totalCost,
    averageCost: template.averageCost,
    styleApplied: body.styles[0] || "Scandinavian",
    colorPalette: styleProfile?.colorPalette || [
      "#F5F0E8",
      "#D4B896",
      "#8B7355",
      "#2C2C2C",
      "#E8DFD0",
    ],
  });
}
