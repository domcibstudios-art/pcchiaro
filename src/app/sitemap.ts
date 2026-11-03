import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pcchiaro.domcibstudios.workers.dev";
  try {
    const h = await headers();
    const host = h.get("host") || h.get("x-forwarded-host");
    const proto = h.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost")) {
      baseUrl = `${proto}://${host}`;
    }
  } catch {
    // Fuori contesto richiesta HTTP
  }

  if (baseUrl.includes("localhost") && process.env.NODE_ENV === "production") {
    baseUrl = "https://pcchiaro.domcibstudios.workers.dev";
  }

  // Pagine statiche principali
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/metodo`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Pagine dinamiche delle recensioni pubblicate
  try {
    const database = await getDb();
    const publishedReviews = await database
      .select({
        slug: reviews.slug,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .where(eq(reviews.status, "published"));

    for (const r of publishedReviews) {
      routes.push({
        url: `${baseUrl}/recensioni/${r.slug}`,
        lastModified: new Date(r.updatedAt),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  } catch (error) {
    console.error("Errore generazione sitemap:", error);
  }

  return routes;
}
