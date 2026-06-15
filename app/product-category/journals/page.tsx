import { redirect } from "next/navigation";

// The "Journals" breadcrumb/links point here, but there was no page at this path (404).
// Redirect to the journals catalogue listing.
export default function JournalsIndexPage() {
  redirect("/catalogues-list");
}
