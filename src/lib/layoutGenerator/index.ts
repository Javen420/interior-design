import furnitureCatalogJson from "../../../data/furniture-catalog.json";
import type { CatalogItem, GenerateDesignInput, GeneratedDesignResult } from "./types";
import { pickTemplate } from "./templatePicker";
import { filterCatalog, trimPlacedToBudget } from "./catalogFilter";
import { planLivingRoom } from "./livingRoomPlanner";
import { buildDesignResponse } from "./finalizeLayout";

const catalog = furnitureCatalogJson as CatalogItem[];

/**
 * Entry point for living-room layout generation.
 *
 * 1. Pick the best matching room template.
 * 2. Filter the catalog by style + colour tone.
 * 3. Run the deterministic living-room planner.
 * 4. Trim to budget.
 * 5. Build the final response object.
 */
export function generateDesign(input: GenerateDesignInput): GeneratedDesignResult {
  const template = pickTemplate(input.flatType, input.roomType);
  const filtered = filterCatalog(catalog, input.styles, input.colorTone);
  const rawItems = planLivingRoom(template, catalog, filtered, input);
  const items = trimPlacedToBudget(rawItems, catalog, input.budgetMax);
  return buildDesignResponse(template, items, input);
}

export type { GenerateDesignInput, GeneratedDesignResult } from "./types";
