import type { CatalogItem, PlacedItem } from "./types";

/**
 * Returns items that match both the style list and colour tone.
 * Falls back to style-only match if the style+colour intersection is empty,
 * and to the entire catalog if no style matches at all.
 */
export function filterCatalog(
  catalog: CatalogItem[],
  styles: string[],
  colorTone: string,
): CatalogItem[] {
  const styleLower = styles.map((s) => s.toLowerCase());

  const styleAndColor = catalog.filter(
    (item) =>
      item.styles.some((s) => styleLower.includes(s.toLowerCase())) &&
      (item.colorTones.includes(colorTone) ||
        item.colorTones.includes("neutral")),
  );
  if (styleAndColor.length > 0) return styleAndColor;

  const styleOnly = catalog.filter((item) =>
    item.styles.some((s) => styleLower.includes(s.toLowerCase())),
  );
  return styleOnly.length > 0 ? styleOnly : catalog;
}

/**
 * Picks up to `count` items from `category` out of `filtered`.
 *
 * - If `namePred` is given, attempts to narrow further by name; falls back to
 *   the category pool without the predicate if the filtered-by-name pool is empty.
 * - Falls back to `full` (unfiltered catalog) if `filtered` has no items in
 *   the category at all.
 * - Sorts cheapest-first when `budgetFriendly` is true, priciest-first otherwise.
 */
export function pickByCategory(
  filtered: CatalogItem[],
  full: CatalogItem[],
  category: string,
  count: number,
  budgetFriendly: boolean,
  namePred?: (name: string) => boolean,
): CatalogItem[] {
  let pool = filtered.filter((i) => i.category === category);

  if (pool.length === 0) {
    pool = full.filter((i) => i.category === category);
  }

  if (namePred) {
    const narrowed = pool.filter((i) => namePred(i.name));
    if (narrowed.length > 0) pool = narrowed;
  }

  const sorted = [...pool].sort((a, b) =>
    budgetFriendly ? a.price - b.price : b.price - a.price,
  );
  return sorted.slice(0, count);
}

/**
 * Trims a list of placed items to stay within `budgetMax`.
 *
 * Strategy: replace the most expensive item with the cheapest alternative in
 * the same category from `full`. If no cheaper option exists, remove the item.
 * Stops once total ≤ budgetMax or only 3 items remain.
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
    const cheaper = full
      .filter((i) => i.category === most.category && i.price < most.price)
      .sort((a, b) => b.price - a.price);

    const idx = list.indexOf(most);
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
