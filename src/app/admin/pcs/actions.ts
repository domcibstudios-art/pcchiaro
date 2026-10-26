"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pcs, reviews, curatedAlternatives } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { pcSchema } from "@/lib/validations";
import crypto from "crypto";

export async function savePcAction(prevState: { error?: string } | undefined, formData: FormData) {
  // 1. Verifica autorizzazione server-side
  await requireAdmin();

  const id = (formData.get("id") as string) || crypto.randomUUID();
  const isEditing = Boolean(formData.get("isEditing"));

  // Estrazione componenti non verificati (dalle righe di testo)
  const unverifiedRaw = formData.get("unverifiedSpecs") as string;
  const unverifiedSpecs = unverifiedRaw
    ? unverifiedRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const rawData = {
    id,
    brand: (formData.get("brand") as string)?.trim(),
    modelName: (formData.get("modelName") as string)?.trim(),
    exactConfig: (formData.get("exactConfig") as string)?.trim(),
    category: formData.get("category") as any,
    imageUrl: (formData.get("imageUrl") as string)?.trim() || "",
    imageAlt: (formData.get("imageAlt") as string)?.trim() || "",

    // CPU
    cpuModel: (formData.get("cpuModel") as string)?.trim(),
    cpuGen: (formData.get("cpuGen") as string)?.trim() || null,
    cpuCoresThreads: (formData.get("cpuCoresThreads") as string)?.trim() || null,
    cpuWin11Support: formData.get("cpuWin11Support")
      ? parseInt(formData.get("cpuWin11Support") as string, 10)
      : null,

    // GPU
    gpuModel: (formData.get("gpuModel") as string)?.trim(),
    gpuVramGb: formData.get("gpuVramGb")
      ? parseInt(formData.get("gpuVramGb") as string, 10)
      : null,
    gpuType: formData.get("gpuType") as any,
    gpuDlssFsr: (formData.get("gpuDlssFsr") as string)?.trim() || null,

    // RAM
    ramGb: parseInt(formData.get("ramGb") as string, 10),
    ramType: (formData.get("ramType") as any) || "unknown",
    ramChannel: (formData.get("ramChannel") as any) || "unknown",
    ramSpeedMhz: formData.get("ramSpeedMhz")
      ? parseInt(formData.get("ramSpeedMhz") as string, 10)
      : null,

    // Storage
    storageType: (formData.get("storageType") as any) || "unknown",
    storageCapacityGb: formData.get("storageCapacityGb")
      ? parseInt(formData.get("storageCapacityGb") as string, 10)
      : null,
    storageDetails: (formData.get("storageDetails") as string)?.trim() || null,

    // Scheda madre & Alimentatore
    motherboardChipset: (formData.get("motherboardChipset") as string)?.trim() || null,
    motherboardDetails: (formData.get("motherboardDetails") as string)?.trim() || null,
    psuWattage: formData.get("psuWattage")
      ? parseInt(formData.get("psuWattage") as string, 10)
      : null,
    psuRating: (formData.get("psuRating") as any) || "unknown",
    psuDetails: (formData.get("psuDetails") as string)?.trim() || null,
    coolingDetails: (formData.get("coolingDetails") as string)?.trim() || null,

    // OS
    osInstalled: (formData.get("osInstalled") as string)?.trim() || null,
    osOfficialSupport: formData.get("osOfficialSupport")
      ? parseInt(formData.get("osOfficialSupport") as string, 10)
      : null,

    unverifiedSpecs,
    editorialStatus: (formData.get("editorialStatus") as any) || "draft",
  };

  // Validazione Zod
  const validation = pcSchema.safeParse(rawData);
  if (!validation.success) {
    const errorMsg = validation.error.errors.map((e) => e.message).join(", ");
    return { error: `Errore nei dati inseriti: ${errorMsg}` };
  }

  const validData = validation.data;
  const now = Date.now();

  try {
    if (isEditing) {
      db.update(pcs)
        .set({
          brand: validData.brand,
          modelName: validData.modelName,
          exactConfig: validData.exactConfig,
          category: validData.category,
          imageUrl: validData.imageUrl || null,
          imageAlt: validData.imageAlt || null,
          cpuModel: validData.cpuModel,
          cpuGen: validData.cpuGen || null,
          cpuCoresThreads: validData.cpuCoresThreads || null,
          cpuWin11Support: validData.cpuWin11Support,
          gpuModel: validData.gpuModel,
          gpuVramGb: validData.gpuVramGb || null,
          gpuType: validData.gpuType,
          gpuDlssFsr: validData.gpuDlssFsr || null,
          ramGb: validData.ramGb,
          ramType: validData.ramType || null,
          ramChannel: validData.ramChannel || null,
          ramSpeedMhz: validData.ramSpeedMhz || null,
          storageType: validData.storageType || null,
          storageCapacityGb: validData.storageCapacityGb || null,
          storageDetails: validData.storageDetails || null,
          motherboardChipset: validData.motherboardChipset || null,
          motherboardDetails: validData.motherboardDetails || null,
          psuWattage: validData.psuWattage || null,
          psuRating: validData.psuRating || null,
          psuDetails: validData.psuDetails || null,
          coolingDetails: validData.coolingDetails || null,
          osInstalled: validData.osInstalled || null,
          osOfficialSupport: validData.osOfficialSupport,
          unverifiedSpecs: JSON.stringify(validData.unverifiedSpecs || []),
          editorialStatus: validData.editorialStatus,
          updatedAt: now,
        })
        .where(eq(pcs.id, id))
        .run();
    } else {
      db.insert(pcs)
        .values({
          id,
          brand: validData.brand,
          modelName: validData.modelName,
          exactConfig: validData.exactConfig,
          category: validData.category,
          imageUrl: validData.imageUrl || null,
          imageAlt: validData.imageAlt || null,
          cpuModel: validData.cpuModel,
          cpuGen: validData.cpuGen || null,
          cpuCoresThreads: validData.cpuCoresThreads || null,
          cpuWin11Support: validData.cpuWin11Support,
          gpuModel: validData.gpuModel,
          gpuVramGb: validData.gpuVramGb || null,
          gpuType: validData.gpuType,
          gpuDlssFsr: validData.gpuDlssFsr || null,
          ramGb: validData.ramGb,
          ramType: validData.ramType || null,
          ramChannel: validData.ramChannel || null,
          ramSpeedMhz: validData.ramSpeedMhz || null,
          storageType: validData.storageType || null,
          storageCapacityGb: validData.storageCapacityGb || null,
          storageDetails: validData.storageDetails || null,
          motherboardChipset: validData.motherboardChipset || null,
          motherboardDetails: validData.motherboardDetails || null,
          psuWattage: validData.psuWattage || null,
          psuRating: validData.psuRating || null,
          psuDetails: validData.psuDetails || null,
          coolingDetails: validData.coolingDetails || null,
          osInstalled: validData.osInstalled || null,
          osOfficialSupport: validData.osOfficialSupport,
          unverifiedSpecs: JSON.stringify(validData.unverifiedSpecs || []),
          editorialStatus: validData.editorialStatus,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  } catch (error: any) {
    return { error: `Errore durante il salvataggio: ${error.message}` };
  }

  revalidatePath("/admin/pcs");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/pcs");
}

export async function archivePcAction(id: string) {
  await requireAdmin();
  db.update(pcs)
    .set({ editorialStatus: "archived", updatedAt: Date.now() })
    .where(eq(pcs.id, id))
    .run();

  revalidatePath("/admin/pcs");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deletePcAction(id: string) {
  await requireAdmin();

  // Controlla se il PC è referenziato come alternativa da una recensione
  const alternativeRef = db
    .select()
    .from(curatedAlternatives)
    .where(eq(curatedAlternatives.targetPcId, id))
    .get();

  if (alternativeRef) {
    throw new Error(
      "Impossibile eliminare questo PC: è attualmente referenziato come alternativa consigliata in una recensione. Archivia il prodotto o rimuovi l'alternativa prima di procedere."
    );
  }

  db.delete(pcs).where(eq(pcs.id, id)).run();
  revalidatePath("/admin/pcs");
  revalidatePath("/admin");
  revalidatePath("/");
}
