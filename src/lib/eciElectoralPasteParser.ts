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

function isHeaderLine(line: string): boolean {
  if (EPIC_RE.test(line)) return false;
  return HEADER_RE.test(line);
}

function parseNumberName(value: string): { number: string; name: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*-\s*(.*)$/);
  if (match) {
    return { number: match[1], name: match[2].trim() };
  }
  return { number: "", name: trimmed };
}

/** Drop Telugu duplicate lines; keep English tabbed fields. */
function cleanPasteLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "";

  const tabIdx = trimmed.indexOf("\t");
  if (tabIdx >= 0) {
    const before = trimmed.slice(0, tabIdx).trim();
    const after = trimmed.slice(tabIdx + 1);
    const beforeLatin = before.replace(TELUGU_RE, "").replace(/[^\x00-\x7F]/g, "").trim();
    if (TELUGU_RE.test(before) && beforeLatin.length < 2) {
      return after.trim();
    }
  }

  if (TELUGU_RE.test(trimmed)) {
    const latin = trimmed.replace(TELUGU_RE, "").replace(/[^\x00-\x7F]/g, "").trim();
    if (latin.length < 2) return "";
  }

  return trimmed;
}

function mergeTabFields(lines: string[]): string[] {
  const merged: string[] = [];

  for (const line of lines) {
    const parts = line.split("\t").map((p) => p.trim());
    if (merged.length === 0) {
      merged.push(...parts);
      continue;
    }

    if (parts.length === 1 && merged.length > 0) {
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

function buildRecord(parts: string[]): ParsedEciElectoralRecord | null {
  const epicIdx = findEpicIndex(parts);
  if (epicIdx === -1) return null;

  const warnings: string[] = [];
  const hasLeadingSerial =
    epicIdx > 0 && /^\d+$/.test(parts[epicIdx - 1]?.trim() ?? "");

  const serial_no = hasLeadingSerial ? parts[epicIdx - 1].trim() : "";
  const epic = parts[epicIdx].trim().toUpperCase();
  const name = parts[epicIdx + 1]?.trim() ?? "";
  const age = parts[epicIdx + 2]?.trim() ?? "";
  const relative_name = parts[epicIdx + 3]?.trim() ?? "";
  const state = parts[epicIdx + 4]?.trim() ?? "";
  const district = parseNumberName(parts[epicIdx + 5] ?? "");
  const ac = parseNumberName(parts[epicIdx + 6] ?? "");
  const part = parseNumberName(parts[epicIdx + 7] ?? "");
  const polling_station = (parts[epicIdx + 8]?.trim() ?? "").replace(/\s*view details\s*$/i, "");
  const part_serial = (parts[epicIdx + 9]?.trim() ?? "").replace(/\s*view details\s*$/i, "");

  if (!name) warnings.push("Elector name missing.");
  if (!relative_name) warnings.push("Relative name missing.");
  if (!part_serial) warnings.push("Part serial number missing.");
  if (!ac.number) warnings.push("Assembly constituency number could not be parsed.");
  if (!part.number) warnings.push("Part number could not be parsed.");

  return {
    serial_no,
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
    record.ac_number && record.ac_name ? `AC ${record.ac_number} ${record.ac_name}` : null,
    record.part_no ? `Part ${record.part_no}` : null,
    record.part_serial ? `Sr ${record.part_serial}` : "Sr —",
  ].filter(Boolean);
  return parts.join(" · ");
}
