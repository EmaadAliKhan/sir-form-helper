"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CALIBRATION_FIELD_GROUPS,
  downloadCalibrationJson,
  getEffectiveFormCoords,
  overridesFromCoords,
  preloadCalibration,
  resetCalibrationOverrides,
  saveCalibrationOverrides,
} from "@/lib/clientCalibration";
import { DEFAULT_FORM_COORDS } from "@/lib/formCoordinates";
import { generateCalibrationPreviewPdf } from "@/lib/clientPdf";
import type { FormFieldKey, TextFieldCoord } from "@/lib/formCoordinates";
import { btnPrimary, btnSecondary, inputClass, labelClass } from "@/lib/ui";

type CalibrationData = {
  defaults: Record<FormFieldKey, TextFieldCoord>;
  overrides: CalibrationOverrides;
  coords: Record<FormFieldKey, TextFieldCoord>;
};

function fieldLabel(key: FormFieldKey): string {
  return key.replace(/_/g, " ");
}

export function CalibratePage() {
  const [defaults, setDefaults] = useState<Record<FormFieldKey, TextFieldCoord> | null>(
    null
  );
  const [coords, setCoords] = useState<Record<FormFieldKey, TextFieldCoord> | null>(
    null
  );
  const [selected, setSelected] = useState<FormFieldKey>("elector_name");
  const [step, setStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resetFieldFlash, setResetFieldFlash] = useState(false);

  const load = useCallback(async () => {
    await preloadCalibration();
    const defaults = DEFAULT_FORM_COORDS;
    const merged = getEffectiveFormCoords();
    setDefaults(defaults);
    setCoords(merged);
    setDirty(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshPreview = useCallback(
    async (nextCoords: Record<FormFieldKey, TextFieldCoord>, field: FormFieldKey) => {
      setLoadingPreview(true);
      try {
        const bytes = await generateCalibrationPreviewPdf(nextCoords, field);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } finally {
        setLoadingPreview(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!coords) return;
    const timer = setTimeout(() => {
      refreshPreview(coords, selected);
    }, 400);
    return () => clearTimeout(timer);
  }, [coords, selected, refreshPreview]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const current = coords?.[selected];

  function patchField(patch: Partial<TextFieldCoord>) {
    if (!coords) return;
    setCoords({
      ...coords,
      [selected]: { ...coords[selected], ...patch },
    });
    setDirty(true);
  }

  function nudge(dx: number, dy: number) {
    if (!current) return;
    patchField({ x: Math.round((current.x + dx) * 10) / 10, y: Math.round((current.y + dy) * 10) / 10 });
  }

  async function save() {
    if (!coords) return;
    const overrides = overridesFromCoords(coords);
    saveCalibrationOverrides(overrides);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  }

  function downloadForGithub() {
    if (!coords) return;
    const overrides = overridesFromCoords(coords);
    downloadCalibrationJson(overrides);
  }

  async function resetAll() {
    if (!confirm("Reset all field positions to built-in defaults?")) return;
    resetCalibrationOverrides();
    await load();
  }

  async function openFullPreview() {
    if (!coords) return;
    const bytes = await generateCalibrationPreviewPdf(coords, selected);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function resetField() {
    if (!coords || !defaults) return;
    setCoords({ ...coords, [selected]: { ...defaults[selected] } });
    setDirty(true);
    setResetFieldFlash(true);
    setTimeout(() => setResetFieldFlash(false), 2000);
  }

  const changedFieldCount = useMemo(() => {
    if (!coords || !defaults) return 0;
    return Object.keys(overridesFromCoords(coords)).length;
  }, [coords, defaults]);

  if (!coords || !defaults || !current) {
    return <p className="text-slate-600">Loading calibration…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">PDF Calibration</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Preview shows <strong>bold sample text</strong> on the real form (same as a generated
            PDF). Save here for this browser. Use <strong>Download for GitHub</strong> to update
            the live site for everyone.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={openFullPreview}
            className={`${btnSecondary} w-full text-center sm:w-auto`}
          >
            Open full PDF in tab
          </button>
          <button type="button" onClick={resetAll} className={`${btnSecondary} w-full sm:w-auto`}>
            Reset all
          </button>
          <button
            type="button"
            onClick={downloadForGithub}
            className={`${btnSecondary} w-full sm:w-auto`}
          >
            Download for GitHub
          </button>
          <button type="button" onClick={save} className={`${btnPrimary} w-full sm:w-auto`} disabled={!dirty || saved}>
            {saved ? "Saved locally ✓" : "Save locally"}
          </button>
        </div>
      </div>

      {saved && (
        <p className="text-sm text-emerald-600">
          Saved in this browser. Click <strong>Download for GitHub</strong>, replace{" "}
          <code className="text-xs">public/pdf-calibration.json</code>, commit, and push to update
          the live site.
        </p>
      )}
      {dirty && !saved && (
        <p className="text-sm text-amber-600">Unsaved changes — click Save calibration.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className={labelClass}>Step size (points)</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[1, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStep(n)}
                  className={`min-h-11 min-w-11 rounded px-3 py-2 text-sm ${
                    step === n
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {n}pt
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="field-select">
              Field
            </label>
            <select
              id="field-select"
              className={`${inputClass} mt-1`}
              value={selected}
              onChange={(e) => setSelected(e.target.value as FormFieldKey)}
            >
              {CALIBRATION_FIELD_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.fields.map((key) => (
                    <option key={key} value={key}>
                      {fieldLabel(key)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>X</label>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={current.x}
                step={0.5}
                onChange={(e) => patchField({ x: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Y</label>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={current.y}
                step={0.5}
                onChange={(e) => patchField({ y: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Font size</label>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={current.size ?? 10}
                min={6}
                max={16}
                step={0.5}
                onChange={(e) => patchField({ size: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>Max width</label>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={current.maxWidth ?? ""}
                placeholder="—"
                onChange={(e) => {
                  const v = e.target.value;
                  patchField({ maxWidth: v ? Number(v) : undefined });
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!current.pad}
                onChange={(e) => patchField({ pad: e.target.checked || undefined })}
              />
              White background (header fields)
            </label>
          </div>

          {current.boxWidth !== undefined && (
            <div>
              <label className={labelClass}>Box width (centre text)</label>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={current.boxWidth}
                onChange={(e) => patchField({ boxWidth: Number(e.target.value) })}
              />
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Nudge position
            </p>
            <div className="grid w-full max-w-48 grid-cols-3 gap-1.5 mx-auto">
              <div />
              <NudgeBtn onClick={() => nudge(0, step)} label="↑" title="Up" />
              <div />
              <NudgeBtn onClick={() => nudge(-step, 0)} label="←" title="Left" />
              <NudgeBtn onClick={() => nudge(0, -step)} label="↓" title="Down" />
              <NudgeBtn onClick={() => nudge(step, 0)} label="→" title="Right" />
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              PDF Y increases upward
            </p>
          </div>

          <button type="button" onClick={resetField} className={`${btnSecondary} w-full`}>
            Reset this field
          </button>
          {resetFieldFlash && (
            <p className="text-sm text-emerald-600">{fieldLabel(selected)} reset to default.</p>
          )}

          <p className="text-xs text-slate-500">
            {changedFieldCount} field(s) differ from defaults
          </p>
        </aside>

        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 p-2 shadow-sm">
          <div className="mb-2 flex flex-col gap-1 px-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 break-words">
              Preview — <strong>{fieldLabel(selected)}</strong> at x={current.x}, y=
              {current.y}
            </span>
            {loadingPreview && <span className="shrink-0">Updating…</span>}
          </div>
          {previewUrl ? (
            <iframe
              title="Calibration preview"
              src={previewUrl}
              className="h-[min(820px,70vh)] w-full rounded-lg bg-white sm:h-[min(820px,75vh)]"
            />
          ) : (
            <div className="flex h-[min(400px,50vh)] items-center justify-center text-slate-500 sm:h-[min(820px,70vh)]">
              Generating preview…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NudgeBtn({
  onClick,
  label,
  title,
}: {
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="min-h-11 rounded bg-slate-200 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-300"
    >
      {label}
    </button>
  );
}
