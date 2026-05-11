import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "./prisma";

let _sesClient: SESClient | null = null;

function getSesClient() {
  if (!_sesClient) {
    _sesClient = new SESClient({
      region: process.env.AWS_REGION || "us-west-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return _sesClient;
}

function getFromEmail() {
  return process.env.AWS_FROM_EMAIL || "noreply@stmjournals.in";
}


// Helper to replace templates variables like {{name}} with values in object
function replaceTemplate(str: string, data: Record<string, string>) {
  let output = str;
  for (const key in data) {
    const regex = new RegExp(`{{${key}}}`, "gi");
    output = output.replace(regex, data[key]);
  }
  return output;
}

export async function sendTemplatedEmail(key: string, to: string, data: Record<string, string>) {
  try {
    // 1. Find explicit template from DB
    let template = await prisma.emailTemplate.findUnique({ where: { key } });
    
    // 2. If doesn't exist, init default templates and retry
    if (!template) {
      await seedDefaultTemplates();
      template = await prisma.emailTemplate.findUnique({ where: { key } });
    }
    if (!template) throw new Error(`Template missing: ${key}`);

    // 3. Interpolate strings
    const finalSubject = replaceTemplate(template.subject, data);
    const finalBody = replaceTemplate(template.body, data);

    // 4. Construct command
    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Html: { Charset: "UTF-8", Data: finalBody } },
        Subject: { Charset: "UTF-8", Data: finalSubject },
      },
      Source: getFromEmail(),
    });

    await getSesClient().send(command);
    console.log(`✅ SES Sent -> ${key} to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ SES Failed ->", error);
    return false;
  }
}

// Trigger notifications to ALL active administrators
export async function sendAdminNotification(key: string, data: Record<string, string>) {
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    if (admins.length === 0) return;
    
    // To protect concurrency quotas, send to each admin
    await Promise.all(
      admins.map(adm => sendTemplatedEmail(key, adm.email, data))
    );
  } catch (e) {
    console.error("Failed triggering admin notifications", e);
  }
}

async function seedDefaultTemplates() {
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
  }
}
