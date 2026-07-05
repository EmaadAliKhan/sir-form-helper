export interface Voter2025 {
  id: number;
  booth_no: number;
  serial_no: number;
  epic: string;
  name: string;
  relation_type: string;
  relative_name: string;
  house_no: string;
  age: number;
  gender: string;
  source_pdf: string;
  source_page: number;
}

export interface Voter2002 {
  id: number;
  ps_no: number;
  sl_no: number;
  section_no: number;
  house_no: string;
  elector_name: string;
  rln_type: string;
  relation_name: string;
  gender: string;
  age: number;
  epic_no: string;
}

export interface Manual2002Block {
  name: string;
  epic: string;
  relative_name: string;
  relationship: string;
  district: string;
  state: string;
  ac_name: string;
  ac_number: string;
  part_no: string;
  sr_no: string;
}

export type FormKind = "enumeration" | "declaration";

export interface FormPayload {
  /** enumeration = started from 2025 roll / ECI paste; declaration = no voter selected */
  form_kind: FormKind;
  elector_name: string;
  epic: string;
  serial_no: string;
  part_no: string;
  house_no: string;
  relative_name_from_2025: string;
  ac_name_2025: string;
  ac_no_2025: string;
  state_2025: string;
  blo_name: string;
  blo_contact: string;
  was_in_2002: boolean;
  linked_2002_id: number | null;
  manual_2002: Manual2002Block | null;
  dob: string;
  aadhaar: string;
  show_full_aadhaar: boolean;
  mobile: string;
  father_name: string;
  father_epic: string;
  mother_name: string;
  mother_epic: string;
  spouse_name: string;
  spouse_epic: string;
}

export interface FormRecord {
  id: string;
  voter_2025_epic: string;
  voter_2025_name: string;
  booth_no: number;
  payload: FormPayload;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  ac_name_2025: string;
  ac_no_2025: string;
  state_2025: string;
  ac_name_2002: string;
  ac_no_2002: string;
  district_2002: string;
  state_2002: string;
  ac_name_options: string[];
  district_options: string[];
  state_options: string[];
  blo_by_booth: Record<string, { name: string; contact: string }>;
  mask_aadhaar_default: boolean;
  /** Show the local 2025 voter-list search on the home page. */
  show_2025_search: boolean;
}

/** ECI Form 6 / electoral roll relative types (Father, Mother, Husband, Other). */
export const ECI_RELATIONSHIP_OPTIONS = ["Father", "Mother", "Husband", "Other"] as const;

export type EciRelationship = (typeof ECI_RELATIONSHIP_OPTIONS)[number];

/** All 33 districts of Telangana (official state portal). */
export const TELANGANA_DISTRICTS = [
  "Adilabad",
  "Bhadradri Kothagudem",
  "Hanumakonda",
  "Hyderabad",
  "Jagtial",
  "Jangaon",
  "Jayashankar Bhupalpally",
  "Jogulamba Gadwal",
  "Kamareddy",
  "Karimnagar",
  "Khammam",
  "Kumuram Bheem",
  "Mahabubabad",
  "Mahabubnagar",
  "Mancherial",
  "Medak",
  "Medchal-Malkajgiri",
  "Mulugu",
  "Nagarkurnool",
  "Nalgonda",
  "Narayanpet",
  "Nirmal",
  "Nizamabad",
  "Peddapalli",
  "Rajanna Sircilla",
  "Rangareddy",
  "Sangareddy",
  "Siddipet",
  "Suryapet",
  "Vikarabad",
  "Wanaparthy",
  "Warangal",
  "Yadadri Bhuvanagiri",
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  ac_name_2025: "Sanathnagar",
  ac_no_2025: "62",
  state_2025: "Telangana",
  ac_name_2002: "Sanathnagar",
  ac_no_2002: "208",
  district_2002: "Hyderabad",
  state_2002: "Telangana",
  ac_name_options: ["Sanathnagar", "Nampally", "Khairatabad", "Secunderabad"],
  district_options: [...TELANGANA_DISTRICTS],
  state_options: ["Telangana", "Andhra Pradesh"],
  blo_by_booth: {},
  mask_aadhaar_default: false,
  show_2025_search: false,
};

export function normalizeEciRelationship(value: string): EciRelationship | string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const byCode: Record<string, EciRelationship> = {
    H: "Husband",
    F: "Father",
    M: "Mother",
    O: "Other",
    W: "Other",
    S: "Other",
    D: "Other",
  };
  const code = byCode[trimmed.toUpperCase()];
  if (code) return code;

  const byName: Record<string, EciRelationship> = {
    father: "Father",
    mother: "Mother",
    husband: "Husband",
    other: "Other",
    wife: "Other",
    son: "Other",
    daughter: "Other",
    "legal guardian": "Other",
    guardian: "Other",
  };
  const named = byName[trimmed.toLowerCase()];
  if (named) return named;

  if ((ECI_RELATIONSHIP_OPTIONS as readonly string[]).includes(trimmed)) {
    return trimmed as EciRelationship;
  }

  return trimmed;
}

export function expandRelationType(code: string): string {
  return String(normalizeEciRelationship(code));
}

export function mergeDistrictOptions(settings: AppSettings): string[] {
  return [...new Set([...TELANGANA_DISTRICTS, ...settings.district_options])];
}

export function maskAadhaar(aadhaar: string, showFull: boolean): string {
  const digits = aadhaar.replace(/\D/g, "");
  if (!digits) return "";
  if (showFull) return digits;
  if (digits.length <= 4) return digits;
  return "X".repeat(digits.length - 4) + digits.slice(-4);
}

export function defaultPayloadFromVoter(
  voter: Voter2025,
  settings: AppSettings
): FormPayload {
  const boothKey = String(voter.booth_no);
  const blo = settings.blo_by_booth[boothKey] ?? { name: "", contact: "" };

  return {
    form_kind: "enumeration",
    elector_name: voter.name,
    epic: voter.epic,
    serial_no: String(voter.serial_no),
    part_no: String(voter.booth_no),
    house_no: "",
    relative_name_from_2025: voter.relative_name ?? "",
    ac_name_2025: settings.ac_name_2025,
    ac_no_2025: settings.ac_no_2025,
    state_2025: settings.state_2025,
    blo_name: blo.name,
    blo_contact: blo.contact,
    was_in_2002: true,
    linked_2002_id: null,
    manual_2002: null,
    dob: "",
    aadhaar: "",
    show_full_aadhaar: true,
    mobile: "",
    father_name: "",
    father_epic: "",
    mother_name: "",
    mother_epic: "",
    spouse_name: "",
    spouse_epic: "",
  };
}

export function defaultDeclarationPayload(settings: AppSettings): FormPayload {
  return {
    form_kind: "declaration",
    elector_name: "",
    epic: "",
    serial_no: "",
    part_no: "",
    house_no: "",
    relative_name_from_2025: "",
    ac_name_2025: settings.ac_name_2025,
    ac_no_2025: settings.ac_no_2025,
    state_2025: settings.state_2025,
    blo_name: "",
    blo_contact: "",
    was_in_2002: true,
    linked_2002_id: null,
    manual_2002: null,
    dob: "",
    aadhaar: "",
    show_full_aadhaar: true,
    mobile: "",
    father_name: "",
    father_epic: "",
    mother_name: "",
    mother_epic: "",
    spouse_name: "",
    spouse_epic: "",
  };
}

export function normalizeFormPayload(payload: FormPayload): FormPayload {
  return {
    ...payload,
    form_kind: payload.form_kind ?? "enumeration",
  };
}

export function voter2002ToManualBlock(
  voter: Voter2002,
  settings: AppSettings
): Manual2002Block {
  return {
    name: voter.elector_name,
    epic: voter.epic_no ?? "",
    relative_name: voter.relation_name ?? "",
    relationship: expandRelationType(voter.rln_type),
    district: settings.district_2002,
    state: settings.state_2002,
    ac_name: settings.ac_name_2002,
    ac_number: settings.ac_no_2002,
    part_no: String(voter.ps_no),
    sr_no: String(voter.sl_no),
  };
}
