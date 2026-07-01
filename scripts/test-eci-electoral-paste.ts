import {
  defaultPayloadFromEciElectoral,
  parseEciElectoralPaste,
} from "../src/lib/eciElectoralPasteParser.ts";
import { DEFAULT_SETTINGS } from "../src/lib/types.ts";

const teluguName = "ఆర్.భాగ్యఅమ్మ ఆర్";
const teluguRelative = "ఆర్.ఆగాస్వామి ఆర్";

const samples = [
  `1	BYX1772995	Rbhagayamma R
${teluguName}	65	Ragaswami R
${teluguRelative}	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	17`,

  `S. NO.	Epic Number	Name	Age	Relative Name	State	District	Assembly Constituency	Part	Polling Station	Part Serial Number	Action
1	BYX1772995	Rbhagayamma R
${teluguName}	65	Ragaswami R
${teluguRelative}	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	17	View Details`,

  `1	BYX1772995	Rbhagayamma R	65	Ragaswami R	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	17`,

  `1	BYX4047411	Bhaskra Reddy M
భాస్క్ర రెడ్డి ఎం	40	Appi Reddy M
అప్పి రెడ్డి ఎం	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	98	View Details`,
];

for (let i = 0; i < samples.length; i++) {
  const r = parseEciElectoralPaste(samples[i]);
  console.log(`Sample ${i + 1}:`, r.records.length, "records", r.errors);
  for (const rec of r.records) {
    console.log(
      " ",
      rec.epic,
      rec.name,
      rec.relative_name,
      rec.ac_number,
      rec.ac_name,
      rec.part_no,
      rec.part_serial,
      rec.warnings
    );
  }
}

const bhaskra = parseEciElectoralPaste(samples[samples.length - 1]).records[0];
if (bhaskra) {
  const payload = defaultPayloadFromEciElectoral(bhaskra, DEFAULT_SETTINGS);
  console.log("House no empty:", payload.house_no === "");
  console.log("  house_no:", JSON.stringify(payload.house_no));
  console.log("  EPIC:", payload.epic, "Sr:", payload.serial_no);
}
