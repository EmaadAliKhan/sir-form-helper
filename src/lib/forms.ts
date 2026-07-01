import { randomUUID } from "crypto";
import { getDb } from "./db";
import { normalizeFormPayload, type FormPayload, type FormRecord } from "./types";

export function listForms(): FormRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, voter_2025_epic, voter_2025_name, booth_no, payload, created_at, updated_at FROM forms ORDER BY updated_at DESC"
    )
    .all() as Array<{
    id: string;
    voter_2025_epic: string;
    voter_2025_name: string;
    booth_no: number;
    payload: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    ...row,
    payload: normalizeFormPayload(JSON.parse(row.payload) as FormPayload),
  }));
}

export function getForm(id: string): FormRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, voter_2025_epic, voter_2025_name, booth_no, payload, created_at, updated_at FROM forms WHERE id = ?"
    )
    .get(id) as
    | {
        id: string;
        voter_2025_epic: string;
        voter_2025_name: string;
        booth_no: number;
        payload: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) return null;
  return { ...row, payload: normalizeFormPayload(JSON.parse(row.payload) as FormPayload) };
}

export function createForm(input: {
  voter_2025_epic: string;
  voter_2025_name: string;
  booth_no: number;
  payload: FormPayload;
}): FormRecord {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO forms (id, voter_2025_epic, voter_2025_name, booth_no, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.voter_2025_epic,
    input.voter_2025_name,
    input.booth_no,
    JSON.stringify(input.payload),
    now,
    now
  );

  return getForm(id)!;
}

export function updateForm(
  id: string,
  payload: FormPayload,
  meta?: { voter_2025_name?: string; voter_2025_epic?: string; booth_no?: number }
): FormRecord | null {
  const existing = getForm(id);
  if (!existing) return null;

  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE forms SET payload = ?, voter_2025_name = ?, voter_2025_epic = ?, booth_no = ?, updated_at = ? WHERE id = ?`
  ).run(
    JSON.stringify(payload),
    meta?.voter_2025_name ?? existing.voter_2025_name,
    meta?.voter_2025_epic ?? existing.voter_2025_epic,
    meta?.booth_no ?? existing.booth_no,
    now,
    id
  );

  return getForm(id);
}

export function deleteForm(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM forms WHERE id = ?").run(id);
  return result.changes > 0;
}

export function findDraftByEpic(epic: string): FormRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT id, voter_2025_epic, voter_2025_name, booth_no, payload, created_at, updated_at FROM forms WHERE voter_2025_epic = ? ORDER BY updated_at DESC LIMIT 1"
    )
    .get(epic) as
    | {
        id: string;
        voter_2025_epic: string;
        voter_2025_name: string;
        booth_no: number;
        payload: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) return null;
  return { ...row, payload: normalizeFormPayload(JSON.parse(row.payload) as FormPayload) };
}
