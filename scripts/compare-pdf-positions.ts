import fs from "fs";
import path from "path";

async function extractPdf(pathToPdf: string, label: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(pathToPdf));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  console.log(`\n=== ${label} ===`);
  const items = content.items
    .filter((item): item is { str: string; transform: number[] } =>
      "str" in item && typeof item.str === "string"
    )
    .map((item) => {
      const tx = item.transform;
      return {
        text: item.str.trim(),
        x: Math.round(tx[4]),
        pdfY: Math.round(tx[5]),
        topY: Math.round(viewport.height - tx[5]),
      };
    })
    .filter((i) => i.text.length > 0)
    .sort((a, b) => b.pdfY - a.pdfY || a.x - b.x);

  for (const item of items) {
    console.log(`x=${item.x} pdfY=${item.pdfY} topY=${item.topY} | ${item.text.slice(0, 50)}`);
  }
}

async function main() {
  await extractPdf(
    path.join(process.cwd(), "public/templates/Enumeration-Form_SIR_English.pdf"),
    "BLANK TEMPLATE"
  );
  await extractPdf(
    "C:/Users/emaad/Downloads/enumeration-NVR2366466 (2).pdf",
    "FILLED (user)"
  );
}

main();
