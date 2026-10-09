import type { Json } from "@/types/database.types";

export type FormFieldType =
  | "text"
  | "number"
  | "tel"
  | "email"
  | "select"
  | "radio"
  | "textarea"
  | "photo";

export type FormFieldDef = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  uniqueMobile?: boolean;
};

export type FormConfig = {
  enabled: boolean;
  title: string;
  description: string;
  formFields: FormFieldDef[];
};

export const DEFAULT_FORM_FIELDS: FormFieldDef[] = [
  { id: "firstName", label: "First Name", type: "text", required: true },
  { id: "surname", label: "Surname", type: "text", required: true },
  { id: "mobileNo", label: "Mobile Number", type: "tel", required: true, uniqueMobile: true },
  { id: "jerseyNo", label: "Jersey Number", type: "number", required: true },
  { id: "jerseySize", label: "Jersey Size", type: "radio", required: true, options: ["S", "M", "L", "XL", "XXL", "3XL"] },
  { id: "category", label: "Category", type: "radio", required: true, options: ["Batsman", "Bowler", "All-Rounder", "WK-Keeper"] },
  { id: "currentTeam", label: "Current Team Name", type: "text", required: false },
  { id: "photo", label: "Player Photo", type: "photo", required: true },
];

const VALID_TYPES: FormFieldType[] = [
  "text", "number", "tel", "email", "select", "radio", "textarea", "photo",
];

export function normalizeFormConfig(
  raw: Json | null | undefined,
  tournamentName: string,
): FormConfig {
  const fallback: FormConfig = {
    enabled: true,
    title: `${tournamentName} Player Registration`,
    description: "Register to join the auction.",
    formFields: DEFAULT_FORM_FIELDS,
  };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;

  const obj = raw as Record<string, unknown>;

  const enabled = obj.enabled !== false;
  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : fallback.title;
  const description =
    typeof obj.description === "string" && obj.description.trim()
      ? obj.description.trim()
      : fallback.description;

  let formFields: FormFieldDef[] = DEFAULT_FORM_FIELDS;

  if (Array.isArray(obj.formFields) && obj.formFields.length > 0) {
    const parsed: FormFieldDef[] = [];
    for (const item of obj.formFields) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const f = item as Record<string, unknown>;
      if (typeof f.id !== "string" || !f.id) continue;
      if (typeof f.label !== "string" || !f.label) continue;
      if (typeof f.type !== "string") continue;
      const type = f.type as FormFieldType;
      if (!VALID_TYPES.includes(type)) continue;

      const def: FormFieldDef = {
        id: f.id,
        label: f.label,
        type,
        required: f.required === true,
      };
      if (Array.isArray(f.options)) {
        const opts = f.options.filter((o): o is string => typeof o === "string" && o.length > 0);
        if (opts.length > 0) def.options = opts;
      }
      if (f.uniqueMobile === true) def.uniqueMobile = true;
      parsed.push(def);
    }
    if (parsed.length > 0) formFields = parsed;
  }

  return { enabled, title, description, formFields };
}