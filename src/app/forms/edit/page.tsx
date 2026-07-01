"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FormEditor } from "@/components/FormEditor";

function FormEditInner() {
  const params = useSearchParams();
  const id = params.get("id");
  if (!id) {
    return <p className="text-sm text-slate-600">Missing form id.</p>;
  }
  return <FormEditor formId={id} />;
}

export default function FormEditPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading form...</p>}>
      <FormEditInner />
    </Suspense>
  );
}
