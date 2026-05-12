const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export default function SeoJsonLd({ additionalNodes = [] }: { additionalNodes?: any[] }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "STM Journals",
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-9810078950",
          contactType: "customer service",
          email: "subscriptions@stmjournals.com",
          availableLanguage: "English"
        },
        sameAs: [
          "https://www.facebook.com/stmjournals",
          "https://twitter.com/stmjournals"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "STM Journals Shop",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/catalogues-list?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      ...additionalNodes
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
