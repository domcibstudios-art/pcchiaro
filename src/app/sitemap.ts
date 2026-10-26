import type { MetadataRoute } from "next";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pcchiaro.it";

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
    const publishedReviews = db
      .select({
        slug: reviews.slug,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
      .where(eq(reviews.status, "published"))
      .all();

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
