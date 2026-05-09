import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/app/components/cart-store";
import SiteShell from "@/app/components/site-shell";
import SeoJsonLd from "@/app/seo-jsonld";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "STM Journals | Journal Subscriptions, Catalogues & Proforma Quotes",
    template: "%s | STM Journals"
  },
  description:
    "Browse STM journal subscriptions, domain-wise catalogues, and request institutional proforma invoices online.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "STM Journals",
    description:
      "Journal subscriptions, catalogues, and institutional proforma quote management.",
    siteName: "STM Journals"
  },
  twitter: {
    card: "summary_large_image",
    title: "STM Journals",
    description:
      "Journal subscriptions, catalogues, and institutional proforma quote management."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1
    }
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SeoJsonLd />
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
