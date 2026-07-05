import {
  defaultPayloadFromEciElectoral,
  parseEciElectoralPaste,
} from "../src/lib/eciElectoralPasteParser.ts";
import { DEFAULT_SETTINGS } from "../src/lib/types.ts";

const userPaste = `1	BYX1773399	Bdavid Prabhakar B
బి.దావీద్ ప్రభాకర్ బి	50	Bsrao B
బి.యస్.రావు బి	Telangana	17-Hyderabad	62-Sanathnagar	150-Balkampet	.O/O Superintendentending Engineer (R & B) Rural Circle, H.No. 7-1-215, Balkampet, Hyderabad	1105	View Details`;

const teluguName = "ఆర్.భాగ్యఅమ్మ ఆర్";
const teluguRelative = "ఆర్.ఆగాస్వామి ఆర్";

const samples = [
  userPaste,
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
      "| name:", rec.name,
      "| rel:", rec.relative_name,
      "| state:", rec.state,
      "| AC:", rec.ac_number, rec.ac_name,
      "| part:", rec.part_no,
      "| sr:", rec.part_serial,
      "| house:", rec.polling_station.slice(0, 40),
      rec.warnings
    );
  }
}

const user = parseEciElectoralPaste(userPaste).records[0];
if (user) {
  const payload = defaultPayloadFromEciElectoral(user, DEFAULT_SETTINGS);
  console.log("\nUser payload:");
  console.log("  serial_no:", payload.serial_no);
  console.log("  state:", payload.state_2025);
  console.log("  ac:", payload.ac_no_2025, payload.ac_name_2025);
  console.log("  part:", payload.part_no);
  console.log("  house:", payload.house_no);
}
