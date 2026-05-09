const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

export default function SeoJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "STM Journals",
        url: siteUrl,
        logo: `${siteUrl}/favicon.ico`
      },
      {
        "@type": "WebSite",
        name: "STM Journals Shop",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/catalogues-list?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
