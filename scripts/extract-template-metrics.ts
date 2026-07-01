import fs from "fs";
import path from "path";

async function main() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const templatePath = path.join(
    process.cwd(),
    "public/templates/Enumeration-Form_SIR_English.pdf"
  );
  const data = new Uint8Array(fs.readFileSync(templatePath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const tx = item.transform;
    const h = Math.round(item.height);
    const text = item.str.trim();
    if (
      /Elector|EPIC|Serial|Aadhaar|Mobile|Father|Elector Name|AC Number|Date of Birth|d$|m$|y$/.test(
        text
      )
    ) {
      console.log(
        `h=${h} x=${Math.round(tx[4])} pdfY=${Math.round(tx[5])} | ${text.slice(0, 40)}`
      );
    }
  }

  // Extract horizontal lines from operator list
  const ops = await page.getOperatorList();
  console.log("\n--- Looking for rects/lines near header ---");
}

main();
