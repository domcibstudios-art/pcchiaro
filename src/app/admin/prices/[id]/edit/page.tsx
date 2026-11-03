import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { priceOffers, pcs } from "@/db/schema";
import { eq } from "drizzle-orm";
import PriceForm from "../../price-form";

export const dynamic = "force-dynamic";

export default async function EditPriceOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const database = await getDb();
  const rows = await database.select().from(priceOffers).where(eq(priceOffers.id, id)).limit(1);
  const offer = rows && rows.length > 0 ? rows[0] : null;

  if (!offer) notFound();

  const availablePcs = await database
    .select({
      id: pcs.id,
      brand: pcs.brand,
      modelName: pcs.modelName,
    })
    .from(pcs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Modifica Offerta Commerciale
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          ID: {offer.id} &bull; Ultima verifica: {new Date(offer.lastVerifiedAt).toLocaleDateString("it-IT")}
        </p>
      </div>

      <PriceForm availablePcs={availablePcs} initialData={offer} isEditing={true} />
    </div>
  );
}
