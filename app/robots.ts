import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/account", "/checkout", "/login", "/register"]
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "Google-Extended", "Claude-Web", "PerplexityBot", "CCBot"],
        allow: ["/product/", "/product-category/", "/about-us", "/contact-us"],
        disallow: ["/api/", "/admin", "/cart", "/checkout"]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
