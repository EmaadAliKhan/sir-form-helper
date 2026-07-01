import { mergeFormCoords, type CalibrationOverrides } from "./calibrationShared";

const CALIBRATION_KEY = "sir_pdf_calibration";

export function getCalibrationOverrides(): CalibrationOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CalibrationOverrides;
  } catch {
    return {};
  }
}

export function saveCalibrationOverrides(overrides: CalibrationOverrides): void {
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(overrides));
}

export function resetCalibrationOverrides(): void {
  localStorage.removeItem(CALIBRATION_KEY);
}

export function getEffectiveFormCoords() {
  return mergeFormCoords(getCalibrationOverrides());
}

export type { CalibrationOverrides } from "./calibrationShared";
export {
  CALIBRATION_FIELD_GROUPS,
  mergeFormCoords,
  overridesFromCoords,
} from "./calibrationShared";
