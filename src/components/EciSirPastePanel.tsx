"use client";

import { useState } from "react";
import {
  formatParsedRecordSummary,
  manualBlockFromParsed,
  parseEciSirPaste,
  type ParsedEciSirRecord,
} from "@/lib/eciSirPasteParser";
import type { Manual2002Block } from "@/lib/types";
import { btnPrimary, btnSecondary, inputClass, labelClass, sectionClass } from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";

export function EciSirPastePanel({
  onApply,
}: {
  onApply: (block: Manual2002Block) => void;
}) {
  const [pasteText, setPasteText] = useState("");
  const [records, setRecords] = useState<ParsedEciSirRecord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [parsed, setParsed] = useState(false);

  function handleParse() {
    const result = parseEciSirPaste(pasteText);
    setRecords(result.records);
    setErrors(result.errors);
    setSelectedIndex(0);
    setParsed(true);
  }

  function handleApply() {
    const record = records[selectedIndex];
    if (!record) return;
    onApply(manualBlockFromParsed(record));
    setParsed(false);
    setPasteText("");
    setRecords([]);
    setErrors([]);
  }

  const selected = records[selectedIndex];

  return (
    <div className={`${sectionClass} mt-4 border-dashed bg-slate-50/80`}>
      <h3 className="mb-1 text-base font-semibold text-slate-900">
        Paste from ECI SIR portal
      </h3>
      <p className="mb-3 text-sm text-slate-600">
        Copy one or more rows from{" "}
        <a
          href="https://voters.eci.gov.in/searchinsir/s2ua4dpdf-jk4qwodse"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          voters.eci.gov.in SIR search
        </a>{" "}
        and paste below. Regional-language district names are left blank when we cannot
        map them — fill the English district name in the form after applying.
      </p>

      <label className="block">
        <span className={labelClass}>Pasted SIR data</span>
        <textarea
          className={`${inputClass} min-h-[120px] font-mono text-xs`}
          value={pasteText}
          placeholder={`Example:\n1\nm.a, basit\nm.a. majid\nFather\t32\tTelangana\tహైదరాబాద్\t208 - Sanathnagar\t207 -Fathenagar\t180`}
          onChange={(e) => {
            setPasteText(e.target.value);
            setParsed(false);
          }}
        />
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleParse}
          disabled={!pasteText.trim()}
          className={`${btnSecondary} w-full sm:w-auto`}
        >
          Parse paste
        </button>
        {parsed && records.length > 0 && (
          <button type="button" onClick={handleApply} className={`${btnPrimary} w-full sm:w-auto`}>
            Apply to form
          </button>
        )}
      </div>

      {parsed && errors.length > 0 && (
        <div className="mt-3 space-y-2">
          {errors.map((err) => (
            <StatusMessage key={err} variant="warning">
              {err}
            </StatusMessage>
          ))}
        </div>
      )}

      {parsed && records.length === 0 && errors.length === 0 && (
        <StatusMessage variant="warning">No records found in paste.</StatusMessage>
      )}

      {parsed && records.length > 0 && (
        <div className="mt-4 space-y-3">
          {records.length > 1 && (
            <p className="text-sm font-medium text-slate-700">
              {records.length} records found — select one to apply:
            </p>
          )}

          <ul className="space-y-2">
            {records.map((record, index) => {
              const inputId = `eci-paste-record-${index}`;
              return (
                <li key={index}>
                  <label
                    htmlFor={inputId}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                      selectedIndex === index
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    {records.length > 1 && (
                      <input
                        id={inputId}
                        type="radio"
                        name="eci-paste-record"
                        className="mt-1 shrink-0"
                        checked={selectedIndex === index}
                        onChange={() => setSelectedIndex(index)}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">
                        {formatParsedRecordSummary(record)}
                      </span>
                      {record.warnings.length > 0 && (
                        <span className="mt-1 block text-xs text-amber-700">
                          {record.warnings.join(" ")}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {selected && records.length === 1 && selected.warnings.length > 0 && (
            <StatusMessage variant="info">
              Parsed with notes: {selected.warnings.join(" ")}
            </StatusMessage>
          )}
        </div>
      )}
    </div>
  );
}
