import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const logoUrl = "https://journals.stmjournals.com/wp-content/uploads/2023/12/c67ba4c3-logo_stm-1.png";
const appUrl = "https://shop.stmjournals.in";

const templatesToUpdate = [
  {
    key: "PROFORMA_CREATED",
    subject: "Proforma Invoice Generated: {{quoteId}} - STM Journals",
    body: `
      <h2 style="margin-bottom:8px; color:#0f172a;">Dear {{contactName}},</h2>
      <p style="margin-top:0; color:#475569;">Greetings from <strong>STM Journals</strong>!</p>
      <p style="color:#475569;">Thank you for your interest in our journal subscription services. Please find below your custom generated quotation details for <strong>{{organization}}</strong>.</p>
      
      <table style="width:100%; background-color:#2563eb; border-radius:12px; margin-top:24px; color:#ffffff;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px;">
            <h3 style="margin:0 0 16px; font-size:14px; text-transform:uppercase; color:#bfdbfe; letter-spacing:1px;">📄 Quotation Details</h3>
            <table style="width:100%; color:#ffffff; font-size:14px;" cellpadding="0" cellspacing="0">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                <td style="padding:12px 0; color:#bfdbfe;">Quotation Number</td>
                <td style="padding:12px 0; text-align:right; font-weight:bold;">{{quoteId}}</td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                <td style="padding:12px 0; color:#bfdbfe;">Institution</td>
                <td style="padding:12px 0; text-align:right; font-weight:bold;">{{organization}}</td>
              </tr>
              <tr>
                <td style="padding:12px 0; color:#bfdbfe;">Validity</td>
                <td style="padding:12px 0; text-align:right; font-weight:bold;">30 Days from Issue</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <h3 style="margin: 25px 0 10px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Selected Subscriptions</h3>
      {{itemsTableHtml}}
      
      {{financialsHtml}}

      <p style="margin-top:24px; text-align:center;"><a href="${appUrl}/checkout?quoteId={{quoteId}}" style="display:inline-block; background-color:#1e40af; color:white; padding:14px 30px; text-decoration:none; border-radius:6px; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Proceed to Secure Checkout →</a></p>
    `,
    description: "Sent to users when their institutional quote setup completes."
  },
  {
    key: "PROFORMA_CREATED_ADMIN",
    subject: "URGENT: New Proforma Quote Generated - #{{quoteId}}",
    body: `
      <h2 style="color:#0f172a;">New B2B Quote Alert</h2>
      <p>A new institutional Proforma Invoice has just been generated in the system.</p>
      
      <div style="background-color:#f1f5f9; border-left:4px solid #eab308; padding:16px; border-radius:4px; margin-bottom:20px;">
        <strong style="color:#854d0e;">Lead Overview:</strong><br/>
        <strong>Organization:</strong> {{organization}}<br/>
        <strong>Contact:</strong> {{contactName}} (<a href="mailto:{{email}}">{{email}}</a>)<br/>
        <strong>Phone:</strong> {{phone}}
      </div>
      
      <h3 style="margin: 20px 0 8px; color: #0f172a;">Quote Reference: {{quoteId}}</h3>
      
      {{itemsTableHtml}}
      
      {{financialsHtml}}
      
      <p style="margin-top: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        Admin action requested: Track potential follow-up or review against ledger.
      </p>
    `,
    description: "Alert sent to backend administration when new quotes are submitted."
  }
];

async function run() {
  console.log("Starting Database Email Sync for B2B quote tables...");
  try {
    for (const t of templatesToUpdate) {
      console.log(`Syncing template key: ${t.key}...`);
      await prisma.emailTemplate.upsert({
        where: { key: t.key },
        update: {
          subject: t.subject,
          body: t.body,
          description: t.description
        },
        create: t
      });
      console.log(`✅ Done key: ${t.key}`);
    }
    console.log("Email sync accomplished successfully!");
  } catch (e) {
    console.error("❌ Execution failure:", e);
  } finally {
    await prisma.$disconnect();
  }
}

void run();
