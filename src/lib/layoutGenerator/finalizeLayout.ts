import type {
  CatalogItem,
  GenerateDesignInput,
  GeneratedDesignResult,
  PlacedItem,
} from "./types";
import type { RoomTemplate } from "@/data/roomTemplates";
import styleProfilesJson from "../../../data/style-profiles.json";

interface StyleProfile {
  id: string;
  name: string;
  colorPalette: string[];
}

const styleProfiles = styleProfilesJson as StyleProfile[];

const DEFAULT_PALETTE = ["#F5F0E8", "#D4B896", "#8B7355", "#2C2C2C", "#E8DFD0"];

function lookupPalette(styleName: string): string[] {
  const profile = styleProfiles.find(
    (p) => p.name.toLowerCase() === styleName.toLowerCase(),
  );
  return profile?.colorPalette ?? DEFAULT_PALETTE;
}

/**
 * Assembles the final API response from the placed items and template.
 * Does NOT mutate `items`.
 */
export function buildDesignResponse(
  template: RoomTemplate,
  items: PlacedItem[],
  input: GenerateDesignInput,
): GeneratedDesignResult {
  const styleApplied = input.styles[0] ?? "Scandinavian";

  return {
    room: {
      width: template.width,
      length: template.length,
      walls: template.walls,
      doors: template.doors,
      windows: template.windows,
      spaces: template.spaces,
    },
    items,
    totalCost: items.reduce((s, i) => s + i.price, 0),
    averageCost: template.averageCost,
    styleApplied,
    colorPalette: lookupPalette(styleApplied),
  };
}

/**
 * Replaces or removes items until `totalCost ≤ budgetMax` or only 3 remain.
 *
 * Replacement strategy: swap the most expensive item for the cheapest
 * available alternative in the same category. Remove it if no alternative exists.
 */
export function trimPlacedToBudget(
  items: PlacedItem[],
  full: CatalogItem[],
  budgetMax: number,
): PlacedItem[] {
  let list = [...items];
  let total = list.reduce((s, i) => s + i.price, 0);

  while (total > budgetMax && list.length > 3) {
    const most = list.reduce((a, b) => (b.price > a.price ? b : a));
    const idx = list.indexOf(most);

    const cheaper = full
      .filter((c) => c.category === most.category && c.price < most.price)
      .sort((a, b) => b.price - a.price); // pick the most-expensive-but-still-cheaper

    if (cheaper.length > 0) {
      const swap = cheaper[0];
      list[idx] = {
        ...most,
        catalogId: swap.id,
        name: swap.name,
        price: swap.price,
        width: swap.width,
        depth: swap.depth,
        color: swap.color,
      };
    } else {
      list = list.filter((_, i) => i !== idx);
    }

    total = list.reduce((s, i) => s + i.price, 0);
  }

  return list;
}
