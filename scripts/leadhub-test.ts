/**
 * Signed test request against the LeadHub lead webhook (integration brief §7).
 *
 *   npx tsx scripts/leadhub-test.ts                       # contact_enquiry, TEST-0001
 *   npx tsx scripts/leadhub-test.ts proforma_request TEST-0002
 *
 * Reads LEADHUB_WEBHOOK_URL / LEADHUB_WEBHOOK_SECRET / LEADHUB_SOURCE from the
 * environment — the same vars the app uses, so a green run here proves the app's
 * config is right. Report the external_ids you use to the LeadHub team so they
 * can confirm they landed and clean them up.
 */

import { buildLeadPayload, getLeadhubConfig, postLead, signLeadBody, type LeadEventType } from "../lib/leadhub";

const EVENT_TYPES: LeadEventType[] = ["proforma_request", "contact_enquiry", "subscriber_signup"];

async function main() {
  const eventType = (process.argv[2] as LeadEventType) || "contact_enquiry";
  const externalId = process.argv[3] || "TEST-0001";

  if (!EVENT_TYPES.includes(eventType)) {
    console.error(`Unknown event_type "${eventType}". Expected one of: ${EVENT_TYPES.join(", ")}`);
    process.exit(1);
  }

  const config = getLeadhubConfig();
  if (!config.enabled) {
    console.error("LEADHUB_WEBHOOK_SECRET is not set — nothing to sign with.");
    process.exit(1);
  }

  const payload = buildLeadPayload(
    {
      eventType,
      externalId,
      createdAt: new Date(),
      name: "Test User",
      email: "test@example.com",
      phone: "+91 9999999999",
      institution: "Test University",
      country: "IN",
      designation: "Librarian",
      message: "This is a test lead.",
      journals:
        eventType === "proforma_request"
          ? [{ title: "International Journal on Drones", issn: "1234-5678", qty: 1 }]
          : null,
      currency: eventType === "proforma_request" ? "INR" : null,
      valueEstimate: eventType === "proforma_request" ? 12000 : null,
      sourceUrl: "https://shop.stmjournals.in/get-proforma-invoice-quote"
    },
    config
  );

  const body = JSON.stringify(payload);

  console.log(`POST ${config.url}`);
  console.log(`X-Leadhub-Signature: ${signLeadBody(body, config.secret)}`);
  console.log(body);

  const result = await postLead(payload, config);
  console.log("\n->", JSON.stringify(result, null, 2));

  if (!result.ok) process.exit(1);
  console.log(`\nOK. Tell LeadHub the test external_id was "${payload.external_id}".`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
