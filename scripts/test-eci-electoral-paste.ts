import {
  defaultPayloadFromEciElectoral,
  parseEciElectoralPaste,
} from "../src/lib/eciElectoralPasteParser.ts";
import { DEFAULT_SETTINGS } from "../src/lib/types.ts";

const kapila = `1	NVR1499151	Kapila Lakshmi Prabha
కపిల లక్ష్మి ప్రభ	54	Kapila Narasimha Rao
కపిల నరసింహ రావు	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	1095	View Details`;

const venketa = `1	WKH1726472	Venketa Rami Reddy Khamjula
వెంకేత రామి రెడ్డి ఖమజూల	54	Konda Reddy Khamjula
కొండా రెడ్డి ఖమజూల	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	1084	View Details`;

const bdavid = `1	BYX1773399	Bdavid Prabhakar B
బి.దావీద్ ప్రభాకర్ బి	50	Bsrao B
బి.యస్.రావు బి	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	1105	View Details`;

const singleLine = `1	NVR1499151	Kapila Lakshmi Prabha	54	Kapila Narasimha Rao	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	1095`;

const bothRecords = `${kapila}\n\n${venketa}`;

const samples = [kapila, venketa, bdavid, singleLine, bothRecords];

function showPayload(label: string, paste: string) {
  const r = parseEciElectoralPaste(paste);
  console.log(`\n=== ${label} === (${r.records.length} records, ${r.errors.length} errors)`);
  if (r.errors.length) console.log(" errors:", r.errors);
  for (const rec of r.records) {
    const payload = defaultPayloadFromEciElectoral(rec, DEFAULT_SETTINGS);
    console.log(
      rec.epic,
      "| name:", rec.name,
      "| rel:", rec.relative_name,
      "| state:", rec.state,
      "| dist:", rec.district_code, rec.district_name,
      "| AC:", rec.ac_number, rec.ac_name,
      "| part:", rec.part_no, rec.part_name,
      "| sr:", rec.part_serial,
      rec.warnings.length ? rec.warnings : ""
    );
    console.log(
      "  -> form:",
      "serial", payload.serial_no,
      "part", payload.part_no,
      "ac", payload.ac_no_2025, payload.ac_name_2025,
      "state", payload.state_2025
    );
    const ok =
      rec.name &&
      rec.relative_name &&
      rec.state === "Telangana" &&
      rec.district_code === "17" &&
      rec.ac_number === "62" &&
      rec.ac_name === "Sanathnagar" &&
      rec.part_no === "150";
    if (!ok) console.log("  !! unexpected parse", rec);
  }
}

for (const [i, sample] of samples.entries()) {
  showPayload(`Sample ${i + 1}`, sample);
}
