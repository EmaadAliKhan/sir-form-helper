/** Generate a sample PDF matching the NVR2366466 reference for visual comparison */
import fs from "fs";
import path from "path";
import { generateFormPdf } from "../src/lib/pdf";
import type { FormPayload } from "../src/lib/types";

const sample: FormPayload = {
  form_kind: "enumeration",
  elector_name: "Emaad Ali Khan",
  epic: "NVR2366466",
  serial_no: "476",
  part_no: "150",
  house_no: "7-1-277/156or294/c",
  relative_name_from_2025: "Hayath Alikhan",
  ac_name_2025: "Sanathnagar",
  ac_no_2025: "62",
  state_2025: "Telangana",
  blo_name: "",
  blo_contact: "",
  was_in_2002: true,
  linked_2002_id: null,
  manual_2002: {
    name: "Emaad Ali Khan",
    epic: "",
    relative_name: "Hayath Alikhan",
    relationship: "Other",
    district: "Hyderabad",
    state: "Telangana",
    ac_name: "Sanathnagar",
    ac_number: "208",
    part_no: "125",
    sr_no: "440",
  },
  dob: "02/02/2004",
  aadhaar: "3345678903",
  show_full_aadhaar: true,
  mobile: "06300729969",
  father_name: "Hayath Alikhan",
  father_epic: "",
  mother_name: "Basith Alikhan",
  mother_epic: "",
  spouse_name: "",
  spouse_epic: "",
};

async function main() {
  const bytes = await generateFormPdf(sample);
  const out = path.join(
    process.env.USERPROFILE ?? ".",
    "Downloads",
    "enumeration-NVR2366466-test.pdf"
  );
  fs.writeFileSync(out, bytes);
  console.log("Wrote", out);
}

main();
