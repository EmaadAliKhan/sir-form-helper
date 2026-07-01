import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

const templatePath = path.join(
  process.cwd(),
  "public/templates/Enumeration-Form_SIR_English.pdf"
);

async function checkFormFields() {
  const bytes = fs.readFileSync(templatePath);
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const fields = form.getFields();
  console.log("AcroForm fields:", fields.length);
  for (const f of fields) {
    const name = f.getName();
    console.log(" ", name, f.constructor.name);
  }
}

checkFormFields();
