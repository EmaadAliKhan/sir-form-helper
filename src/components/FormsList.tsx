"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormRecord } from "@/lib/types";
import { deleteForm, listForms } from "@/lib/clientForms";
import { btnPrimary, btnSecondary, sectionClass, sectionTitleClass } from "@/lib/ui";
import { StatusMessage } from "@/components/StatusMessage";

export function FormsList() {
  const router = useRouter();
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletedFlash, setDeletedFlash] = useState(false);

  useEffect(() => {
    setForms(listForms());
    setLoading(false);
  }, []);

  function remove(id: string) {
    if (!confirm("Delete this draft?")) return;
    setDeletingId(id);
    try {
      deleteForm(id);
      setForms((prev) => prev.filter((f) => f.id !== id));
      setDeletedFlash(true);
      setTimeout(() => setDeletedFlash(false), 2500);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className={`${sectionClass} overflow-hidden p-0`}>
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h1 className={`${sectionTitleClass} mb-0 text-xl sm:text-2xl`}>Saved Drafts</h1>
        <p className="mt-1 text-xs text-slate-500">Drafts are stored in this browser only.</p>
      </div>

      {deletedFlash && (
        <div className="border-b border-emerald-100 px-4 py-3 sm:px-5">
          <StatusMessage variant="success">Draft deleted.</StatusMessage>
        </div>
      )}

      {loading && (
        <p className="px-4 py-8 text-center text-sm text-slate-500">Loading drafts...</p>
      )}

      <div className="divide-y divide-slate-100 md:hidden">
        {!loading &&
          forms.map((form) => (
            <article key={form.id} className="space-y-3 px-4 py-4">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {form.voter_2025_name}
                  {form.payload.form_kind === "declaration" && (
                    <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      Declaration
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  {form.payload.form_kind === "declaration"
                    ? form.payload.epic || "No EPIC"
                    : form.voter_2025_epic}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-slate-600">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Booth</dt>
                  <dd>{form.booth_no}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Updated</dt>
                  <dd className="break-words">{new Date(form.updated_at).toLocaleString()}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push(`/forms/edit?id=${form.id}`)}
                  className={`${btnPrimary} w-full`}
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => remove(form.id)}
                  disabled={deletingId !== null}
                  className={`${btnSecondary} w-full border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60`}
                >
                  {deletingId === form.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
        {!loading && forms.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No drafts yet.</p>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm text-slate-800">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">EPIC</th>
              <th className="px-4 py-3">Booth</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              forms.map((form) => (
                <tr key={form.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">
                    {form.voter_2025_name}
                    {form.payload.form_kind === "declaration" && (
                      <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Declaration
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {form.payload.form_kind === "declaration"
                      ? form.payload.epic || "—"
                      : form.voter_2025_epic}
                  </td>
                  <td className="px-4 py-3">{form.booth_no}</td>
                  <td className="px-4 py-3">{new Date(form.updated_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/forms/edit?id=${form.id}`)}
                      className="mr-3 text-blue-600 hover:underline"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(form.id)}
                      disabled={deletingId !== null}
                      className="min-h-11 text-red-600 hover:underline disabled:opacity-60"
                    >
                      {deletingId === form.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && forms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No drafts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
