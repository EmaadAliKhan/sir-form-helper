import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_SETTINGS, type AppSettings } from "./types";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

let db: Database.Database | null = null;

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS voters_2025 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booth_no INTEGER NOT NULL,
      serial_no INTEGER NOT NULL,
      epic TEXT NOT NULL,
      name TEXT NOT NULL,
      relation_type TEXT,
      relative_name TEXT,
      house_no TEXT,
      age INTEGER,
      gender TEXT,
      source_pdf TEXT,
      source_page INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_v2025_booth ON voters_2025(booth_no);
    CREATE INDEX IF NOT EXISTS idx_v2025_epic ON voters_2025(epic);
    CREATE INDEX IF NOT EXISTS idx_v2025_name ON voters_2025(name);
    CREATE INDEX IF NOT EXISTS idx_v2025_house ON voters_2025(house_no);

    CREATE TABLE IF NOT EXISTS voters_2002 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ps_no INTEGER NOT NULL,
      sl_no INTEGER NOT NULL,
      section_no INTEGER,
      house_no TEXT,
      elector_name TEXT NOT NULL,
      rln_type TEXT,
      relation_name TEXT,
      gender TEXT,
      age INTEGER,
      epic_no TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_v2002_epic ON voters_2002(epic_no);
    CREATE INDEX IF NOT EXISTS idx_v2002_name ON voters_2002(elector_name);
    CREATE INDEX IF NOT EXISTS idx_v2002_relation ON voters_2002(relation_name);
    CREATE INDEX IF NOT EXISTS idx_v2002_house ON voters_2002(house_no);
    CREATE INDEX IF NOT EXISTS idx_v2002_ps ON voters_2002(ps_no);

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      voter_2025_epic TEXT NOT NULL,
      voter_2025_name TEXT NOT NULL,
      booth_no INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_forms_epic ON forms(voter_2025_epic);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = database
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("app_settings") as { value: string } | undefined;

  if (!row) {
    database
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
      .run("app_settings", JSON.stringify(DEFAULT_SETTINGS));
  }
}

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

export function getSettings(): AppSettings {
  const database = getDb();
  const row = database
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get("app_settings") as { value: string };

  return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
}

export function saveSettings(settings: AppSettings) {
  const database = getDb();
  database
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run("app_settings", JSON.stringify(settings));
}
