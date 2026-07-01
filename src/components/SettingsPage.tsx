"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AppSettings } from "@/lib/types";
import {
  downloadSiteConfig,
  getAppSettings,
  invalidateSiteConfigCache,
  saveLocalSettings,
} from "@/lib/clientSettings";
import { btnPrimary, btnSecondary, inputClass, labelClass, sectionClass, sectionTitleClass } from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";

export function SettingsPage() {
  const { isAdminUser } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [boothKey, setBoothKey] = useState("150");
  const [bloName, setBloName] = useState("");
  const [bloContact, setBloContact] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bloSetFlash, setBloSetFlash] = useState<string | null>(null);

  useEffect(() => {
    getAppSettings(isAdminUser).then((data) => {
      setSettings(data);
      const blo = data.blo_by_booth["150"];
      if (blo) {
        setBloName(blo.name);
        setBloContact(blo.contact);
      }
    });
  }, [isAdminUser]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      saveLocalSettings(settings);
      invalidateSiteConfigCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  function saveBloForBooth() {
    if (!settings) return;
    updateField("blo_by_booth", {
      ...settings.blo_by_booth,
      [boothKey]: { name: bloName, contact: bloContact },
    });
    setBloSetFlash(boothKey);
    setTimeout(() => setBloSetFlash(null), 2500);
  }

  if (!settings) return <p>Loading settings...</p>;

  return (
    <div className="space-y-6 text-slate-900">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Settings</h1>
      <p className="text-sm text-slate-600">
        Settings are saved in this browser. BLO defaults and AC constants apply to new forms you
        create here.
      </p>
      {saved && <StatusMessage variant="success">All settings saved.</StatusMessage>}

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>2025 List Defaults</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="AC Name" value={settings.ac_name_2025} onChange={(v) => updateField("ac_name_2025", v)} />
          <Field label="AC No" value={settings.ac_no_2025} onChange={(v) => updateField("ac_no_2025", v)} />
          <Field label="State" value={settings.state_2025} onChange={(v) => updateField("state_2025", v)} />
        </div>
      </section>

      {isAdminUser && (
        <section className={sectionClass}>
          <h2 className={sectionTitleClass}>Home Page (admin only)</h2>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={settings.show_2025_search}
              onChange={(e) => updateField("show_2025_search", e.target.checked)}
            />
            <span>
              Show 2025 voter-list section on the home page (off by default on hosted site; still
              requires local CSV data to search).
            </span>
          </label>
          <div className="mt-3">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => downloadSiteConfig(settings.show_2025_search)}
            >
              Download site-config.json
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Replace <code>public/site-config.json</code>, commit, and push so all visitors see this
              toggle state.
            </p>
          </div>
        </section>
      )}

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>2002 SIR Defaults</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="AC Name" value={settings.ac_name_2002} onChange={(v) => updateField("ac_name_2002", v)} />
          <Field label="AC No" value={settings.ac_no_2002} onChange={(v) => updateField("ac_no_2002", v)} />
          <Field label="District" value={settings.district_2002} onChange={(v) => updateField("district_2002", v)} />
          <Field label="State" value={settings.state_2002} onChange={(v) => updateField("state_2002", v)} />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>BLO by Booth</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Booth / Part No" value={boothKey} onChange={setBoothKey} />
          <Field label="BLO Name" value={bloName} onChange={setBloName} />
          <Field label="BLO Contact" value={bloContact} onChange={setBloContact} />
        </div>
        <button type="button" onClick={saveBloForBooth} className={`${btnSecondary} mt-3`}>
          Set BLO for booth {boothKey}
        </button>
        {bloSetFlash && (
          <StatusMessage variant="success">BLO saved for booth {bloSetFlash} (click Save All below).</StatusMessage>
        )}
      </section>

      <button onClick={save} disabled={saving} className={btnPrimary}>
        {saving ? "Saving..." : "Save All Settings"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
