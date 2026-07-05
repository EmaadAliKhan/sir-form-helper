import { parseEciSirPaste, manualBlockFromParsed } from "../src/lib/eciSirPasteParser.ts";

const davidBlock = `1	
a. david shephard
a. manikya rao
Other	58	Telangana	హైదరాబాద్	208 - Sanathnagar	194 -Fathenagar	407	
2	
a david s dass
a s p rao
Father	38	Telangana	హైదరాబాద్	208 - Sanathnagar	19 -Patigadda	80	
3	
maddi david swaj babu
maddi punna rao
Father	47	Telangana	హైదరాబాద్	208 - Sanathnagar	155 -Sanjeevareddy Nagar	1147	
4	
b.david prabhakar
b.s.rao
Other	38	Telangana	హైదరాబాద్	208 - Sanathnagar	125 -Balkampet	402	`;

const masoodBlock = `S. No.	Elector Full Name	Relative Full Name	Relative Type	Age	State	District	AC No. and Name	Polling Station No. and Name	Part Serial No.	EPIC Number
1	
masood
md fatha
Father	24	Telangana	హైదరాబాద్	208 - Sanathnagar	183 -Sanathnagar	594	
2	
masud
abdul ajij
Other	32	Telangana	హైదరాబాద్	208 - Sanathnagar	208 -Fathenagar	346	
3	
masudha begum
Husband	55	Telangana	హైదరాబాద్	208 - Sanathnagar	41 -Begumpet	306	
4	
masood rasheed
abdul rasheed
Father	47	Telangana	హైదరాబాద్	208 - Sanathnagar	50 -Ramgopalpet	795	
13	
syed masood
syed ahamed
Father	45	Telangana	హైదరాబాద్	208 - Sanathnagar	32 -Begumpet	407	`;

function run(label: string, paste: string) {
  const r = parseEciSirPaste(paste);
  console.log(`\n=== ${label} === records:${r.records.length} errors:${r.errors.length}`);
  if (r.errors.length) console.log(" errors:", r.errors);
  for (const rec of r.records) {
    const block = manualBlockFromParsed(rec);
    console.log(
      `#${rec.serialNo ?? "?"}`,
      rec.name,
      "| rel:", rec.relative_name,
      "| reln:", rec.relationship,
      "| dist:", rec.district,
      "| AC:", rec.ac_number, rec.ac_name,
      "| PS:", rec.part_no,
      "| sr:", rec.sr_no,
      rec.warnings.length ? `WARN:${rec.warnings.join(";")}` : ""
    );
    if (!rec.name || !rec.relationship || !rec.ac_number || !rec.part_no || !rec.sr_no) {
      console.log("  !! incomplete", block);
    }
  }
}

run("david", davidBlock);
run("masood", masoodBlock);
