"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import type { AppSettings } from "@/lib/types";
import { EciElectoralPastePanel } from "@/components/EciElectoralPastePanel";
import { createDeclarationForm } from "@/lib/clientForms";
import { getAppSettings } from "@/lib/clientSettings";
import {
  btnPrimary,
  sectionClass,
  sectionTitleClass,
} from "@/lib/ui";

export function VoterPicker() {
  const router = useRouter();
  const { isAdminUser } = useAuth();
  const [show2025Search, setShow2025Search] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [startingDeclaration, setStartingDeclaration] = useState(false);

  useEffect(() => {
    getAppSettings(isAdminUser).then((data: AppSettings) => {
      setShow2025Search(data.show_2025_search ?? false);
      setSettingsLoaded(true);
    });
  }, [isAdminUser]);

  async function startDeclarationForm() {
    setStartingDeclaration(true);
    try {
      const form = await createDeclarationForm();
      router.push(`/forms/edit?id=${form.id}`);
    } finally {
      setStartingDeclaration(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={`${sectionClass} border-dashed bg-slate-50/80`}>
        <h2 className={sectionTitleClass}>Declaration form (no voter selected)</h2>
        <p className="mb-4 text-sm text-slate-600">
          Same enumeration form layout, but without picking someone from a voter list. Use for
          persons who need a declaration-only submission — fill SIR mapping and personal details
          in the editor.
        </p>
        <button
          type="button"
          onClick={startDeclarationForm}
          disabled={startingDeclaration}
          className={`${btnPrimary} w-full sm:w-auto`}
        >
          {startingDeclaration ? "Opening form..." : "Start declaration form"}
        </button>
      </section>

      <EciElectoralPastePanel />

      {settingsLoaded && show2025Search && (
        <section className={sectionClass}>
          <h2 className={sectionTitleClass}>Search 2025 Voter List</h2>
          <p className="text-sm text-slate-600">
            The local 2025 voter database is not available on the hosted site. Use{" "}
            <strong>Paste from ECI Electoral Search</strong> above, or run the app locally with CSV
            import for booth search.
          </p>
        </section>
      )}
    </div>
  );
}
