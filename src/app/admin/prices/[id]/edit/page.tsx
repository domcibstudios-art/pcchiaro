import { notFound } from "next/navigation";
import { db } from "@/db";
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
  const offer = db.select().from(priceOffers).where(eq(priceOffers.id, id)).get();

  if (!offer) notFound();

  const availablePcs = db
    .select({
      id: pcs.id,
      brand: pcs.brand,
      modelName: pcs.modelName,
    })
    .from(pcs)
    .all();

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
