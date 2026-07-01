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
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  console.log("Page size:", viewport.width, "x", viewport.height);

  const items = content.items
    .filter((item): item is { str: string; transform: number[]; width: number; height: number } =>
      "str" in item && typeof item.str === "string"
    )
    .map((item) => {
      const tx = item.transform;
      const x = tx[4];
      const y = viewport.height - tx[5];
      return { text: item.str.trim(), x: Math.round(x), y: Math.round(y), rawY: tx[5] };
    })
    .filter((i) => i.text.length > 0)
    .sort((a, b) => b.y - a.y || a.x - b.x);

  for (const item of items) {
    console.log(`(${item.x}, ${item.y}) pdf-y=${Math.round(item.rawY)} | ${item.text.slice(0, 60)}`);
  }
}

main();
