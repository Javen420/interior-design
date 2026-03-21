import { livingRoomTemplates, hdb3roomBTOTemplate, type RoomTemplate } from "@/data/roomTemplates";

/** All templates in priority order: apartment templates first, single-room fallbacks after. */
const ALL_TEMPLATES: RoomTemplate[] = [hdb3roomBTOTemplate, ...livingRoomTemplates];

/**
 * Returns the best matching template for the given flatType + roomType.
 *
 * Priority:
 *   1. Exact flatType + roomType match
 *   2. Any template with the right roomType (cross-flat fallback)
 *   3. First template in the list (safe fallback)
 */
export function pickTemplate(flatType: string, roomType: string): RoomTemplate {
  const exact = ALL_TEMPLATES.find(
    (t) => t.flatType === flatType && t.roomType === roomType,
  );
  if (exact) return exact;

  const byRoomType = ALL_TEMPLATES.find((t) => t.roomType === roomType);
  return byRoomType ?? ALL_TEMPLATES[0];
}
