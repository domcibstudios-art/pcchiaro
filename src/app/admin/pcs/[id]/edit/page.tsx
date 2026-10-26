import { notFound } from "next/navigation";
import { db } from "@/db";
import { pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import PcForm from "../../pc-form";

export const dynamic = "force-dynamic";

export default async function EditPcPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pc = db.select().from(pcs).where(eq(pcs.id, id)).get();

  if (!pc) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Modifica Scheda PC: {pc.modelName}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID: {pc.id} &bull; Creato: {new Date(pc.createdAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      <PcForm initialData={pc} isEditing={true} />
    </div>
  );
}
