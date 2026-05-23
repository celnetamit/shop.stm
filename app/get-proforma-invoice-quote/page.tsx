import { getJournalCatalog } from "@/lib/journal-catalog";
import ProformaQuoteClient from "@/app/get-proforma-invoice-quote/proforma-quote-client";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProformaQuotePage() {
  const [catalogItems, session] = await Promise.all([getJournalCatalog(), getCurrentSession()]);
  const journals = catalogItems.map((item) => ({
    serialNo: Number(item.id),
    subject: item.subject,
    journalName: item.journalName,
    abbreviation: item.abbreviation,
    issn: item.issn,
    frequency: item.frequency,
    printInr: item.printInr,
    onlineInr: item.onlineInr,
    combinedInr: item.combinedInr,
    printUsd: item.printUsd,
    onlineUsd: item.onlineUsd,
    combinedUsd: item.combinedUsd,
    publisher: item.publisher,
    imprint: item.imprint,
    address: item.address,
    publisherEmail: item.publisherEmail,
    publisherContactNumber: item.publisherContactNumber
  }));

  return <ProformaQuoteClient journals={journals} canUsePubSubscription={session?.role === "ADMIN"} isAuthenticated={!!session} />;
}
