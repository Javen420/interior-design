import type { FurnitureItem } from "@/store/designStore";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  width: number;
  depth: number;
  color: string;
  styles: string[];
  colorTones: string[];
};

export type SpaceDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  length: number;
  floor: "wood" | "tile";
};

const EPS = 0.06;

function filterCatalog(
  catalog: CatalogItem[],
  styles: string[],
  colorTone: string,
): CatalogItem[] {
  const styleLower = styles.map((s) => s.toLowerCase());
  return catalog.filter(
    (item) =>
      item.styles.some((s) => styleLower.includes(s.toLowerCase())) &&
      (item.colorTones.includes(colorTone) ||
        item.colorTones.includes("neutral")),
  );
}

function takeCheapest(
  items: CatalogItem[],
  n: number,
  budgetFriendly: boolean,
): CatalogItem[] {
  const sorted = [...items].sort((a, b) =>
    budgetFriendly ? a.price - b.price : b.price - a.price,
  );
  return sorted.slice(0, n);
}

function nameHas(name: string, ...words: string[]) {
  const n = name.toLowerCase();
  return words.some((w) => n.includes(w));
}

/**
 * Build a furnished item list for a 3BR grid apartment: each item gets a target `spaceId`
 * for placement (global coords = space origin + local).
 */
export function pickFurnishPlan(
  catalog: CatalogItem[],
  spaces: SpaceDef[],
  styles: string[],
  colorTone: string,
  priorities: string[],
): Array<{ catalog: CatalogItem; spaceId: string }> {
  const budgetFriendly = priorities.includes("budget-friendly");
  const filtered = filterCatalog(catalog, styles, colorTone);
  const byCat = (cat: string) => filtered.filter((i) => i.category === cat);
  const fallback = (cat: string) => catalog.filter((i) => i.category === cat);

  const out: Array<{ catalog: CatalogItem; spaceId: string }> = [];

  const living = spaces.find((s) => s.id === "living")!;
  const kitchen = spaces.find((s) => s.id === "kitchen")!;
  const master = spaces.find((s) => s.id === "master")!;
  const bed2 = spaces.find((s) => s.id === "bed2")!;
  const bed3 = spaces.find((s) => s.id === "bed3");   // absent in 2-bedroom templates
  const bath = spaces.find((s) => s.id === "bath");    // absent in 2-bedroom templates

  const push = (cat: string, spaceId: string, count: number, pred?: (i: CatalogItem) => boolean) => {
    let pool = byCat(cat);
    if (pred) {
      const hit = pool.filter(pred);
      pool = hit.length ? hit : byCat(cat);
    }
    if (pool.length === 0) pool = fallback(cat);
    for (const item of takeCheapest(pool, count, budgetFriendly)) {
      out.push({ catalog: item, spaceId });
    }
  };

  // Living
  push("Seating", living.id, 1);
  push("Tables", living.id, 1, (i) => nameHas(i.name, "coffee", "round", "cube", "marble", "norra", "slate", "table"));
  push("Storage", living.id, 1, (i) => nameHas(i.name, "tv", "media", "console", "entertainment"));
  push("Lighting", living.id, 2);
  push("Decor", living.id, 2, (i) => nameHas(i.name, "rug", "plant", "cushion"));
  push("Decor", living.id, 1, (i) => nameHas(i.name, "art", "print"));

  // Kitchen — dining
  push("Dining", kitchen.id, 1, (i) => nameHas(i.name, "table", "dining", "oak", "marble"));
  push("Dining", kitchen.id, 4, (i) => nameHas(i.name, "chair"));
  push("Lighting", kitchen.id, 1);
  push("Decor", kitchen.id, 1);

  // Master
  push("Bedroom", master.id, 1, (i) => nameHas(i.name, "bed") && !nameHas(i.name, "side", "night"));
  push("Bedroom", master.id, 2, (i) => nameHas(i.name, "nightstand", "side table"));
  push("Bedroom", master.id, 1, (i) => nameHas(i.name, "wardrobe", "closet"));
  push("Lighting", master.id, 1);
  push("Decor", master.id, 1);

  // Bed 2
  push("Bedroom", bed2.id, 1, (i) => nameHas(i.name, "bed"));
  push("Workspace", bed2.id, 1);
  push("Lighting", bed2.id, 1);
  push("Decor", bed2.id, 1, (i) => nameHas(i.name, "plant", "print", "cushion"));

  // Bed 3 — only present in 3-bedroom templates
  if (bed3) {
    push("Bedroom", bed3.id, 1, (i) => nameHas(i.name, "bed"));
    push("Storage", bed3.id, 1, (i) => nameHas(i.name, "shelf", "book"));
    push("Lighting", bed3.id, 1);
    push("Decor", bed3.id, 1);
  }

  // Bathroom — only present when template includes a bath space
  if (bath) {
    push("Decor", bath.id, 2, (i) => nameHas(i.name, "plant", "cushion"));
    push("Lighting", bath.id, 1);
  }

  return out;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function placeOneInSpace(
  item: CatalogItem,
  space: SpaceDef,
  idx: number,
  placedInSpace: FurnitureItem[],
): { x: number; y: number; rotation: number } {
  const margin = 0.12;
  const sw = space.width - 2 * margin;
  const sl = space.length - 2 * margin;
  let x = margin;
  let y = margin;
  let rotation = 0;

  const cat = item.category;
  const n = item.name.toLowerCase();

  if (cat === "Seating") {
    x = margin;
    y = space.length - item.depth - margin;
  } else if (cat === "Tables" && n.includes("coffee")) {
    x = (sw - item.width) / 2 + margin;
    y = (sl - item.depth) / 2 + margin;
  } else if (cat === "Storage" && (n.includes("tv") || n.includes("media"))) {
    x = sw - item.width - margin + margin;
    y = margin;
  } else if (cat === "Bedroom" && n.includes("bed") && !n.includes("side")) {
    x = (sw - item.width) / 2 + margin;
    y = margin;
  } else if (n.includes("nightstand") || n.includes("side table")) {
    const bed = placedInSpace.find((p) => p.name.toLowerCase().includes("bed"));
    if (bed) {
      const count = placedInSpace.filter((p) =>
        p.name.toLowerCase().includes("nightstand"),
      ).length;
      if (count === 0) {
        x = bed.x - item.width - 0.08;
        y = bed.y + 0.15;
      } else {
        x = bed.x + bed.width + 0.08;
        y = bed.y + 0.15;
      }
    }
  } else if (cat === "Dining" && n.includes("table")) {
    x = (sw - item.width) / 2 + margin;
    y = (sl - item.depth) / 2 + margin;
  } else if (cat === "Dining" && n.includes("chair")) {
    const table = placedInSpace.find((p) => p.name.toLowerCase().includes("table"));
    const chairN = placedInSpace.filter((p) => p.name.toLowerCase().includes("chair")).length;
    if (table) {
      const positions = [
        { x: table.x - 0.05, y: table.y - item.depth - 0.08 },
        {
          x: table.x + table.width - item.width + 0.05,
          y: table.y - item.depth - 0.08,
        },
        { x: table.x - 0.08, y: table.y + table.depth + 0.05 },
        {
          x: table.x + table.width - item.width + 0.08,
          y: table.y + table.depth + 0.05,
        },
      ];
      const pos = positions[chairN % 4];
      x = pos.x;
      y = pos.y;
    } else {
      x = margin + (chairN % 3) * 0.55;
      y = margin;
    }
  } else if (cat === "Workspace") {
    x = margin;
    y = margin + 0.35;
  } else if (cat === "Lighting" || cat === "Decor") {
    const step = 0.55;
    x = margin + (idx % 3) * step;
    y = margin + Math.floor(idx / 3) * step;
  } else {
    x = margin + (idx % 4) * 0.45;
    y = margin + Math.floor(idx / 4) * 0.4;
  }

  x = clamp(x, margin, space.width - item.width - margin);
  y = clamp(y, margin, space.length - item.depth - margin);

  return {
    x: space.x + x,
    y: space.y + y,
    rotation,
  };
}

export function placeFurnishPlan(
  plan: Array<{ catalog: CatalogItem; spaceId: string }>,
  spaces: SpaceDef[],
): FurnitureItem[] {
  const bySpace: Record<string, FurnitureItem[]> = {};
  spaces.forEach((s) => {
    bySpace[s.id] = [];
  });

  const items: FurnitureItem[] = [];
  plan.forEach((p, i) => {
    const space = spaces.find((s) => s.id === p.spaceId);
    if (!space) return;
    const local = placeOneInSpace(
      p.catalog,
      space,
      bySpace[p.spaceId].length,
      bySpace[p.spaceId],
    );
    const fi: FurnitureItem = {
      id: `apt-${i}-${p.catalog.id}`,
      catalogId: p.catalog.id,
      name: p.catalog.name,
      category: p.catalog.category,
      price: p.catalog.price,
      width: p.catalog.width,
      depth: p.catalog.depth,
      x: Math.round(local.x * 4) / 4,
      y: Math.round(local.y * 4) / 4,
      rotation: local.rotation,
      color: p.catalog.color,
      spaceId: p.spaceId,
    };
    items.push(fi);
    bySpace[p.spaceId].push(fi);
  });

  return items;
}

export function trimPlanToBudget(
  plan: Array<{ catalog: CatalogItem; spaceId: string }>,
  catalog: CatalogItem[],
  budgetMax: number,
): Array<{ catalog: CatalogItem; spaceId: string }> {
  let list = [...plan];
  let total = list.reduce((s, p) => s + p.catalog.price, 0);
  while (total > budgetMax && list.length > 8) {
    const most = list.reduce((a, b) =>
      b.catalog.price > a.catalog.price ? b : a,
    );
    const cheaper = catalog
      .filter(
        (i) =>
          i.category === most.catalog.category &&
          i.price < most.catalog.price,
      )
      .sort((a, b) => b.price - a.price);
    const idx = list.indexOf(most);
    if (cheaper.length > 0) {
      list[idx] = { catalog: cheaper[0], spaceId: most.spaceId };
    } else {
      list = list.filter((x) => x !== most);
    }
    total = list.reduce((s, p) => s + p.catalog.price, 0);
  }
  while (total > budgetMax && list.length > 6) {
    const most = list.reduce((a, b) =>
      b.catalog.price > a.catalog.price ? b : a,
    );
    list = list.filter((x) => x !== most);
    total = list.reduce((s, p) => s + p.catalog.price, 0);
  }
  return list;
}
