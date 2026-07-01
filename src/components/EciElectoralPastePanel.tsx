"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatEciElectoralSummary,
  parseEciElectoralPaste,
  type ParsedEciElectoralRecord,
} from "@/lib/eciElectoralPasteParser";
import { createFormFromEciElectoral } from "@/lib/clientForms";
import { btnPrimary, btnSecondary, inputClass, labelClass, sectionClass } from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";

export function EciElectoralPastePanel() {
  const router = useRouter();
  const [pasteText, setPasteText] = useState("");
  const [records, setRecords] = useState<ParsedEciElectoralRecord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [parsed, setParsed] = useState(false);
  const [starting, setStarting] = useState(false);

  function handleParse() {
    const result = parseEciElectoralPaste(pasteText);
    setRecords(result.records);
    setErrors(result.errors);
    setSelectedIndex(0);
    setParsed(true);
  }

  async function startForm(record: ParsedEciElectoralRecord) {
    setStarting(true);
    try {
      const form = await createFormFromEciElectoral(record);
      router.push(`/forms/edit?id=${form.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create form");
    } finally {
      setStarting(false);
    }
  }

  const selected = records[selectedIndex];

  return (
    <section className={`${sectionClass} border-dashed bg-slate-50/80`}>
      <h2 className="mb-1 text-lg font-semibold text-slate-900">
        Paste from ECI Electoral Search
      </h2>
      <p className="mb-3 text-sm text-slate-600">
        Search any voter on{" "}
        <a
          href="https://electoralsearch.eci.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          electoralsearch.eci.gov.in
        </a>{" "}
        (Search by EPIC), open <strong>View Details</strong>, and paste the row here. Telugu
        name lines are ignored automatically. Works for voters outside your local AC list.
      </p>

      <label className="block">
        <span className={labelClass}>Pasted voter details</span>
        <textarea
          className={`${inputClass} min-h-[120px] font-mono text-xs`}
          value={pasteText}
          placeholder={`Example (copy from View Details):\n1\tBYX1772995\tRbhagayamma R\n...\t65\tRagaswami R\n...\tTelangana\t17-Hyderabad\t62-Sanathnagar\t150-Balkampet\t...\t17`}
          onChange={(e) => {
            setPasteText(e.target.value);
            setParsed(false);
          }}
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={handleParse} className={btnPrimary}>
          Parse paste
        </button>
        <button
          type="button"
          onClick={() => {
            setPasteText("");
            setRecords([]);
            setErrors([]);
            setParsed(false);
          }}
          className={btnSecondary}
        >
          Clear
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err) => (
            <StatusMessage key={err} variant="warning">
              {err}
            </StatusMessage>
          ))}
        </div>
      )}

      {parsed && records.length > 0 && (
        <div className="mt-4 space-y-3">
          {records.length > 1 && (
            <label className="block text-sm">
              <span className={labelClass}>Multiple records found — select one</span>
              <select
                className={inputClass}
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
              >
                {records.map((r, i) => (
                  <option key={i} value={i}>
                    {formatEciElectoralSummary(r)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selected && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{selected.name}</p>
              <p>EPIC: {selected.epic}</p>
              <p>
                Part {selected.part_no}, Sr {selected.serial_no} — {selected.ac_name}
              </p>
              <button
                type="button"
                onClick={() => startForm(selected)}
                disabled={starting}
                className={`${btnPrimary} mt-3 w-full sm:w-auto`}
              >
                {starting ? "Opening form..." : "Start Form"}
              </button>
            </div>
          )}
        </div>
      )}

      {parsed && records.length === 0 && errors.length === 0 && (
        <StatusMessage variant="warning">
          Could not parse any voter from the paste. Check the format and try again.
        </StatusMessage>
      )}
    </section>
  );
}
