import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pcchiaro.domcibstudios.workers.dev";
  if (baseUrl.includes("localhost") && process.env.NODE_ENV === "production") {
    baseUrl = "https://pcchiaro.domcibstudios.workers.dev";
  }

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/metodo", "/recensioni/"],
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
