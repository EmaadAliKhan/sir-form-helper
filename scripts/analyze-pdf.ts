import fs from "fs";
import { PDFDocument } from "pdf-lib";

async function main() {
  const paths = [
    "public/templates/Enumeration-Form_SIR_English.pdf",
    "C:/Users/emaad/Downloads/enumeration-NVR2366466.pdf",
  ];
  for (const p of paths) {
    const doc = await PDFDocument.load(fs.readFileSync(p));
    console.log(p, "pages:", doc.getPageCount());
    doc.getPages().forEach((pg, i) => {
      const s = pg.getSize();
      console.log(`  page ${i + 1}: ${s.width} x ${s.height}`);
    });
  }
}

main();
