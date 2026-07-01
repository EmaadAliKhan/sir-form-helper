import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { getDb } from "../src/lib/db";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseCsv<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];
    fs.createReadStream(filePath)
      .pipe(Papa.parse(Papa.NODE_STREAM_INPUT, { header: true, skipEmptyLines: true }))
      .on("data", (row: T) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function main() {
  loadEnvFile();

  const csv2025 =
    process.env.CSV_2025_PATH ??
    "C:\\Users\\emaad\\Downloads\\150_151_152_voters.csv";
  const csv2002 =
    process.env.CSV_2002_PATH ??
    "C:\\Users\\emaad\\sir-search-backend\\data.csv";

  if (!fs.existsSync(csv2025)) {
    throw new Error(`2025 CSV not found: ${csv2025}`);
  }
  if (!fs.existsSync(csv2002)) {
    throw new Error(`2002 CSV not found: ${csv2002}`);
  }

  const db = getDb();

  console.log("Importing 2025 voters...");
  const rows2025 = await parseCsv<Record<string, string>>(csv2025);
  db.exec("DELETE FROM voters_2025");
  const insert2025 = db.prepare(`
    INSERT INTO voters_2025 (
      booth_no, serial_no, epic, name, relation_type, relative_name,
      house_no, age, gender, source_pdf, source_page
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx2025 = db.transaction((rows: Record<string, string>[]) => {
    for (const row of rows) {
      insert2025.run(
        Number(row.Booth_No),
        Number(row.Serial_No),
        row.EPIC ?? "",
        row.Name ?? "",
        row.Relation_Type ?? "",
        row.Relative_Name ?? "",
        row.House_No ?? "",
        Number(row.Age) || 0,
        row.Gender ?? "",
        row.Source_PDF ?? "",
        Number(row.Source_Page) || 0
      );
    }
  });
  tx2025(rows2025);
  console.log(`Imported ${rows2025.length} rows into voters_2025`);

  console.log("Importing 2002 SIR voters...");
  const rows2002 = await parseCsv<Record<string, string>>(csv2002);
  db.exec("DELETE FROM voters_2002");
  const insert2002 = db.prepare(`
    INSERT INTO voters_2002 (
      ps_no, sl_no, section_no, house_no, elector_name, rln_type,
      relation_name, gender, age, epic_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx2002 = db.transaction((rows: Record<string, string>[]) => {
    for (const row of rows) {
      insert2002.run(
        Number(row["PS No"]),
        Number(row["Sl. No"]),
        Number(row["Section No"]) || 0,
        row["House No"] ?? "",
        row["Elector Name"] ?? "",
        row["Rln Type"] ?? "",
        row["Relation Name"] ?? "",
        row["Gender"] ?? "",
        Number(row["Age"]) || 0,
        row["EPIC No"] ?? ""
      );
    }
  });
  tx2002(rows2002);
  console.log(`Imported ${rows2002.length} rows into voters_2002`);
  console.log("Import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
