import type { Tables } from "@/types/supabase";

export type DisplayField = { id: string; label: string };

/**
 * Resolves the display string for a given player + field id.
 * Used by roster cards, the profile modal, and the on-block auction card.
 */
export function getPlayerFieldValue(
  player: Tables<"players">,
  fieldId: string,
): string | null {
  switch (fieldId) {
    case "category":
      return player.category ?? null;
    case "currentTeam":
      return player.current_team ?? null;
    case "jerseyNo":
      return player.jersey_no != null ? `#${player.jersey_no}` : null;
    case "jerseySize":
      return player.jersey_size ?? null;
    case "basePrice":
      return player.base_price != null ? `${player.base_price} pts` : null;
    case "mobileNo":
      return null; // never expose publicly
    case "firstName":
      return player.first_name ?? null;
    case "surname":
      return player.surname ?? null;
    default: {
      const cf = player.custom_fields;
      if (cf && typeof cf === "object" && !Array.isArray(cf)) {
        const v = (cf as Record<string, unknown>)[fieldId];
        if (v == null) return null;
        return String(v);
      }
      return null;
    }
  }
}

/**
 * Builds a DisplayField[] from the config's field selections, resolving
 * labels from the formFields list (falls back to a title-cased id).
 */
export function buildDisplayFields(
  fieldIds: string[],
  formFields: Array<{ id: string; label: string }>,
): DisplayField[] {
  return fieldIds
    .map((id) => {
      const f = formFields.find((x) => x.id === id);
      if (f) return { id, label: f.label };
      if (id === "basePrice") return { id, label: "Base Price" };
      return null;
    })
    .filter((x): x is DisplayField => x !== null);
}