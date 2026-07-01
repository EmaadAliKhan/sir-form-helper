import { getDb } from "./db";
import { mergeFormCoords, type CalibrationOverrides } from "./calibrationShared";

export type { CalibrationOverrides } from "./calibrationShared";
export {
  CALIBRATION_FIELD_GROUPS,
  mergeFormCoords,
  overridesFromCoords,
} from "./calibrationShared";

const CALIBRATION_KEY = "pdf_calibration";

export function getCalibrationOverrides(): CalibrationOverrides {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(CALIBRATION_KEY) as { value: string } | undefined;
  if (!row) return {};
  try {
    return JSON.parse(row.value) as CalibrationOverrides;
  } catch {
    return {};
  }
}

export function saveCalibrationOverrides(overrides: CalibrationOverrides) {
  const db = getDb();
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(CALIBRATION_KEY, JSON.stringify(overrides));
}

export function resetCalibrationOverrides() {
  const db = getDb();
  db.prepare("DELETE FROM settings WHERE key = ?").run(CALIBRATION_KEY);
}

export function getEffectiveFormCoords() {
  return mergeFormCoords(getCalibrationOverrides());
}
