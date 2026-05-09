import { getClonedPath } from "@/lib/clone-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const page = await getClonedPath("/");

  return (
    <main className="clone-wrapper">
      <div className="clone-banner">Mirrored from {page.sourceUrl} ({page.cached ? "cached in PostgreSQL" : "live mode, DB unavailable"})</div>
      <div dangerouslySetInnerHTML={{ __html: page.htmlContent }} />
    </main>
  );
}
