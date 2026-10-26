import { requireAdmin } from "@/lib/session";
import ImportClient from "./import-client";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
          Importazione Intelligente da Amazon.it
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Estrai automaticamente scheda tecnica del PC, bozza di recensione editoriale, fonti e offerta a partire dal link Amazon o dal codice HTML.
        </p>
      </div>

      <ImportClient />
    </div>
  );
}
