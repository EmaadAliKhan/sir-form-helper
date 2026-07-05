import type { AppSettings, FormPayload } from "./types";

export interface ParsedEciElectoralRecord {
  serial_no: string;
  epic: string;
  name: string;
  age: string;
  relative_name: string;
  state: string;
  district_code: string;
  district_name: string;
  ac_number: string;
  ac_name: string;
  part_no: string;
  part_name: string;
  polling_station: string;
  part_serial: string;
  warnings: string[];
}

export interface ParseEciElectoralPasteResult {
  records: ParsedEciElectoralRecord[];
  errors: string[];
}

const TELUGU_RE = /[\u0C00-\u0C7F]/;
const EPIC_RE = /^[A-Z]{3}\d{7}$/i;
const HEADER_RE =
  /s\.\s*no\.?\s*\t.*epic number|epic number\t.*name\t.*age|elector full name|relative full name|relative type/i;
const KNOWN_STATES = new Set([
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "delhi",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jammu and kashmir",
  "jharkhand",
  "karnataka",
  "kerala",
  "ladakh",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "west bengal",
]);

function isHeaderLine(line: string): boolean {
  if (EPIC_RE.test(line)) return false;
  return HEADER_RE.test(line);
}

function isViewDetails(value: string): boolean {
  return /^view details$/i.test(value.trim());
}

function parseNumberName(value: string): { number: string; name: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*-\s*(.*)$/);
  if (match) {
    return { number: match[1], name: match[2].trim() };
  }
  return { number: "", name: trimmed };
}

function isTeluguOnly(value: string): boolean {
  const trimmed = value.trim();
  if (!TELUGU_RE.test(trimmed)) return false;
  const latin = trimmed
    .replace(TELUGU_RE, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[.\s\-/]/g, "");
  return latin.length === 0;
}

function isAge(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return false;
  const n = Number(trimmed);
  return n >= 1 && n <= 120;
}

function isKnownState(value: string): boolean {
  return KNOWN_STATES.has(value.trim().toLowerCase());
}

function isLikelyAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || isViewDetails(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;
  return (
    trimmed.length > 24 ||
    /H\.?\s*No\.?|Superintendent|Circle|Balkampet|Road|Street|Colony|Hyderabad/i.test(trimmed) ||
    trimmed.startsWith(".") ||
    trimmed.includes(",")
  );
}

/** Drop Telugu duplicate prefix columns; keep English tabbed fields. */
function cleanPasteLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  const tabIdx = trimmed.indexOf("\t");
  if (tabIdx >= 0) {
    const before = trimmed.slice(0, tabIdx).trim();
    const after = trimmed.slice(tabIdx + 1).trim();
    if (TELUGU_RE.test(before)) {
      return after;
    }
  }

  if (isTeluguOnly(trimmed)) return "";

  return trimmed;
}

function looksLikeFieldContinuation(text: string): boolean {
  const t = text.trim();
  if (!t || isViewDetails(t)) return false;
  if (isAge(t) || isKnownState(t) || EPIC_RE.test(t) || /^\d+$/.test(t)) return false;
  if (parseNumberName(t).number || isLikelyAddress(t)) return false;
  return true;
}

function mergeTabFields(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    if (merged.length === 0) {
      merged.push(...parts);
      continue;
    }

    if (parts.length === 1 && looksLikeFieldContinuation(parts[0])) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${parts[0]}`.trim();
      continue;
    }

    merged.push(...parts);
  }

  return merged.filter((p) => p.length > 0);
}

function findEpicIndex(parts: string[]): number {
  return parts.findIndex((p) => EPIC_RE.test(p.trim()));
}

function sanitizeFields(parts: string[]): string[] {
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !isViewDetails(p) && !isTeluguOnly(p));
}

function buildRecord(parts: string[]): ParsedEciElectoralRecord | null {
  const fields = sanitizeFields(parts);
  const epicIdx = findEpicIndex(fields);
  if (epicIdx === -1) return null;

  const warnings: string[] = [];
  const hasLeadingSerial = epicIdx > 0 && /^\d+$/.test(fields[epicIdx - 1] ?? "");
  const list_serial = hasLeadingSerial ? fields[epicIdx - 1].trim() : "";
  const epic = fields[epicIdx].trim().toUpperCase();

  const tail = fields.slice(epicIdx + 1);
  if (tail.length === 0) return null;

  const name = tail[0]?.trim() ?? "";
  let cursor = 1;

  // Skip duplicate name tokens before age (Telugu lines already removed).
  while (
    cursor < tail.length &&
    !isAge(tail[cursor]) &&
    !parseNumberName(tail[cursor]).number &&
    !isKnownState(tail[cursor])
  ) {
    cursor++;
  }

  const age = cursor < tail.length && isAge(tail[cursor]) ? tail[cursor++].trim() : "";

  // ECI row order: Age → Relative name → State → numbered fields…
  let relative_name = "";
  if (
    cursor < tail.length &&
    !parseNumberName(tail[cursor]).number &&
    !isKnownState(tail[cursor]) &&
    !isLikelyAddress(tail[cursor])
  ) {
    relative_name = tail[cursor++].trim();
  }

  let state = "";
  if (cursor < tail.length && isKnownState(tail[cursor])) {
    state = tail[cursor++].trim();
  }

  const numbered: Array<{ number: string; name: string }> = [];
  while (cursor < tail.length) {
    const parsed = parseNumberName(tail[cursor]);
    if (!parsed.number) break;
    numbered.push(parsed);
    cursor++;
  }

  // ECI columns after State: District | Assembly Constituency | Part
  const district = numbered[0] ?? { number: "", name: "" };
  const ac = numbered[1] ?? { number: "", name: "" };
  const part = numbered[2] ?? { number: "", name: "" };

  const rest = tail.slice(cursor).filter((p) => !isViewDetails(p));
  const addressParts: string[] = [];
  const numericCandidates: string[] = [];

  for (const field of rest) {
    const trimmed = field.trim();
    if (/^\d+$/.test(trimmed)) {
      numericCandidates.push(trimmed);
      continue;
    }
    if (parseNumberName(trimmed).number) continue;
    if (isLikelyAddress(trimmed) || trimmed.includes("/")) {
      addressParts.push(trimmed);
    }
  }

  const part_serial = numericCandidates.at(-1) ?? "";
  const polling_station = addressParts.join(", ").trim();

  if (!name) warnings.push("Elector name missing.");
  if (!relative_name) warnings.push("Relative name missing.");
  if (!part_serial) warnings.push("Part serial number missing.");
  if (!ac.number) warnings.push("Assembly constituency number could not be parsed.");
  if (!part.number) warnings.push("Part / booth number could not be parsed.");

  return {
    serial_no: list_serial,
    epic,
    name,
    age,
    relative_name,
    state,
    district_code: district.number,
    district_name: district.name,
    ac_number: ac.number,
    ac_name: ac.name,
    part_no: part.number,
    part_name: part.name,
    polling_station,
    part_serial,
    warnings,
  };
}

function splitIntoRecordBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const cleaned = cleanPasteLine(line);
    if (!cleaned) continue;

    const epicInLine = cleaned.split("\t").some((p) => EPIC_RE.test(p.trim()));
    if (epicInLine && current.length > 0) {
      blocks.push(current);
      current = [cleaned];
      continue;
    }

    current.push(cleaned);
  }

  if (current.length) blocks.push(current);
  return blocks;
}

export function parseEciElectoralPaste(input: string): ParseEciElectoralPasteResult {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return {
      records: [],
      errors: ["Nothing pasted — copy a row from electoralsearch.eci.gov.in first."],
    };
  }

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isHeaderLine(l));

  if (lines.length === 0) {
    return { records: [], errors: ["No data rows found — header row only, or unrecognized format."] };
  }

  const blocks = splitIntoRecordBlocks(lines);
  const records: ParsedEciElectoralRecord[] = [];
  const errors: string[] = [];

  for (const block of blocks) {
    const parts = mergeTabFields(block);
    const record = buildRecord(parts);
    if (record) {
      records.push(record);
    } else {
      const preview = block.join(" / ").slice(0, 80);
      errors.push(`Could not parse: "${preview}${preview.length >= 80 ? "…" : ""}"`);
    }
  }

  if (records.length === 0 && errors.length === 0) {
    errors.push(
      "Could not recognize pasted format. Copy one or more rows from electoralsearch.eci.gov.in (Search by EPIC → View Details)."
    );
  }

  return { records, errors };
}

export function defaultPayloadFromEciElectoral(
  record: ParsedEciElectoralRecord,
  settings: AppSettings
): FormPayload {
  const boothKey = record.part_no || "0";
  const blo = settings.blo_by_booth[boothKey] ?? { name: "", contact: "" };

  return {
    form_kind: "enumeration",
    elector_name: record.name,
    epic: record.epic,
    serial_no: record.part_serial,
    part_no: record.part_no,
    house_no: "",
    relative_name_from_2025: record.relative_name,
    ac_name_2025: record.ac_name || settings.ac_name_2025,
    ac_no_2025: record.ac_number || settings.ac_no_2025,
    state_2025: record.state || settings.state_2025,
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

export function formatEciElectoralSummary(record: ParsedEciElectoralRecord): string {
  const parts = [
    record.epic,
    record.name || "(no name)",
    record.relative_name ? `rel: ${record.relative_name}` : null,
    record.district_code && record.district_name
      ? `Dist ${record.district_code} ${record.district_name}`
      : null,
    record.ac_number && record.ac_name ? `AC ${record.ac_number} ${record.ac_name}` : null,
    record.part_no ? `Part ${record.part_no}` : null,
    record.part_serial ? `Sr ${record.part_serial}` : "Sr —",
  ].filter(Boolean);
  return parts.join(" · ");
}
