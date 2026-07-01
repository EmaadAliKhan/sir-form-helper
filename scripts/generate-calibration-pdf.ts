/** Overlay field markers on blank template for alignment verification */
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FORM_COORDS } from "../src/lib/formCoordinates";

const TEMPLATE = path.join(
  process.cwd(),
  "public/templates/Enumeration-Form_SIR_English.pdf"
);
const OUT = path.join(
  process.env.USERPROFILE ?? ".",
  "Downloads",
  "calibration-aligned.pdf"
);

async function main() {
  const templateBytes = fs.readFileSync(TEMPLATE);
  const templateDoc = await PDFDocument.load(templateBytes);
  const doc = await PDFDocument.create();
  const embedded = await doc.embedPage(templateDoc.getPages()[0]);
  const page = doc.addPage([596, 842]);
  page.drawPage(embedded, { x: 0, y: 0, width: 596, height: 842 });

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  for (const [key, coord] of Object.entries(FORM_COORDS)) {
    page.drawCircle({
      x: coord.x,
      y: coord.y,
      size: 2,
      color: rgb(1, 0, 0),
    });
    page.drawText(key.replace(/^sir_/, "s_").slice(0, 12), {
      x: coord.x + 3,
      y: coord.y + 2,
      size: 4,
      font,
      color: rgb(1, 0, 0),
    });
    page.drawText("X", {
      x: coord.x,
      y: coord.y,
      size: coord.size ?? 8,
      font: fontBold,
      color: rgb(0, 0, 0.7),
    });
  }

  fs.writeFileSync(OUT, await doc.save());
  console.log("Wrote", OUT);
}

main();
