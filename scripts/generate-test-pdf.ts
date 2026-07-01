/** Generate a test PDF with sample values at every coordinate for visual calibration */
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
  "calibration-test.pdf"
);

async function main() {
  const bytes = fs.readFileSync(TEMPLATE);
  const doc = await PDFDocument.load(bytes);
  const font = await pdfDocEmbed(doc);
  const page = doc.getPages()[0];
  const { width, height } = page.getSize();
  console.log("Page:", width, height);

  for (let x = 0; x <= width; x += 20) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
    });
  }
  for (let y = 0; y <= height; y += 20) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
    });
  }

  for (const [key, coord] of Object.entries(FORM_COORDS)) {
    page.drawText(`${coord.x},${coord.y}`, {
      x: coord.x,
      y: coord.y,
      size: 5,
      font,
      color: rgb(1, 0, 0),
    });
    page.drawText("X", {
      x: coord.x,
      y: coord.y + 8,
      size: coord.size ?? 8,
      font,
      color: rgb(0, 0, 0.8),
    });
  }

  fs.writeFileSync(OUT, await doc.save());
  console.log("Wrote", OUT);
}

async function pdfDocEmbed(doc: PDFDocument) {
  return doc.embedFont(StandardFonts.Helvetica);
}

main();
