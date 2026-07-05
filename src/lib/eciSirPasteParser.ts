import {
  normalizeEciRelationship,
  TELANGANA_DISTRICTS,
  type Manual2002Block,
} from "./types";

export interface ParsedEciSirRecord {
  serialNo?: string;
  name: string;
  epic: string;
  relative_name: string;
  relationship: string;
  age?: string;
  state: string;
  district: string;
  ac_number: string;
  ac_name: string;
  part_no: string;
  sr_no: string;
  warnings: string[];
}

export interface ParseEciSirPasteResult {
  records: ParsedEciSirRecord[];
  errors: string[];
}

const RELATION_RE = /^(father|mother|husband|other|wife|son|daughter)$/i;
/** Standard EPIC (ABC1234567) and variants e.g. AP412120156480 from SIR portal */
const EPIC_RE = /^[A-Z]{2,3}\d{7,12}$/i;
const HEADER_RE =
  /elector full name|relative full name|relative type|polling station|part serial|s\.\s*no/i;
const REGIONAL_SCRIPT_RE =
  /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;
const KNOWN_STATES = new Set([
  "telangana",
  "andhra pradesh",
  "karnataka",
  "maharashtra",
  "tamil nadu",
]);

const TELUGU_DISTRICT_MAP: Record<string, string> = {
  "హైదరాబాద్": "Hyderabad",
  "హైదరాబాద": "Hyderabad",
  "రంగారెడ్డి": "Rangareddy",
  "మేడ్చల్-మల్కాజ్గిరి": "Medchal-Malkajgiri",
  "మేడ్చల్ మల్కాజ్గిరి": "Medchal-Malkajgiri",
  "అదిలాబాద్": "Adilabad",
  "భద్రాద్రి కొత్తగూడెం": "Bhadradri Kothagudem",
  "హనుమకొండ": "Hanumakonda",
  "జగిత్యాల": "Jagtial",
  "జనగామ": "Jangaon",
  "జయశంకర్ భూపాలపల్లి": "Jayashankar Bhupalpally",
  "జోగులాంబ గద్వాల": "Jogulamba Gadwal",
  "కామారెడ్డి": "Kamareddy",
  "కరీంనగర్": "Karimnagar",
  "ఖమ్మం": "Khammam",
  "కుమ్రం భీం": "Kumuram Bheem",
  "మహబూబాబాద్": "Mahabubabad",
  "మహబూబ్నగర్": "Mahabubnagar",
  "మంచిర్యాల": "Mancherial",
  "మెదక్": "Medak",
  "ములుగు": "Mulugu",
  "నాగర్ కర్నూల్": "Nagarkurnool",
  "నలగొండా": "Nalgonda",
  "నిర్మల్": "Nirmal",
  "నిజామాబాద్": "Nizamabad",
  "పెద్దపల్లి": "Peddapalli",
  "పెద్దపిల్లి": "Peddapalli",
  "రాజన్న సిరిసిల్ల": "Rajanna Sircilla",
  "సంగారెడ్డి": "Sangareddy",
  "సిద్దిపేట": "Siddipet",
  "సూర్యాపేట": "Suryapet",
  "వికారాబాద్": "Vikarabad",
  "వనపర్తి": "Wanaparthy",
  "వరంగల్": "Warangal",
  "యాదాద్రి భువనగిరి": "Yadadri Bhuvanagiri",
  "నారాయణ్పేట్": "Narayanpet",
};

function isHeaderLine(line: string): boolean {
  return HEADER_RE.test(line);
}

function isRelation(value: string): boolean {
  return RELATION_RE.test(value.trim());
}

function isSerialToken(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function isSerialLine(line: string): boolean {
  const trimmed = line.trim();
  if (isSerialToken(trimmed)) return true;
  const first = trimmed.split("\t")[0]?.trim() ?? "";
  return isSerialToken(first) && trimmed.split("\t").filter(Boolean).length <= 2;
}

function extractEpic(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (EPIC_RE.test(trimmed)) return trimmed;
  return null;
}

function parseNumberName(value: string): { number: string; name: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*-\s*(.*)$/);
  if (match) {
    return { number: match[1], name: match[2].trim() };
  }
  return { number: "", name: trimmed };
}

function splitFields(line: string): string[] {
  return line
    .split("\t")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function isKnownState(value: string): boolean {
  return KNOWN_STATES.has(value.trim().toLowerCase());
}

function isDataLine(line: string): boolean {
  const parts = splitFields(line);
  if (parts.length < 6) return false;
  if (isRelation(parts[0])) return true;
  if (parts.length >= 7 && isRelation(parts[3])) return true;
  const stateIdx = parts.findIndex((p) => isKnownState(p));
  if (stateIdx >= 0 && stateIdx <= 4 && parts.length >= stateIdx + 4) {
    return isRelation(parts[0]) || (stateIdx === 2 && isRelation(parts[0]));
  }
  return false;
}

function isFullTabRow(line: string): boolean {
  const parts = splitFields(line);
  if (parts.length < 8) return false;
  if (isRelation(parts[0]) || isRelation(parts[3])) return true;
  if (parts.length >= 9 && isRelation(parts[3])) return true;
  if (parts.length >= 10 && isRelation(parts[3])) return true;
  const relationIdx = parts.findIndex((p) => isRelation(p));
  return relationIdx >= 0 && relationIdx <= 4 && parts.length >= relationIdx + 6;
}

export function translateEciDistrict(raw: string): { district: string; warning?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { district: "" };

  const mapped = TELUGU_DISTRICT_MAP[trimmed];
  if (mapped) return { district: mapped };

  if (!REGIONAL_SCRIPT_RE.test(trimmed)) {
    const match = TELANGANA_DISTRICTS.find(
      (d) => d.toLowerCase() === trimmed.toLowerCase()
    );
    return { district: match ?? trimmed };
  }

  return {
    district: "",
    warning:
      "District name is in a regional script we could not translate — please select or type the English district name in the form.",
  };
}

function parseSirDataParts(parts: string[]): {
  relationship: string;
  age?: string;
  state: string;
  districtRaw: string;
  acRaw: string;
  psRaw: string;
  sr_no: string;
} | null {
  if (parts.length < 6) return null;

  const relationship = String(normalizeEciRelationship(parts[0] ?? ""));
  const age = parts[1]?.trim() || undefined;
  const state = parts[2]?.trim() ?? "";

  let districtRaw = "";
  let acRaw = "";
  let psRaw = "";
  let sr_no = "";

  if (parts.length >= 7) {
    districtRaw = parts[3] ?? "";
    acRaw = parts[4] ?? "";
    psRaw = parts[5] ?? "";
    sr_no = parts[6]?.trim() ?? "";
  } else if (parseNumberName(parts[3] ?? "").number) {
    acRaw = parts[3] ?? "";
    psRaw = parts[4] ?? "";
    sr_no = parts[5]?.trim() ?? "";
  } else {
    districtRaw = parts[3] ?? "";
    acRaw = parts[4] ?? "";
    psRaw = parts[5] ?? "";
  }

  return { relationship, age, state, districtRaw, acRaw, psRaw, sr_no };
}

function buildRecord(
  elector: string,
  relative: string,
  dataParts: string[],
  serialNo?: string,
  epic = ""
): ParsedEciSirRecord | null {
  const warnings: string[] = [];
  let parts = [...dataParts];
  let epicNo = epic;

  if (!epicNo) {
    const epicIdx = parts.findIndex((p) => extractEpic(p));
    if (epicIdx >= 0) {
      epicNo = extractEpic(parts[epicIdx]) ?? "";
      parts = parts.filter((_, i) => i !== epicIdx);
    }
  }

  const parsed = parseSirDataParts(parts);
  if (!parsed) return null;

  const { relationship, age, state, districtRaw, acRaw, psRaw, sr_no } = parsed;
  const districtResult = translateEciDistrict(districtRaw);
  if (districtResult.warning) warnings.push(districtResult.warning);
  if (!districtResult.district && districtRaw) {
    warnings.push("District is required — fill it in the form before generating the PDF.");
  } else if (!districtResult.district && !districtRaw) {
    warnings.push("District not in paste — defaulting to Hyderabad if available in form.");
  }

  const ac = parseNumberName(acRaw);
  const ps = parseNumberName(psRaw);

  if (!sr_no) warnings.push("Part Serial No. missing — Sr No left blank.");
  if (!elector.trim()) warnings.push("Elector name missing.");
  if (!relative.trim() && relationship) {
    warnings.push("Relative name missing.");
  } else if (!relative.trim()) {
    warnings.push("Relative name missing.");
  }
  if (!relationship) warnings.push("Relationship missing or unrecognized.");
  if (!ac.number) warnings.push("AC number could not be parsed.");
  if (!ps.number) warnings.push("Polling station / Part No could not be parsed.");

  return {
    serialNo,
    name: elector.trim(),
    epic: epicNo,
    relative_name: relative.trim(),
    relationship,
    age,
    state,
    district: districtResult.district || (districtRaw ? "" : "Hyderabad"),
    ac_number: ac.number,
    ac_name: ac.name,
    part_no: ps.number,
    sr_no,
    warnings,
  };
}

function parseNameSection(
  lines: string[],
  serialFromChunk?: string
): { serialNo?: string; elector: string; relative: string; epic: string } {
  let serialNo = serialFromChunk;
  let elector = "";
  let relative = "";
  let epic = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.includes("\t")) {
      const parts = splitFields(trimmed);
      let idx = 0;

      if (!serialNo && parts.length > 0 && isSerialToken(parts[0])) {
        serialNo = parts[0];
        idx = 1;
      }

      const nameParts: string[] = [];
      for (let i = idx; i < parts.length; i++) {
        const part = parts[i];
        const foundEpic = extractEpic(part);
        if (foundEpic) {
          epic = foundEpic;
          continue;
        }
        if (isRelation(part) || isKnownState(part) || isSerialToken(part)) break;
        nameParts.push(part);
      }

      if (!elector && nameParts[0]) elector = nameParts[0];
      if (!relative && nameParts[1]) relative = nameParts[1];
      continue;
    }

    const foundEpic = extractEpic(trimmed);
    if (foundEpic && trimmed.toUpperCase() === foundEpic) {
      epic = foundEpic;
      continue;
    }

    if (!elector) elector = trimmed;
    else if (!relative) relative = trimmed;
  }

  return { serialNo, elector, relative, epic };
}

function parseFullTabRow(line: string): ParsedEciSirRecord | null {
  const parts = splitFields(line);
  if (parts.length < 8) return null;

  let serialNo: string | undefined;
  let elector = "";
  let relative = "";
  let epic = "";
  let dataStart = 0;

  if (isSerialToken(parts[0])) {
    serialNo = parts[0];
    dataStart = 1;
  }

  const relationIdx = parts.findIndex((p, i) => i >= dataStart && isRelation(p));
  if (relationIdx < 0) return null;

  const nameParts = parts.slice(dataStart, relationIdx).filter((p) => !extractEpic(p));
  for (const part of parts.slice(dataStart, relationIdx)) {
    const found = extractEpic(part);
    if (found) epic = found;
  }

  elector = nameParts[0] ?? "";
  relative = nameParts[1] ?? "";
  const dataParts = parts.slice(relationIdx);

  return buildRecord(elector, relative, dataParts, serialNo, epic);
}

function parseChunk(lines: string[]): ParsedEciSirRecord | null {
  if (lines.length === 1) {
    const line = lines[0];
    if (isFullTabRow(line)) return parseFullTabRow(line);
    const parts = splitFields(line);
    if (parts.length >= 6 && isRelation(parts[0])) {
      return buildRecord("", "", parts);
    }
  }

  let idx = 0;
  let serialNo: string | undefined;
  if (isSerialLine(lines[0])) {
    const firstParts = splitFields(lines[0]);
    serialNo = firstParts[0];
    idx = firstParts.length > 1 ? 0 : 1;
  }

  const dataIdx = lines.findIndex((line, i) => i >= idx && isDataLine(line));
  if (dataIdx === -1) {
    if (lines.length === 1 && isFullTabRow(lines[0])) return parseFullTabRow(lines[0]);
    return null;
  }

  const preDataLines = lines.slice(idx, dataIdx);
  const { serialNo: parsedSerial, elector, relative, epic } = parseNameSection(
    preDataLines,
    serialNo
  );
  const dataParts = splitFields(lines[dataIdx]);

  return buildRecord(elector, relative, dataParts, parsedSerial ?? serialNo, epic);
}

function splitRecordChunks(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (isFullTabRow(line)) {
      if (current.length) {
        chunks.push(current);
        current = [];
      }
      chunks.push([line]);
      continue;
    }

    if (isSerialLine(line) && current.length > 0) {
      chunks.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length) chunks.push(current);
  return chunks;
}

export function parseEciSirPaste(input: string): ParseEciSirPasteResult {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return { records: [], errors: ["Nothing pasted — copy a row from the ECI SIR portal first."] };
  }

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !isHeaderLine(l));

  if (lines.length === 0) {
    return { records: [], errors: ["No data rows found — header row only, or unrecognized format."] };
  }

  const chunks = splitRecordChunks(lines);
  const records: ParsedEciSirRecord[] = [];
  const errors: string[] = [];

  for (const chunk of chunks) {
    const record = parseChunk(chunk);
    if (record) {
      records.push(record);
    } else {
      const preview = chunk.join(" / ").slice(0, 80);
      errors.push(`Could not parse: "${preview}${preview.length >= 80 ? "…" : ""}"`);
    }
  }

  if (records.length === 0 && errors.length === 0) {
    errors.push("Could not recognize pasted format. Copy one or more rows from voters.eci.gov.in SIR search.");
  }

  return { records, errors };
}

export function manualBlockFromParsed(record: ParsedEciSirRecord): Manual2002Block {
  return {
    name: record.name,
    epic: record.epic,
    relative_name: record.relative_name,
    relationship: record.relationship,
    district: record.district,
    state: record.state,
    ac_name: record.ac_name,
    ac_number: record.ac_number,
    part_no: record.part_no,
    sr_no: record.sr_no,
  };
}

export function formatParsedRecordSummary(record: ParsedEciSirRecord): string {
  const parts = [
    record.name || "(no name)",
    record.epic ? `EPIC ${record.epic}` : null,
    record.relative_name ? `rel: ${record.relative_name}` : null,
    record.relationship || null,
    record.ac_number && record.ac_name ? `AC ${record.ac_number} ${record.ac_name}` : null,
    record.part_no ? `PS ${record.part_no}` : null,
    record.sr_no ? `Sr ${record.sr_no}` : "Sr —",
  ].filter(Boolean);
  return parts.join(" · ");
}
