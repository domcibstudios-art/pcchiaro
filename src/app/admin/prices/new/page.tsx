import { getDb } from "@/db";
import { pcs } from "@/db/schema";
import PriceForm from "../price-form";

export const dynamic = "force-dynamic";

export default async function NewPriceOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ pcId?: string }>;
}) {
  const params = await searchParams;
  const database = await getDb();

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
          Nuova Offerta Commerciale
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Registra il rivenditore, il prezzo controllato e l'URL di destinazione per un PC del catalogo.
        </p>
      </div>

      <PriceForm availablePcs={availablePcs} defaultPcId={params.pcId} />
    </div>
  );
}
