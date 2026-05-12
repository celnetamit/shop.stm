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


function buildModernEmailTemplate(content: string, title: string): string {
  // Use direct verified external asset link as requested by user to guarantee live resolution.
  const logoUrl = `https://journals.stmjournals.com/wp-content/uploads/2023/12/c67ba4c3-logo_stm-1.png`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f6fa; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; display: block; outline: none; text-decoration: none; }
    .wrapper { width: 100%; background-color: #f3f6fa; table-layout: fixed; }
    .container { width: 100%; max-width: 600px !important; margin: 0 auto; background-color: #ffffff; }
    .header { background: #0f2a57; padding: 35px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .badge { display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 20px; margin-top: 12px; }
    .content { padding: 30px 25px; line-height: 1.6; font-size: 15px; color: #475569; }
    .footer { background-color: #0f172a; color: #ffffff; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 12px 12px; }
    h1, h2, h3 { color: #0f172a; margin-top: 0; font-weight: 700; }
    hr { border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0; }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="container" width="100%" align="center" role="presentation" style="max-width:600px;">
      <tr>
        <td class="header" style="background-color: #0f2a57; border-radius: 12px 12px 0 0; padding: 35px 20px; text-align:center;">
          <center>
            <table role="presentation" width="100%">
              <tr>
                <td align="center">
                  <img src="${logoUrl}" alt="STM Logo" width="72" height="72" style="border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 12px; display:block;">
                </td>
              </tr>
            </table>
            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing: 1px; text-transform: uppercase; font-family: Arial, sans-serif;">STM JOURNALS</h1>
            <p style="margin:6px 0 0; color:#bfdbfe; font-size:13px; font-family: Arial, sans-serif;">A Division of Consortium eLearning Network Pvt. Ltd.</p>
            <table role="presentation" align="center" style="margin-top: 14px;">
              <tr>
                <td style="background-color: #15803d; border-radius: 20px; padding: 6px 15px;">
                  <span style="color: #ffffff; font-size: 12px; font-weight: bold; white-space: nowrap;">🏆 21 Years of Excellence in Education & Publishing</span>
                </td>
              </tr>
            </table>
          </center>
        </td>
      </tr>
      <tr>
        <td class="content" style="padding: 35px 30px; background-color:#ffffff;">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="content" style="padding: 0 30px 35px; background-color:#ffffff;">
          <hr style="border:0; border-top:1px solid #e2e8f0; margin:0 0 20px 0;" />
          <table role="presentation" width="100%">
            <tr>
              <td style="color: #64748b; font-size: 14px; line-height: 1.5;">
                <strong>Warm regards,</strong><br/>
                STM Support Team<br/>
                Consortium eLearning Network Pvt. Ltd.
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td class="footer" style="background-color: #0f172a; border-radius: 0 0 12px 12px; padding: 20px; text-align:center;">
          <p style="margin:0 0 6px; color:#ffffff; font-weight:600; font-family: Arial, sans-serif; letter-spacing: 0.5px;">Empowering Scientific Innovation</p>
          <p style="margin:0; color:#94a3b8; font-size:11px;">&copy; ${new Date().getFullYear()} Consortium eLearning Network Pvt. Ltd.</p>
          <p style="margin:4px 0 0; color:#94a3b8; font-size:11px;">Sector-63, Noida, U.P. | <a href="mailto:info@stmjournals.in" style="color:#38bdf8; text-decoration:none;">info@stmjournals.in</a></p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
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
    const interpolatedBody = replaceTemplate(template.body, data);
    
    // 4. Wrap in aesthetic container
    const finalBody = buildModernEmailTemplate(interpolatedBody, finalSubject);

    // 5. Construct command
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
      body: `
        <div style="text-align:center; margin-bottom:24px;">
          <h2 style="margin:0; font-size:24px; color:#0f172a;">Welcome aboard, {{name}}!</h2>
          <p style="color:#64748b; margin-top:4px;">Your account is ready. The world of research awaits.</p>
        </div>
        
        <p style="color:#475569; line-height:1.6;">We're thrilled to have you join the <strong>STM Journals</strong> — your gateway to thousands of peer-reviewed journals, conference proceedings, and research materials.</p>
        
        <table role="presentation" style="width:100%; margin:24px 0; table-layout:fixed;" cellpadding="0" cellspacing="8" width="100%">
          <tr>
            <td width="33%" align="center" valign="top" style="background-color:#eff6ff; border-radius:10px; padding: 20px 10px; height: 90px;">
              <span style="font-size:24px; line-height:1; display:inline-block; margin-bottom:8px;">📚</span><br/>
              <div style="color:#1d4ed8; font-size:11px; font-weight:800; text-transform:uppercase; line-height:1.3; letter-spacing:0.5px;">50,000+<br/>Journals</div>
            </td>
            <td width="33%" align="center" valign="top" style="background-color:#f0fdf4; border-radius:10px; padding: 20px 10px; height: 90px;">
              <span style="font-size:24px; line-height:1; display:inline-block; margin-bottom:8px;">🎥</span><br/>
              <div style="color:#15803d; font-size:11px; font-weight:800; text-transform:uppercase; line-height:1.3; letter-spacing:0.5px;">Educational<br/>Videos</div>
            </td>
            <td width="33%" align="center" valign="top" style="background-color:#fdf4ff; border-radius:10px; padding: 20px 10px; height: 90px;">
              <span style="font-size:24px; line-height:1; display:inline-block; margin-bottom:8px;">📖</span><br/>
              <div style="color:#a21caf; font-size:11px; font-weight:800; text-transform:uppercase; line-height:1.3; letter-spacing:0.5px;">E-Books &<br/>Theses</div>
            </td>
          </tr>
        </table>

        <table style="width:100%; background-color:#2563eb; border-radius:12px; color:#ffffff; margin-bottom:24px;" cellpadding="20" cellspacing="0">
          <tr>
            <td>
              <h3 style="margin:0 0 12px; font-size:13px; text-transform:uppercase; color:#bfdbfe; letter-spacing:1px;">🚀 Getting Started</h3>
              <div style="font-size:14px; margin-bottom:8px;"><strong>01.</strong> Log In at <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shop.stmjournals.in'}/login" style="color:#ffffff; text-decoration:underline;">shop.stmjournals.in</a></div>
              <div style="font-size:14px; margin-bottom:8px;"><strong>02.</strong> Browse domains & subscribe to your field</div>
              <div style="font-size:14px;"><strong>03.</strong> Access full-text content instantly</div>
            </td>
          </tr>
        </table>

        <p style="text-align:center; font-size:13px; color:#64748b;">Need help? Contact us anytime at <a href="mailto:info@stmjournals.in" style="color:#2563eb; text-decoration:none; font-weight:bold;">info@stmjournals.in</a> or call <strong>+91-120-4781200</strong>.</p>
      `,
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
    },
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
        <p style="margin-top:16px; text-align:center;"><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shop.stmjournals.in'}/checkout?quoteId={{quoteId}}" style="display:inline-block; background-color:#1e40af; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold;">Proceed to Secure Checkout →</a></p>
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
        
        <table style="width:100%; border:1px solid #e2e8f0; border-radius:8px;" cellpadding="12">
          <tr style="background-color:#f8fafc;">
            <td style="font-weight:bold; width:120px;">Quote ID</td>
            <td>{{quoteId}}</td>
          </tr>
        </table>
      `,
      description: "Alert sent to backend administration when new quotes are submitted."
    }
  ];

  for (const item of defaults) {
    await prisma.emailTemplate.upsert({
      where: { key: item.key },
      update: {
        subject: item.subject,
        body: item.body,
        description: item.description
      },
      create: item
    });
  }
}
