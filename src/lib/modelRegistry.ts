import type { FurnitureItem } from "@/store/designStore";

// ── Model registry ───────────────────────────────────────────────────────────
//
// HOW TO ADD A MODEL
// ──────────────────
// 1. Drop a .glb file into  public/models/  (e.g. public/models/sofa.glb)
// 2. Uncomment (or add) the matching entry below — CATEGORY_MODELS for a whole
//    category, CATALOG_MODELS for a specific catalog item.
// 3. Save the file. Hot-reload picks up the change immediately.
//
// IMPORTANT: Category keys must match the catalog exactly (capital first letter):
//   "Seating"  "Bedroom"  "Tables"  "Dining"  "Storage"  "Workspace"  "Lighting"  "Decor"
//
// FALLBACK GUARANTEE
// ──────────────────
// If getModelPath returns null (no entry), FurnitureModel renders shaped
// fallback geometry — no network request, no error, no crash.
// If a path IS registered but the file is missing, an error boundary catches
// the 404 and the same fallback renders, with a console.warn identifying the file.

// ── Tier 1: per-item overrides ────────────────────────────────────────────────
//
// Use these when you want one specific catalog item to load a different model
// than the rest of its category.
//
// Catalog ID format examples:
//   sofa-scandi-01, sofa-ind-01, bed-scandi-01, bed-jpd-01
//   coffee-scandi-01, dining-table-01, tv-scandi-01, desk-scandi-01
//
// Step-by-step:
//   1. Find the catalogId in data/furniture-catalog.json
//   2. Download a matching .glb from the sources listed at the bottom
//   3. Place the file in public/models/
//   4. Add an entry below, then uncomment it
//
const CATALOG_MODELS: Record<string, string> = {
  // "sofa-scandi-01":   "/models/sofa-scandinavian.glb",
  // "sofa-ind-01":      "/models/sofa-industrial.glb",
  // "bed-scandi-01":    "/models/bed-platform.glb",
  // "bed-ind-01":       "/models/bed-industrial.glb",
  // "dining-table-01":  "/models/dining-table-round.glb",
  // "desk-scandi-01":   "/models/desk-minimal.glb",
};

// ── Tier 2: category-level defaults ──────────────────────────────────────────
//
// One model file covers every item in a category unless overridden above.
// This is the fastest way to get realistic models into the scene —
// download one file per category and uncomment the matching line.
//
// Recommended naming convention:
//   public/models/
//     sofa.glb           ← Seating
//     bed.glb            ← Bedroom
//     coffee-table.glb   ← Tables  (used for all non-dining tables)
//     dining-table.glb   ← Dining
//     cabinet.glb        ← Storage (TV consoles, shelves, wardrobes)
//     desk.glb           ← Workspace
//     floor-lamp.glb     ← Lighting
//     plant.glb          ← Decor
//
const CATEGORY_MODELS: Record<string, string> = {
  // Seating:   "/models/sofa.glb",
  // Bedroom:   "/models/bed.glb",
  // Tables:    "/models/coffee-table.glb",
  // Dining:    "/models/dining-table.glb",
  // Storage:   "/models/cabinet.glb",
  // Workspace: "/models/desk.glb",
  // Lighting:  "/models/floor-lamp.glb",
  // Decor:     "/models/plant.glb",
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the /models/ path for a furniture item, or null if no model has
 * been registered. A null result means FurnitureModel will render shaped
 * fallback geometry — no network request is attempted.
 */
export function getModelPath(
  item: Pick<FurnitureItem, "catalogId" | "category">,
): string | null {
  return CATALOG_MODELS[item.catalogId] ?? CATEGORY_MODELS[item.category] ?? null;
}

/**
 * Returns every unique model path currently active in both tiers.
 * Used by ARViewer to call useGLTF.preload() so models are fetched
 * in the background before the 3D tab is opened.
 */
export function getAllRegisteredPaths(): string[] {
  const paths = new Set<string>([
    ...Object.values(CATALOG_MODELS),
    ...Object.values(CATEGORY_MODELS),
  ]);
  return [...paths];
}

// ── Free model sources ────────────────────────────────────────────────────────
//
//  https://poly.pizza           Google Poly archive. Most models are CC0 or CC-BY.
//                               Search by furniture type, filter by "low poly".
//
//  https://sketchfab.com        Largest 3D library. Filter: Free → Downloadable →
//                               CC licence. Avoid "CC-ND" (no derivatives).
//
//  https://kenney.nl/assets     All CC0. "Furniture Kit" and "Interior Kit" packs
//                               contain pre-exported .glb files.
//
//  https://market.pmnd.rs       Poimandres community market. Models are already
//                               optimised for React Three Fiber / Drei.
//
//  https://quaternius.com       Free CC0 low-poly packs. "Ultimate Furniture Pack"
//                               is a good all-in-one option.
