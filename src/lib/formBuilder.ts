import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  degrees,
  rgb,
  type RGB,
} from "pdf-lib";
import { DEFAULT_FORM_COORDS, type FormFieldKey, type TextFieldCoord } from "./formCoordinates";

const TEMPLATE_PUBLIC_PATH = "/templates/Enumeration-Form_SIR_English.pdf";

export const PAGE_W = 596;
export const PAGE_H = 842;
const BLACK: RGB = rgb(0, 0, 0);
const LINE = 0.75;

type Page = PDFPage;

function rect(page: Page, x: number, y: number, w: number, h: number) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderWidth: LINE,
    borderColor: BLACK,
  });
}

function label(page: Page, text: string, x: number, y: number, font: PDFFont, size = 7) {
  page.drawText(text, { x, y, size, font, color: BLACK });
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawParagraph(
  page: Page,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number
): number {
  const maxChars = Math.floor(maxWidth / (size * 0.45));
  const lines = wrapLines(text, maxChars);
  let cy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cy, size, font, color: BLACK });
    cy -= lineHeight;
  }
  return cy;
}

/** Draw page 1 static form structure — matches official Annexure-III layout. */
export function drawFormStructure(page: Page, font: PDFFont) {
  const L = 18;
  const R = PAGE_W - 18;

  // Title
  label(page, "Enumeration Form", 230, 818, font, 11);

  // BLO row
  rect(page, L, 796, R - L, 22);
  label(page, "Name and contact No of BLO (pre-printed)", L + 4, 802, font, 6.5);

  // Header table — 4 columns
  const headerTop = 774;
  const headerBottom = 718;
  const c1 = 148;
  const c2 = 238;
  const c3 = 378;

  rect(page, L, headerBottom, R - L, headerTop - headerBottom);
  page.drawLine({ start: { x: c1, y: headerBottom }, end: { x: c1, y: headerTop }, thickness: LINE, color: BLACK });
  page.drawLine({ start: { x: c2, y: headerBottom }, end: { x: c2, y: headerTop }, thickness: LINE, color: BLACK });
  page.drawLine({ start: { x: c3, y: headerBottom }, end: { x: c3, y: headerTop }, thickness: LINE, color: BLACK });

  for (let y of [750, 734, 718]) {
    page.drawLine({ start: { x: L, y }, end: { x: c3, y }, thickness: LINE, color: BLACK });
  }

  label(page, "Elector\u2019s Name,", L + 4, 756, font, 6.5);
  label(page, "EPIC,  Address", L + 4, 748, font, 6.5);
  label(page, "(Pre-printed).", L + 4, 740, font, 6.5);

  label(page, "Serial No., Part", c1 + 4, 756, font, 6.5);
  label(page, "No.  &  name,", c1 + 4, 748, font, 6.5);
  label(page, "AC/PC  Name,", c1 + 4, 740, font, 6.5);
  label(page, "State", c1 + 4, 732, font, 6.5);
  label(page, "(Pre-printed).", c1 + 4, 724, font, 6.5);

  label(page, "QR Code", c2 + 30, 740, font, 7);

  page.drawLine({ start: { x: c3 + 98, y: headerBottom }, end: { x: c3 + 98, y: headerTop }, thickness: LINE, color: BLACK });
  label(page, "Old Photo", c3 + 12, 756, font, 6.5);
  label(page, "(Pre-printed)", c3 + 8, 748, font, 6.5);
  label(page, "Paste Current", c3 + 100, 756, font, 6.5);
  label(page, "Photo", c3 + 118, 748, font, 6.5);

  // Personal details block
  const personalTop = 712;
  const personalBottom = 542;
  rect(page, L, personalBottom, R - L, personalTop - personalBottom);

  const rowYs = [694, 676, 658, 640, 622, 604, 586, 568, 550];
  for (const y of rowYs) {
    page.drawLine({ start: { x: L, y: y + 14 }, end: { x: R, y: y + 14 }, thickness: LINE, color: BLACK });
  }

  label(page, "Date of Birth (DD/MM/YYYY)", L + 4, 702, font, 7);
  const dobBoxes = [283, 299, 323, 339, 363, 379, 403, 419];
  for (let i = 0; i < dobBoxes.length; i++) {
    rect(page, dobBoxes[i] - 2, 688, 14, 16);
    if (i === 1 || i === 3) label(page, "d", dobBoxes[i] - 1, 704, font, 6);
    if (i === 2 || i === 3) { /* mm labels drawn once */ }
  }
  label(page, "d", 285, 704, font, 6);
  label(page, "d", 301, 704, font, 6);
  label(page, "m", 325, 704, font, 6);
  label(page, "m", 341, 704, font, 6);
  label(page, "y", 365, 704, font, 6);
  label(page, "y", 381, 704, font, 6);
  label(page, "y", 405, 704, font, 6);
  label(page, "y", 421, 704, font, 6);

  const personalLabels: [string, number][] = [
    ["Aadhaar No. (Optional)", 684],
    ["Mobile No.", 666],
    ["Father\u2019s/Guardian\u2019s Name", 648],
    ["Father\u2019s/Guardian\u2019s EPIC No. (if available)", 630],
    ["Mother\u2019s Name", 612],
    ["Mother\u2019s EPIC No. (if available)", 594],
    ["Spouse\u2019s Name (if applicable)", 576],
    ["Spouse\u2019s EPIC No. (if available)", 558],
  ];
  for (const [text, y] of personalLabels) {
    label(page, text, L + 4, y, font, 7);
  }

  // SIR dual-column section
  const sirTop = 536;
  const sirBottom = 378;
  const sirMid = 307;
  rect(page, L, sirBottom, R - L, sirTop - sirBottom);
  page.drawLine({ start: { x: sirMid, y: sirBottom }, end: { x: sirMid, y: sirTop }, thickness: LINE, color: BLACK });

  label(page, "Details of the Elector in the Electoral Roll", L + 4, 528, font, 6.5);
  label(page, "of the last SIR", L + 4, 520, font, 6.5);
  label(page, "Details of the Relative, whose name is given in", sirMid + 4, 528, font, 6.5);
  label(page, "the previous column, in the last SIR", sirMid + 4, 520, font, 6.5);

  const sirFields: [string, string, number][] = [
    ["Elector Name:", "Name:", 513],
    ["EPIC No. (if available)", "EPIC No. (if available)", 495],
    ["Relative\u2019s Name:", "Relative\u2019s Name:", 477],
    ["Relationship:", "Relationship:", 459],
    ["District:", "District:", 441],
    ["State:", "State:", 423],
    ["AC Name:", "AC Name:", 405],
  ];
  for (const [left, right, y] of sirFields) {
    label(page, left, L + 4, y, font, 7);
    label(page, right, sirMid + 4, y, font, 7);
  }

  // Bottom trio boxes
  page.drawLine({ start: { x: L, y: 394 }, end: { x: sirMid, y: 394 }, thickness: LINE, color: BLACK });
  page.drawLine({ start: { x: sirMid, y: 394 }, end: { x: R, y: 394 }, thickness: LINE, color: BLACK });

  const trioW = 52;
  for (let i = 0; i < 3; i++) {
    rect(page, L + 4 + i * (trioW + 4), 380, trioW, 14);
    rect(page, sirMid + 4 + i * (trioW + 4), 380, trioW, 14);
  }
  label(page, "AC Number", L + 8, 396, font, 6);
  label(page, "Part No.", L + 64, 396, font, 6);
  label(page, "Sr No.", L + 120, 396, font, 6);
  label(page, "AC Number", sirMid + 8, 396, font, 6);
  label(page, "Part No.", sirMid + 64, 396, font, 6);
  label(page, "Sr No.", sirMid + 120, 396, font, 6);

  // Declarations
  const declTop = 372;
  const declBottom = 268;
  rect(page, L, declBottom, R - L, declTop - declBottom);

  const declarations = [
    "(i) The elector mentioned above, being myself/my family member, has not acquired the citizenship of any other country.",
    "(ii) I am applying for inclusion in the Electoral Roll, and the name mentioned above, being myself/ my family member, is not included in any other Assembly Constituency/ Parliamentary Constituency.",
    "(iii) I am aware that making the above statement or declaration in relation to this application which is false and which I know or believe to be false or do not believe to be true, is punishable under Section 31 of Representation of the People Act,1950 (43 of 1950) with imprisonment for a term which may extend to one year or with fine or with both.",
  ];
  let dy = 360;
  for (const decl of declarations) {
    dy = drawParagraph(page, decl, L + 4, dy, font, 6.5, R - L - 8, 9);
    dy -= 4;
  }

  // Signature block
  rect(page, L, 210, R - L, 52);
  label(
    page,
    "Signature/Left Thumb Impression of Elector or",
    L + 4,
    252,
    font,
    7
  );
  label(
    page,
    "Any Adult Family Member (mention relationship) with date",
    L + 4,
    242,
    font,
    7
  );

  // BLO undertaking
  rect(page, L, 178, R - L, 28);
  label(
    page,
    "BLO\u2019s undertaking: I have verified the above details from the electoral roll(s) of the last SIR.",
    L + 4,
    188,
    font,
    7
  );
  label(page, "BLO\u2019s Signature", L + 4, 168, font, 7);

  // Annexure footer
  label(page, "Annexure-III", L, 152, font, 8);
  label(page, "Annexure-III", R - 52, 152, font, 8);
}

/** Draw page 2 information sheet — matches official text. */
export function drawInformationSheet(page: Page, font: PDFFont) {
  const L = 36;
  const R = PAGE_W - 36;
  let y = 790;

  label(page, "Information Sheet for Enumeration Form", L, y, font, 11);
  y -= 24;

  const intro =
    "Electors can check their name and the name of the concerned relative(s) in the previous SIR Electoral Rolls at https://voters.eci.gov.in/ to provide the details in the Enumeration Form. For help, electors can connect with the concerned BLOs. ERO will issue notice to those electors whose previous SIR Electoral Roll(s) details provided in the Enumeration Form are either not available or do not match the database. Upon receipt of notice, the elector to provide the documents based upon the following categories:";
  y = drawParagraph(page, intro, L, y, font, 8, R - L, 11);
  y -= 8;

  const sections = [
    {
      heading: "If born in India before 01.07.1987",
      bullets: [
        "Provide any document, for Self, from the list given below, establishing the date of birth and/or place of birth.",
      ],
    },
    {
      heading: "If born in India between 01.07.1987 and 02.12.2004",
      bullets: [
        "Provide any document, for Self, from the list given below, establishing the date of birth and/or place of birth.",
        "Provide any document, for Father or Mother, from the list given below, establishing the date of birth and/or place of birth.",
      ],
    },
    {
      heading: "If born in India after 02.12.2004",
      bullets: [
        "Provide any document, for Self, from the list given below, establishing the date of birth and/or place of birth.",
        "Provide any document, for Father, from the list given below, establishing the date of birth and/or place of birth.",
        "Provide any document, for Mother, from the list given below, establishing the date of birth and/or place of birth.",
        "If any parent is not Indian, provide a copy of his/her valid passport & visa at the time of your birth.",
      ],
    },
    {
      heading: "If born outside of India (attach proof of Birth Registration issued by the Indian Mission abroad),",
      bullets: [],
    },
    {
      heading:
        "If acquired Indian citizenship by Registration/Naturalisation (attach Certificate of Registration of Citizenship)",
      bullets: [],
    },
  ];

  for (const section of sections) {
    label(page, `-  ${section.heading}`, L, y, font, 8);
    y -= 12;
    for (const bullet of section.bullets) {
      y = drawParagraph(page, `o  ${bullet}`, L + 12, y, font, 7.5, R - L - 12, 10);
      y -= 2;
    }
    y -= 4;
  }

  y -= 4;
  label(
    page,
    "Indicative (not exhaustive) list of documents (separate self-attested documents to be submitted for Self, Father and Mother, if mentioned above):",
    L,
    y,
    font,
    8
  );
  y -= 16;

  const docs = [
    "Any Identity card/Pension Payment Order issued to a regular employee/pensioner of any Central Govt./State Govt./PSU.",
    "Any Identity Card/Certificate/Document issued in India by the Government/ local authorities/Banks/Post Office/LIC/PSUs prior to 01.07.1987.",
    "Birth Certificate issued by the competent authority.",
    "Passport",
    "Matriculation/Educational certificate issued by recognised Boards/universities",
    "Permanent Residence certificate issued by the competent State authority",
    "Forest Right Certificate",
    "OBC/SC/ST or any caste certificate issued by the Competent Authority",
    "National Register of Citizens (wherever it exists)",
    "Family Register, prepared by State/Local authorities.",
    "Any land/house allotment certificate by the Government",
    "For Aadhaar, the Commission\u2019s directions issued vide letter No. 23/2025-ERS/Vol.II dated 09.09.2025 (Annexure II) shall apply.",
    "Extract of the electoral roll of Bihar SIR with reference to 01.07.2025.",
  ];
  docs.forEach((doc, i) => {
    y = drawParagraph(page, `${i + 1}.  ${doc}`, L, y, font, 7.5, R - L, 10);
    y -= 2;
  });

  label(page, "***", L, y - 8, font, 8);
}

function textWidth(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

function truncate(text: string, maxWidth: number, font: PDFFont, size: number): string {
  if (textWidth(text, font, size) <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && textWidth(result + "\u2026", font, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + "\u2026";
}

export function drawFormValues(
  page: Page,
  values: Partial<Record<FormFieldKey, string>>,
  fontBold: PDFFont,
  options?: {
    calibration?: boolean;
    calibrationFont?: PDFFont;
    coords?: Record<FormFieldKey, TextFieldCoord>;
    highlightField?: FormFieldKey;
  }
) {
  const coords = options?.coords ?? DEFAULT_FORM_COORDS;

  for (const [key, coord] of Object.entries(coords)) {
    const raw = values[key as FormFieldKey]?.trim();
    if (!raw) continue;
    const size = coord.size ?? 10;
    const text = coord.maxWidth ? truncate(raw, coord.maxWidth, fontBold, size) : raw;

    let x = coord.x;
    if (coord.boxWidth) {
      x = coord.x + (coord.boxWidth - textWidth(text, fontBold, size)) / 2;
    }

    if (coord.pad) {
      const w = coord.maxWidth ?? textWidth(text, fontBold, size) + 6;
      page.drawRectangle({
        x: coord.x - 2,
        y: coord.y - 3,
        width: w + 4,
        height: size + 5,
        color: rgb(1, 1, 1),
      });
    }

    page.drawText(text, {
      x,
      y: coord.y,
      size,
      font: fontBold,
      color: BLACK,
    });
  }

  if (options?.highlightField) {
    const h = coords[options.highlightField];
    if (h) {
      const size = h.size ?? 10;
      const w = h.maxWidth ?? h.boxWidth ?? 120;
      page.drawRectangle({
        x: h.x - 3,
        y: h.y - 4,
        width: w + 6,
        height: size + 8,
        borderWidth: 2,
        borderColor: rgb(0.85, 0.1, 0.1),
      });

      if (options.calibration) {
        const label = options.highlightField.replace(/_/g, " ");
        const labelSize = 9;
        page.drawText(label, {
          x: h.x,
          y: h.y + size + 12,
          size: labelSize,
          font: fontBold,
          color: rgb(0.75, 0.05, 0.05),
        });
      }
    }
  }
}

/** Diagonal draft stamp + footer — drawn on every generated form PDF. */
export function drawDraftOverlay(page: Page, font: PDFFont) {
  const { width, height } = page.getSize();
  const gray = rgb(0.72, 0.72, 0.72);

  page.drawText("DRAFT - FOR REVIEW", {
    x: width * 0.12,
    y: height * 0.48,
    size: 44,
    font,
    color: gray,
    opacity: 0.35,
    rotate: degrees(35),
  });

  page.drawText(
    "Voter-prepared draft. Verify against ECI/SIR records before signing.",
    {
      x: 24,
      y: 14,
      size: 7,
      font,
      color: rgb(0.45, 0.45, 0.45),
    }
  );
}

export function drawCalibrationGrid(page: Page) {
  const { width, height } = page.getSize();
  for (let x = 0; x <= width; x += 20) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.3,
      color: rgb(0.85, 0.85, 0.85),
    });
    if (x % 40 === 0) {
      page.drawText(String(x), { x: x + 2, y: 10, size: 6, color: rgb(0.5, 0.5, 0.5) });
    }
  }
  for (let y = 0; y <= height; y += 20) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.3,
      color: rgb(0.85, 0.85, 0.85),
    });
    if (y % 40 === 0) {
      page.drawText(String(y), { x: 2, y: y + 2, size: 6, color: rgb(0.5, 0.5, 0.5) });
    }
  }
}

export async function loadTemplateBytes(templateUrl?: string): Promise<Uint8Array | null> {
  const url = templateUrl ?? TEMPLATE_PUBLIC_PATH;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function createEnumerationDocument(options?: {
  calibration?: boolean;
  templateUrl?: string;
}): Promise<{
  doc: PDFDocument;
  page1: Page;
  page2: Page;
  font: PDFFont;
  fontBold: PDFFont;
}> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const templateBytes = await loadTemplateBytes(options?.templateUrl);

  if (templateBytes) {
    const templateDoc = await PDFDocument.load(templateBytes);
    const [embeddedP1, embeddedP2] = await Promise.all([
      doc.embedPage(templateDoc.getPages()[0]),
      doc.embedPage(templateDoc.getPages()[1]),
    ]);

    const page1 = doc.addPage([PAGE_W, PAGE_H]);
    page1.drawPage(embeddedP1, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

    const page2 = doc.addPage([PAGE_W, PAGE_H]);
    page2.drawPage(embeddedP2, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

    return { doc, page1, page2, font, fontBold };
  }

  const page1 = doc.addPage([PAGE_W, PAGE_H]);
  drawFormStructure(page1, font);

  const page2 = doc.addPage([PAGE_W, PAGE_H]);
  drawInformationSheet(page2, font);

  return { doc, page1, page2, font, fontBold };
}
