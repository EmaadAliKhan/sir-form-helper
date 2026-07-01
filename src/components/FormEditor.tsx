"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AppSettings,
  FormPayload,
  FormRecord,
  Manual2002Block,
} from "@/lib/types";
import {
  ECI_RELATIONSHIP_OPTIONS,
  mergeDistrictOptions,
} from "@/lib/types";
import {
  alertWarning,
  btnPrimary,
  btnSecondary,
  dobDayMonthClass,
  dobYearClass,
  formatOptionalLabel,
  inputClass,
  joinDobParts,
  labelClass,
  parseDobParts,
  sectionClass,
  sectionTitleClass,
} from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";
import { EciSirPastePanel } from "@/components/EciSirPastePanel";
import { getForm, updateForm } from "@/lib/clientForms";
import { getAppSettings } from "@/lib/clientSettings";
import { downloadFormPdf, formPdfFilename, generateFormPdf } from "@/lib/clientPdf";
import {
  localMobileDigits,
  normalizeWhatsAppPhone,
  openWhatsAppChat,
} from "@/lib/whatsapp";

const emptyManual2002 = (): Manual2002Block => ({
  name: "",
  epic: "",
  relative_name: "",
  relationship: "",
  district: "",
  state: "",
  ac_name: "",
  ac_number: "",
  part_no: "",
  sr_no: "",
});

function hasSirData(payload: FormPayload): boolean {
  if (payload.linked_2002_id) return true;
  const m = payload.manual_2002;
  if (!m) return false;
  return !!(
    m.name ||
    m.epic ||
    m.relative_name ||
    m.relationship ||
    m.district ||
    m.state ||
    m.ac_name ||
    m.ac_number ||
    m.part_no ||
    m.sr_no
  );
}

function sirManualLabels(wasIn2002: boolean) {
  if (wasIn2002) {
    return {
      section:
        "Your own entry in the 2002 SIR list (left column on the printed form)",
      name: "Your name in 2002 SIR list",
      relativeName: "Your relative's name (as listed in 2002)",
      relationship: "Your relationship to that relative",
      partNo: "2002 part / polling station no.",
      srNo: "2002 serial no. in part",
    };
  }
  return {
    section:
      "Your relative's entry in the 2002 SIR list (right column on the printed form)",
    name: "Relative's name in 2002 SIR list",
    relativeName: "Their relative's name (as listed in 2002)",
    relationship: "Your relationship to this person",
    partNo: "Relative's 2002 part / polling station no.",
    srNo: "Relative's 2002 serial no. in part",
  };
}

export function FormEditor({ formId }: { formId: string }) {
  const [form, setForm] = useState<FormRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [payload, setPayload] = useState<FormPayload | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [toast, setToast] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<"download" | "print" | null>(null);
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const loadForm = useCallback(async () => {
    const formData = getForm(formId);
    if (!formData) return;
    const settingsData = await getAppSettings();
    setForm(formData);
    setPayload(formData.payload);
    setSettings(settingsData);
    if (formData.payload.manual_2002) {
      setManualMode(true);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  useEffect(() => {
    if (!payload?.mobile) return;
    setWhatsappNumber((prev) => (prev ? prev : localMobileDigits(payload.mobile)));
  }, [payload?.mobile]);

  async function save(nextPayload?: FormPayload) {
    const toSave = nextPayload ?? payload;
    if (!toSave || !form) return false;
    setSaving(true);
    setSaveFlash(false);
    setSaveError("");
    const meta =
      toSave.form_kind === "declaration"
        ? {
            voter_2025_name: toSave.elector_name.trim() || "Declaration form",
            voter_2025_epic: toSave.epic.trim(),
            booth_no: Number(toSave.part_no) || 0,
          }
        : undefined;
    const updated = updateForm(formId, toSave, meta);
    if (updated) {
      setForm(updated);
      setPayload(updated.payload);
      setSaving(false);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2500);
      return true;
    }
    setSaving(false);
    setSaveError("Could not save — try again.");
    return false;
  }

  function switchWasIn2002(nextWasIn2002: boolean) {
    if (!payload || payload.was_in_2002 === nextWasIn2002) return;
    if (
      hasSirData(payload) &&
      !confirm("Switching will clear your current 2002 SIR details. Continue?")
    ) {
      return;
    }
    const next = { ...payload, was_in_2002: nextWasIn2002, linked_2002_id: null, manual_2002: null };
    setPayload(next);
    setManualMode(false);
    if (settings) {
      const defaults = emptyManual2002();
      if (nextWasIn2002) {
        defaults.name = next.elector_name;
        defaults.district = settings.district_2002;
        defaults.state = settings.state_2002;
        defaults.ac_name = settings.ac_name_2002;
        defaults.ac_number = settings.ac_no_2002;
      } else {
        defaults.relative_name = next.relative_name_from_2025 ?? "";
      }
      setPayload({ ...next, manual_2002: defaults });
      setManualMode(true);
    }
  }

  function updateField<K extends keyof FormPayload>(key: K, value: FormPayload[K]) {
    if (!payload) return;
    setPayload({ ...payload, [key]: value });
  }

  function enableManualSir() {
    if (!payload || !settings) return;
    const defaults = emptyManual2002();
    if (payload.was_in_2002) {
      defaults.name = payload.elector_name;
      defaults.district = settings.district_2002;
      defaults.state = settings.state_2002;
      defaults.ac_name = settings.ac_name_2002;
      defaults.ac_number = settings.ac_no_2002;
    } else {
      defaults.relative_name = payload.relative_name_from_2025 ?? "";
    }
    setPayload({
      ...payload,
      linked_2002_id: null,
      manual_2002: defaults,
    });
    setManualMode(true);
  }

  async function applyEciSirPaste(block: Manual2002Block) {
    if (!payload) return;
    const next = {
      ...payload,
      linked_2002_id: null,
      manual_2002: block,
    };
    setPayload(next);
    setManualMode(true);
    await save(next);
  }

  function updateManual2002(field: keyof Manual2002Block, value: string) {
    if (!payload) return;
    const manual = payload.manual_2002 ?? emptyManual2002();
    setPayload({
      ...payload,
      linked_2002_id: null,
      manual_2002: { ...manual, [field]: value },
    });
  }

  async function downloadPdf() {
    if (!payload || !form) return;
    setPdfBusy("download");
    try {
      await save();
      const filename = formPdfFilename(form);
      await downloadFormPdf(payload, filename);
    } finally {
      setPdfBusy(null);
    }
  }

  async function printPdf() {
    if (!payload || !form) return;
    setPdfBusy("print");
    try {
      await save();
      const bytes = await generateFormPdf(payload);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      win?.addEventListener("load", () => win.print());
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setPdfBusy(null);
    }
  }

  async function sendWhatsApp() {
    const phone = normalizeWhatsAppPhone(whatsappNumber);
    if (!phone) {
      alert("Enter a valid 10-digit mobile number (e.g. 9876543210). +91 is added automatically.");
      return;
    }

    const voterName = payload?.elector_name ?? form?.voter_2025_name ?? "voter";
    const message = `Self-enumeration form for ${voterName}. Please attach the downloaded PDF.`;

    openWhatsAppChat(phone, message);

    setWhatsappBusy(true);
    try {
      await save();
      if (payload && form) {
        await downloadFormPdf(payload, formPdfFilename(form));
      }

      setToast(
        "PDF download started. In WhatsApp, tap attach (📎) and choose the PDF from Downloads or Files."
      );
      setTimeout(() => setToast(""), 8000);
    } finally {
      setWhatsappBusy(false);
    }
  }

  if (!form || !payload || !settings) {
    return <p className="text-slate-600">Loading form...</p>;
  }

  const dobParts = parseDobParts(payload.dob);
  const districtOptions = mergeDistrictOptions(settings);
  const sirLabels = sirManualLabels(payload.was_in_2002);
  const isDeclaration = payload.form_kind === "declaration";
  const headerTitle = payload.elector_name.trim() || form.voter_2025_name;

  return (
    <div className="space-y-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{headerTitle}</h1>
          <p className="text-sm text-slate-500">
            {isDeclaration ? (
              <>
                <span className="mr-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                  Declaration
                </span>
                {payload.epic ? `EPIC ${payload.epic}` : "No voter selected from 2025 roll"}
                {payload.part_no ? ` · Part ${payload.part_no}` : ""}
              </>
            ) : (
              <>EPIC {form.voter_2025_epic} · Booth {form.booth_no}</>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button onClick={() => save()} disabled={saving || pdfBusy !== null} className={`${btnPrimary} w-full sm:w-auto`}>
            {saving ? "Saving..." : saveFlash ? "Saved ✓" : "Save"}
          </button>
          <button onClick={downloadPdf} disabled={saving || pdfBusy !== null} className={`${btnSecondary} w-full sm:w-auto`}>
            {pdfBusy === "download" ? "Preparing..." : "Download PDF"}
          </button>
          <button onClick={printPdf} disabled={saving || pdfBusy !== null} className={`${btnSecondary} w-full sm:w-auto`}>
            {pdfBusy === "print" ? "Preparing..." : "Print"}
          </button>
        </div>
      </div>

      {saveFlash && (
        <StatusMessage variant="success">Form saved successfully.</StatusMessage>
      )}

      {saveError && <StatusMessage variant="warning">{saveError}</StatusMessage>}

      {toast && (
        <div className={alertWarning}>
          {toast}
        </div>
      )}

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>
          {isDeclaration ? "Form header (enter manually if needed)" : "2025 Voter Details (editable)"}
        </h2>
        {isDeclaration && (
          <StatusMessage variant="info">
            No voter was selected from the 2025 roll. Fill only the fields that should appear on the
            printed form header — leave blank if not applicable for this declaration.
          </StatusMessage>
        )}
        <div className={`grid gap-3 md:grid-cols-2 ${isDeclaration ? "mt-4" : ""}`}>
          <Field label="Elector Name" value={payload.elector_name} onChange={(v) => updateField("elector_name", v)} />
          <Field label="EPIC" optional value={payload.epic} onChange={(v) => updateField("epic", v)} />
          <Field label="Serial No" optional value={payload.serial_no} onChange={(v) => updateField("serial_no", v)} />
          <Field label="Part No (Booth)" optional value={payload.part_no} onChange={(v) => updateField("part_no", v)} />
          <Field label="House No" optional value={payload.house_no} onChange={(v) => updateField("house_no", v)} />
          <Field label="AC Name" value={payload.ac_name_2025} onChange={(v) => updateField("ac_name_2025", v)} />
          <Field label="AC No" value={payload.ac_no_2025} onChange={(v) => updateField("ac_no_2025", v)} />
          <Field label="State" value={payload.state_2025} onChange={(v) => updateField("state_2025", v)} />
          <Field label="BLO Name" optional value={payload.blo_name} onChange={(v) => updateField("blo_name", v)} />
          <Field label="BLO Contact" optional value={payload.blo_contact} onChange={(v) => updateField("blo_contact", v)} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>2002 SIR Mapping</h2>
        <div className="mb-4 flex flex-col gap-3 text-sm text-slate-800 sm:flex-row sm:flex-wrap sm:gap-4">
          <label className="flex min-h-11 items-start gap-2">
            <input
              type="radio"
              className="mt-1 shrink-0"
              checked={payload.was_in_2002}
              onChange={() => switchWasIn2002(true)}
            />
            Voter was in 2002 SIR list
          </label>
          <label className="flex min-h-11 items-start gap-2">
            <input
              type="radio"
              className="mt-1 shrink-0"
              checked={!payload.was_in_2002}
              onChange={() => switchWasIn2002(false)}
            />
            Not in 2002 — use relative from 2025 list
          </label>
        </div>

        {!payload.was_in_2002 && (
          <Field
            label={
              isDeclaration
                ? "Relative name (for 2002 SIR entry)"
                : "Relative name from 2025 list"
            }
            value={payload.relative_name_from_2025 ?? ""}
            onChange={(v) => updateField("relative_name_from_2025", v)}
          />
        )}

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
          <p className="mb-3 text-sm text-slate-600">
            Enter 2002 SIR details manually or paste from the ECI SIR portal below. Database search
            is not available on the hosted site.
          </p>
          <button onClick={enableManualSir} className={`${btnSecondary} w-full sm:w-auto`}>
            {payload.manual_2002 ? "Reset manual 2002 fields" : "Enter 2002 details manually"}
          </button>
        </div>

        <EciSirPastePanel onApply={applyEciSirPaste} />

        {manualMode && payload.manual_2002 && (
          <StatusMessage variant="info">
            Manual 2002 entry — fill in the fields below.
          </StatusMessage>
        )}

        {payload.manual_2002 && (
          <div id="manual-2002-fields" className="mt-4 space-y-3">
            <p className="text-sm font-medium text-slate-700">{sirLabels.section}</p>
            {!payload.manual_2002.district.trim() && (
              <StatusMessage variant="warning">
                District is missing — select or type the English district name below (required
                for the PDF).
              </StatusMessage>
            )}
            <div className="grid gap-3 md:grid-cols-2">
            <Field label={sirLabels.name} value={payload.manual_2002.name} onChange={(v) => updateManual2002("name", v)} />
            <Field label="EPIC" optional value={payload.manual_2002.epic} onChange={(v) => updateManual2002("epic", v)} />
            <Field label={sirLabels.relativeName} value={payload.manual_2002.relative_name} onChange={(v) => updateManual2002("relative_name", v)} />
            <SelectField
              label={sirLabels.relationship}
              value={payload.manual_2002.relationship}
              options={[...ECI_RELATIONSHIP_OPTIONS]}
              onChange={(v) => updateManual2002("relationship", v)}
            />
            <SelectOrTypeField
              label="District"
              value={payload.manual_2002.district}
              options={districtOptions}
              manualPlaceholder="Type English district name"
              onChange={(v) => updateManual2002("district", v)}
            />
            <SelectOrTypeField
              label="State"
              value={payload.manual_2002.state}
              options={settings.state_options}
              manualPlaceholder="Or type state name"
              onChange={(v) => updateManual2002("state", v)}
            />
            <SelectOrTypeField
              label="Constituency (AC Name)"
              value={payload.manual_2002.ac_name}
              options={settings.ac_name_options}
              manualPlaceholder="Or type constituency name"
              onChange={(v) => updateManual2002("ac_name", v)}
            />
            <Field label="AC Number" value={payload.manual_2002.ac_number} onChange={(v) => updateManual2002("ac_number", v)} />
            <Field label={sirLabels.partNo} value={payload.manual_2002.part_no} onChange={(v) => updateManual2002("part_no", v)} />
            <Field label={sirLabels.srNo} value={payload.manual_2002.sr_no} onChange={(v) => updateManual2002("sr_no", v)} />
            </div>
          </div>
        )}
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Personal Details (to enter)</h2>
        <DobField
          dd={dobParts.dd}
          mm={dobParts.mm}
          yyyy={dobParts.yyyy}
          onChange={(dd, mm, yyyy) => updateField("dob", joinDobParts(dd, mm, yyyy))}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="Aadhaar No"
            optional
            value={payload.aadhaar}
            onChange={(v) => updateField("aadhaar", v.replace(/\D/g, ""))}
            hint="Full number will appear on PDF"
          />
          <Field label="Mobile No" value={payload.mobile} onChange={(v) => updateField("mobile", v.replace(/\D/g, ""))} />
          <Field label="Father's / Guardian's Name" value={payload.father_name} onChange={(v) => updateField("father_name", v)} />
          <Field label="Father's / Guardian's EPIC" optional value={payload.father_epic} onChange={(v) => updateField("father_epic", v)} />
          <Field label="Mother's Name" value={payload.mother_name} onChange={(v) => updateField("mother_name", v)} />
          <Field label="Mother's EPIC" optional value={payload.mother_epic} onChange={(v) => updateField("mother_epic", v)} />
          <Field label="Spouse's Name" optional value={payload.spouse_name} onChange={(v) => updateField("spouse_name", v)} />
          <Field label="Spouse's EPIC" optional value={payload.spouse_epic} onChange={(v) => updateField("spouse_epic", v)} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Send via WhatsApp</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
          <div className="flex min-w-0 flex-1">
            <span className="inline-flex min-h-11 items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-3 text-sm font-medium text-slate-700">
              +91
            </span>
            <input
              className={`${inputClass} min-w-0 flex-1 rounded-l-none rounded-r-lg`}
              placeholder="9876543210"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>
          <button
            type="button"
            onClick={sendWhatsApp}
            disabled={whatsappBusy || saving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 sm:w-auto"
          >
            {whatsappBusy ? "Opening WhatsApp..." : "Send via WhatsApp"}
          </button>
        </div>
        {payload.mobile && (
          <button
            type="button"
            className="mt-2 text-sm text-blue-600 hover:underline"
            onClick={() => setWhatsappNumber(localMobileDigits(payload.mobile))}
          >
            Use mobile from form ({localMobileDigits(payload.mobile) || payload.mobile})
          </button>
        )}
        <p className="mt-2 text-sm text-slate-500">
          Opens the WhatsApp app with a pre-filled message. Only enter the 10-digit number — +91 is
          added automatically. Attach the PDF from Downloads after the chat opens.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  optional,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{formatOptionalLabel(label, optional)}</span>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function DobField({
  dd,
  mm,
  yyyy,
  onChange,
}: {
  dd: string;
  mm: string;
  yyyy: string;
  onChange: (dd: string, mm: string, yyyy: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <span className={labelClass}>Date of Birth</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={dobDayMonthClass}
          placeholder="DD"
          maxLength={2}
          value={dd}
          inputMode="numeric"
          aria-label="Day"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 2);
            onChange(next, mm, yyyy);
          }}
        />
        <span className="select-none text-lg text-slate-400">/</span>
        <input
          className={dobDayMonthClass}
          placeholder="MM"
          maxLength={2}
          value={mm}
          inputMode="numeric"
          aria-label="Month"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 2);
            onChange(dd, next, yyyy);
          }}
        />
        <span className="select-none text-lg text-slate-400">/</span>
        <input
          className={dobYearClass}
          placeholder="YYYY"
          maxLength={4}
          value={yyyy}
          inputMode="numeric"
          aria-label="Year"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 4);
            onChange(dd, mm, next);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">Format: DD / MM / YYYY (e.g. 02 / 02 / 2004)</p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{formatOptionalLabel(label, optional)}</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectOrTypeField({
  label,
  value,
  options,
  onChange,
  optional,
  manualPlaceholder,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  optional?: boolean;
  manualPlaceholder?: string;
}) {
  const selectValue = options.includes(value) ? value : "";

  return (
    <div className="block">
      <span className={labelClass}>{formatOptionalLabel(label, optional)}</span>
      <select
        className={inputClass}
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <input
        className={`${inputClass} mt-2`}
        value={value}
        placeholder={manualPlaceholder ?? "Or type manually"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
