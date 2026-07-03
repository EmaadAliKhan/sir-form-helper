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

function isSerialLine(line: string): boolean {
  return /^\d+$/.test(line.trim());
}

function extractEpic(value: string): string | null {
  const trimmed = value.trim().toUpperCase();
  if (EPIC_RE.test(trimmed)) return trimmed;
  return null;
}

function isDataLine(line: string): boolean {
  const parts = line.split("\t").map((p) => p.trim());
  if (parts.length < 6) return false;
  if (isRelation(parts[0])) return true;
  if (parts.length >= 7 && isRelation(parts[3])) return true;
  return isRelation(parts[0]) && /^\d+$/.test(parts[1] ?? "");
}

function parseNumberName(value: string): { number: string; name: string } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+)\s*-\s*(.*)$/);
  if (match) {
    return { number: match[1], name: match[2].trim() };
  }
  return { number: "", name: trimmed };
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

function buildRecord(
  elector: string,
  relative: string,
  dataParts: string[],
  serialNo?: string,
  epic = ""
): ParsedEciSirRecord | null {
  if (dataParts.length < 6) return null;

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

  const relationship = String(normalizeEciRelationship(parts[0] ?? ""));
  const age = parts[1]?.trim() || undefined;
  const state = parts[2]?.trim() ?? "";
  const districtResult = translateEciDistrict(parts[3] ?? "");
  if (districtResult.warning) warnings.push(districtResult.warning);
  if (!districtResult.district) {
    warnings.push("District is required — fill it in the form before generating the PDF.");
  }

  const ac = parseNumberName(parts[4] ?? "");
  const ps = parseNumberName(parts[5] ?? "");
  const sr_no = parts[6]?.trim() ?? "";

  if (!sr_no) warnings.push("Part Serial No. missing — Sr No left blank.");
  if (!elector) warnings.push("Elector name missing.");
  if (!relative) warnings.push("Relative name missing.");
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
    district: districtResult.district,
    ac_number: ac.number,
    ac_name: ac.name,
    part_no: ps.number,
    sr_no,
    warnings,
  };
}

function parseFullTabRow(line: string): ParsedEciSirRecord | null {
  const parts = line.split("\t").map((p) => p.trim());
  if (parts.length < 9) return null;

  let epic = "";
  let dataStart = 3;
  const epicAt3 = extractEpic(parts[3] ?? "");
  if (epicAt3) {
    epic = epicAt3;
    dataStart = 4;
  }

  return buildRecord(parts[1], parts[2], parts.slice(dataStart), parts[0], epic);
}

function parseChunk(lines: string[]): ParsedEciSirRecord | null {
  if (lines.length === 1) {
    const line = lines[0];
    const tabCount = line.split("\t").length;
    if (tabCount >= 9) return parseFullTabRow(line);
    if (tabCount >= 6 && isRelation(line.split("\t")[0]?.trim() ?? "")) {
      return buildRecord("", "", line.split("\t").map((p) => p.trim()));
    }
  }

  let idx = 0;
  let serialNo: string | undefined;
  if (isSerialLine(lines[0])) {
    serialNo = lines[0].trim();
    idx = 1;
  }

  const dataIdx = lines.findIndex((line, i) => i >= idx && isDataLine(line));
  if (dataIdx === -1) return null;

  const preDataLines = lines.slice(idx, dataIdx);
  let epic = "";
  const nameLines: string[] = [];
  for (const line of preDataLines) {
    const found = extractEpic(line);
    if (found && line.trim().toUpperCase() === found) {
      epic = found;
    } else {
      nameLines.push(line);
    }
  }

  const elector = nameLines[0] ?? "";
  const relative = nameLines[1] ?? "";
  const dataParts = lines[dataIdx].split("\t").map((p) => p.trim());

  return buildRecord(elector, relative, dataParts, serialNo, epic);
}

function splitRecordChunks(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const tabCount = line.split("\t").length;

    if (tabCount >= 9) {
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
