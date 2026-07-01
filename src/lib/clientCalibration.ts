import { assetPath } from "./assetPath";
import { mergeFormCoords, type CalibrationOverrides } from "./calibrationShared";

const CALIBRATION_KEY = "sir_pdf_calibration";

let shippedOverrides: CalibrationOverrides | null = null;
let shippedLoadPromise: Promise<CalibrationOverrides> | null = null;

async function fetchShippedOverrides(): Promise<CalibrationOverrides> {
  try {
    const res = await fetch(assetPath("/pdf-calibration.json"), { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as CalibrationOverrides;
    return data ?? {};
  } catch {
    return {};
  }
}

/** Call once on app load so PDF generation uses deployed calibration. */
export function preloadCalibration(): Promise<CalibrationOverrides> {
  if (shippedOverrides !== null) {
    return Promise.resolve(shippedOverrides);
  }
  if (!shippedLoadPromise) {
    shippedLoadPromise = fetchShippedOverrides().then((data) => {
      shippedOverrides = data;
      return data;
    });
  }
  return shippedLoadPromise;
}

function readLocalOverrides(): CalibrationOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CalibrationOverrides;
  } catch {
    return {};
  }
}

/** Shipped (GitHub) + local browser overrides (local wins for admin testing). */
export function getCalibrationOverrides(): CalibrationOverrides {
  const shipped = shippedOverrides ?? {};
  const local = readLocalOverrides();
  return { ...shipped, ...local };
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

export function downloadCalibrationJson(overrides: CalibrationOverrides): void {
  const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pdf-calibration.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type { CalibrationOverrides } from "./calibrationShared";
export {
  CALIBRATION_FIELD_GROUPS,
  mergeFormCoords,
  overridesFromCoords,
} from "./calibrationShared";
