import { parseEciSirPaste } from "../src/lib/eciSirPasteParser.ts";

const fullMasood = `S. No.	Elector Full Name	Relative Full Name	Relative Type	Age	State	District	AC No. and Name	Polling Station No. and Name	Part Serial No.	EPIC Number
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
5	
mohammad masood
mohammad mia
Father	32	Telangana	హైదరాబాద్	208 - Sanathnagar	116 -Ameerpet	906	
6	
masood khan
hussain khan
Father	31	Telangana	హైదరాబాద్	208 - Sanathnagar	41 -Begumpet	286	
7	
m sudha
m rama murthy
Other	45	Telangana	హైదరాబాద్	208 - Sanathnagar	135 -Balkampet	231	
8	
m a masood
yakub m a
Father	53	Telangana	హైదరాబాద్	208 - Sanathnagar	51 -Ramgopalpet	239	
9	
mohd masood
mohd iqbal
Father	20	Telangana	హైదరాబాద్	208 - Sanathnagar	73 -Old Ghasmandi	161	
10	
masood hussain
munira begam
Other	48	Telangana	హైదరాబాద్	208 - Sanathnagar	209 -Fathenagar	1070	
11	
m sudha
m kumar
Husband	21	Telangana	హైదరాబాద్	208 - Sanathnagar	196 -Fathenagar	22	
12	
syed masood
syed ahamed
Father	45	Telangana	హైదరాబాద్	208 - Sanathnagar	32 -Begumpet	407	
13	
masud ahmeds
basir ahmed
Other	46	Telangana	హైదరాబాద్	208 - Sanathnagar	153 -Ameerpet	1147	`;

const r = parseEciSirPaste(fullMasood);
console.log("records:", r.records.length, "errors:", r.errors.length);
if (r.errors.length) console.log(r.errors);
for (const rec of r.records) {
  console.log(
    `#${rec.serialNo}`,
    rec.name,
    rec.relative_name || "(no rel)",
    rec.relationship,
    rec.part_no,
    rec.sr_no,
    rec.warnings.length ? rec.warnings : ""
  );
}
