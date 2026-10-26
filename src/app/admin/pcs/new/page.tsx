import PcForm from "../pc-form";

export default function NewPcPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-slate-900">
          Nuovo Prodotto PC
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Inserisci i dettagli hardware dell'inserzione. Segnala esplicitamente tutti i componenti non dichiarati.
        </p>
      </div>

      <PcForm />
    </div>
  );
}
