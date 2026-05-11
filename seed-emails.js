const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Email Templates...");
  const defaults = [
    {
      key: "USER_WELCOME",
      subject: "Welcome to STM Journals, {{name}}!",
      body: `<h1>Welcome Aboard!</h1><p>Hi {{name}}, thank you for registering at STM Journals.</p>`,
      description: "Sent to newly registered customers."
    },
    {
      key: "USER_WELCOME_ADMIN",
      subject: "New User Alert: {{name}} has registered",
      body: `<h3>User Registration</h3><p>A new user has joined the platform.</p><ul><li>Name: {{name}}</li><li>Email: {{email}}</li></ul>`,
      description: "Notification alert dispatched to administrators upon new accounts."
    },
    {
      key: "ORDER_CONFIRMED",
      subject: "Order Confirmed #{{orderId}}",
      body: `<h2>Thank you for your order!</h2><p>Hello {{name}}, your order total is {{currency}} {{total}}.</p>`,
      description: "Order receipt dispatch intended for user consumption."
    },
    {
      key: "ORDER_CONFIRMED_ADMIN",
      subject: "URGENT: New Order Placed #{{orderId}}",
      body: `<h3>Transactional Notification</h3><p>User {{name}} placed order worth {{currency}} {{total}}.</p>`,
      description: "Financial and fulfillment prompt routed to logistics administration."
    },
    {
      key: "CONTACT_RECEIVED",
      subject: "We've received your enquiry",
      body: `<h3>Hello {{name}}</h3><p>Thanks for contacting us. We'll review your message about '{{subject}}' shortly.</p>`,
      description: "Verification note routed back to external general contact attempts."
    },
    {
      key: "CONTACT_RECEIVED_ADMIN",
      subject: "Website Enquiry from {{name}}",
      body: `<h3>General Enquiry Details</h3><p><strong>From:</strong> {{name}} ({{email}})</p><p><strong>Message:</strong></p><blockquote>{{message}}</blockquote>`,
      description: "Detailed routing alert containing entire form body forwarded to CS desk."
    },
    {
      key: "AGENCY_RECEIVED",
      subject: "Agency Proposal Submitted - STM Journals",
      body: `<h3>Confirmation</h3><p>Thank you {{name}}, your proposal for '{{agencyName}}' is in review.</p>`,
      description: "Acknowledgement confirm for b2b institutional partner queries."
    },
    {
      key: "AGENCY_RECEIVED_ADMIN",
      subject: "New Agency Collaboration Lead - {{agencyName}}",
      body: `<h3>B2B Lead Capture</h3><p><strong>Agency:</strong> {{agencyName}}</p><p><strong>Representative:</strong> {{name}}</p><p><strong>Domain:</strong> {{specialization}}</p>`,
      description: "Direct procurement routing pipeline message dispatched to administrative hub."
    }
  ];

  for (const item of defaults) {
    await prisma.emailTemplate.upsert({
      where: { key: item.key },
      update: {},
      create: item
    });
    console.log(`✅ Upserted: ${item.key}`);
  }
  console.log("🎉 Seed Completed Successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
