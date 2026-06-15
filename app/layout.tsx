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
  keywords: ["STM Journals", "Academic Publishing", "Peer-reviewed journals", "Scientific journals", "Medical research journals", "Library subscriptions", "Scholarly marketplace"],
  authors: [{ name: "Consortium eLearning Network Pvt. Ltd." }],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "STM Journals | Scholarly Publishing Marketplace",
    description:
      "Access premium peer-reviewed journal subscriptions, catalogues, and institutional proforma quote management in Science, Technology, and Medicine.",
    siteName: "STM Journals",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "STM Journals",
    description:
      "Browse peer-reviewed scholarly journal subscriptions and institutional catalogs."
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint to avoid a light->dark flash (FOUC).
            Mirrors the "stm-theme" key used by the theme toggle in site-shell. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('stm-theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();"
          }}
        />
      </head>
      <body>
        <SeoJsonLd />
        <CartProvider>
          <SiteShell>{children}</SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
