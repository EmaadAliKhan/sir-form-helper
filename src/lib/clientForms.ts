import { randomUUID } from "@/lib/uuid";
import {
  defaultDeclarationPayload,
  defaultPayloadFromVoter,
  normalizeFormPayload,
  type FormPayload,
  type FormRecord,
  type Voter2025,
} from "./types";
import { getAppSettings } from "./clientSettings";
import { defaultPayloadFromEciElectoral, type ParsedEciElectoralRecord } from "./eciElectoralPasteParser";

const FORMS_KEY = "sir_forms";

function readAll(): FormRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FORMS_KEY);
    if (!raw) return [];
    const rows = JSON.parse(raw) as FormRecord[];
    return rows.map((row) => ({
      ...row,
      payload: normalizeFormPayload(row.payload),
    }));
  } catch {
    return [];
  }
}

function writeAll(forms: FormRecord[]): boolean {
  try {
    localStorage.setItem(FORMS_KEY, JSON.stringify(forms));
    return true;
  } catch {
    return false;
  }
}

export function listForms(): FormRecord[] {
  return readAll().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getForm(id: string): FormRecord | null {
  return readAll().find((f) => f.id === id) ?? null;
}

export function findDraftByEpic(epic: string): FormRecord | null {
  const upper = epic.toUpperCase();
  return (
    readAll()
      .filter((f) => f.voter_2025_epic.toUpperCase() === upper)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ??
    null
  );
}

export function createForm(input: {
  voter_2025_epic: string;
  voter_2025_name: string;
  booth_no: number;
  payload: FormPayload;
}): FormRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const form: FormRecord = {
    id,
    voter_2025_epic: input.voter_2025_epic,
    voter_2025_name: input.voter_2025_name,
    booth_no: input.booth_no,
    payload: normalizeFormPayload(input.payload),
    created_at: now,
    updated_at: now,
  };
  if (!writeAll([form, ...readAll()])) {
    throw new Error("Could not save form — browser storage may be full. Delete old forms and try again.");
  }
  return form;
}

export function updateForm(
  id: string,
  payload: FormPayload,
  meta?: { voter_2025_name?: string; voter_2025_epic?: string; booth_no?: number }
): FormRecord | null {
  const forms = readAll();
  const idx = forms.findIndex((f) => f.id === id);
  if (idx < 0) return null;
  const existing = forms[idx];
  const updated: FormRecord = {
    ...existing,
    payload: normalizeFormPayload(payload),
    voter_2025_name: meta?.voter_2025_name ?? existing.voter_2025_name,
    voter_2025_epic: meta?.voter_2025_epic ?? existing.voter_2025_epic,
    booth_no: meta?.booth_no ?? existing.booth_no,
    updated_at: new Date().toISOString(),
  };
  forms[idx] = updated;
  if (!writeAll(forms)) return null;
  return updated;
}

export function deleteForm(id: string): boolean {
  const forms = readAll();
  const next = forms.filter((f) => f.id !== id);
  if (next.length === forms.length) return false;
  return writeAll(next);
}

export async function createDeclarationForm(): Promise<FormRecord> {
  const settings = await getAppSettings();
  return createForm({
    voter_2025_epic: "",
    voter_2025_name: "Declaration form",
    booth_no: 0,
    payload: { ...defaultDeclarationPayload(settings), form_kind: "declaration" },
  });
}

export async function createFormFromEpic(epic: string, voter?: Voter2025): Promise<FormRecord> {
  const settings = await getAppSettings();
  const existing = findDraftByEpic(epic);
  if (existing) return existing;

  if (!voter) {
    throw new Error(
      "Voter not found in local 2025 list. Use ECI Electoral Search paste instead."
    );
  }

  return createForm({
    voter_2025_epic: voter.epic,
    voter_2025_name: voter.name,
    booth_no: voter.booth_no,
    payload: defaultPayloadFromVoter(voter, settings),
  });
}

export async function createFormFromEciElectoral(
  record: ParsedEciElectoralRecord
): Promise<FormRecord> {
  const settings = await getAppSettings();
  const existing = findDraftByEpic(record.epic);
  if (existing) return existing;

  const partNo = Number(record.part_no) || 0;
  return createForm({
    voter_2025_epic: record.epic.toUpperCase(),
    voter_2025_name: record.name,
    booth_no: partNo,
    payload: defaultPayloadFromEciElectoral(record, settings),
  });
}
