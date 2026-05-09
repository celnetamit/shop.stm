import { loadJournals } from "@/lib/journal-data";
import ProformaQuoteClient from "@/app/get-proforma-invoice-quote/proforma-quote-client";
import { getCurrentSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProformaQuotePage() {
  const [rows, session] = await Promise.all([loadJournals(), getCurrentSession()]);
  const journals = rows.map((item) => ({
    serialNo: item["S/No"],
    subject: item.Subject,
    journalName: item["Journal Name"],
    abbreviation: item.Abbreviation,
    issn: item.issn,
    frequency: item.frequency,
    printInr: item["Subscription\n[Print]"],
    onlineInr: item["Subscription\n[Online]"],
    combinedInr: item["Subscription\n[Print+Online]"],
    printUsd: item["Subscription\n[Print] USD"],
    onlineUsd: item["Subscription\n[Online] USD"],
    combinedUsd: item["Subscription\n[Print+Online] USD"]
  }));

  return <ProformaQuoteClient journals={journals} canUsePubSubscription={session?.role === "ADMIN"} />;
}
