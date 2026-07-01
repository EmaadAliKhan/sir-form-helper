import { parseEciSirPaste } from "../src/lib/eciSirPasteParser.ts";

const hyderabad = "హైదరాబాద్";

const samples = [
  `1
m.a, basit
m.a. majid
Father\t32\tTelangana\t${hyderabad}\t208 - Sanathnagar\t207 -Fathenagar\t180`,

  `1
m.a, basit
m.a. majid
Father\t32\tTelangana\t${hyderabad}\t208 - Sanathnagar\t207 -Fathenagar`,

  `1
m.a, basit
m.a. majid
Father\t32\tTelangana\t${hyderabad}\t208 - Sanathnagar\t207 -Fathenagar\t180
2
shaik basith
shaik hameed
Father\t45\tTelangana\t${hyderabad}\t208 - Sanathnagar\t167 -Ashok Nagar\t250`,

  `1\tm.a, basit\tm.a. majid\tFather\t32\tTelangana\t${hyderabad}\t208 - Sanathnagar\t207 -Fathenagar\t180`,
];

for (let i = 0; i < samples.length; i++) {
  const r = parseEciSirPaste(samples[i]);
  console.log(`Sample ${i + 1}:`, r.records.length, "records", r.errors);
  for (const rec of r.records) {
    console.log(" ", rec.name, rec.district, rec.ac_number, rec.part_no, rec.sr_no, rec.warnings);
  }
}
