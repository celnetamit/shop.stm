import { prisma } from "./lib/prisma";

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
      key: "ORDER_CONFIRMED",
      subject: "Transaction Successful - Order #{{orderId}} Confirmed!",
      body: `
        <div style="text-align:center; margin-bottom:24px;">
          <div style="background-color:#f0fdf4; width:60px; height:60px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin:0 auto 15px; font-size:30px; color:#16a34a; line-height:60px;">✅</div>
          <h2 style="margin:0; font-size:22px; color:#0f172a;">Payment Received!</h2>
          <p style="color:#64748b; margin-top:4px;">Thank you for your purchase, {{name}}.</p>
        </div>

        <table style="width:100%; background-color:#f8fafc; border-radius:8px; margin-bottom:24px; border:1px solid #e2e8f0;" cellpadding="15" cellspacing="0">
          <tr>
            <td style="font-size:14px; color:#64748b; border-bottom:1px solid #e2e8f0;">Order ID:</td>
            <td style="font-size:14px; color:#0f172a; font-weight:bold; text-align:right; border-bottom:1px solid #e2e8f0;">#{{orderId}}</td>
          </tr>
          <tr>
            <td style="font-size:14px; color:#64748b; border-bottom:1px solid #e2e8f0;">Coupon Applied:</td>
            <td style="font-size:14px; color:#0f172a; font-weight:bold; text-align:right; border-bottom:1px solid #e2e8f0;">{{couponCode}}</td>
          </tr>
          <tr>
            <td style="font-size:14px; color:#64748b;">Amount Paid:</td>
            <td style="font-size:18px; color:#16a34a; font-weight:bold; text-align:right;">{{currency}} {{total}}</td>
          </tr>
        </table>

        <p style="color:#475569; font-size:14px; line-height:1.6;">Your subscriptions are now being processed. You will receive periodic updates once fulfillment reaches the circulation desk.</p>

        <div style="text-align:center; margin-top:25px;">
          <a href="https://shop.stmjournals.in/account/orders" style="background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:6px; font-weight:bold; display:inline-block;">View Orders Dashboard</a>
        </div>
      `,
      description: "Order receipt sent immediately after successful Razorpay confirmation."
    },
    {
      key: "ORDER_CONFIRMED_ADMIN",
      subject: "🔔 ALERT: New Paid Order (#{{orderId}}) Received!",
      body: `
        <h2 style="color:#0f172a; font-size:20px; border-bottom:2px solid #eff6ff; padding-bottom:10px; margin-bottom:20px;">💰 New Sale Confirmed</h2>
        
        <p style="margin:0 0 15px; font-size:14px;">An automated payment was completed by the customer engine. Ready for operational dispatch.</p>

        <table style="width:100%; margin-bottom:20px;" cellpadding="10" cellspacing="0" border="1" bordercolor="#e2e8f0" style="border-collapse:collapse;">
          <tr style="background-color:#f8fafc;">
            <td width="35%"><strong>Field</strong></td>
            <td><strong>Detail</strong></td>
          </tr>
          <tr>
            <td>Customer</td>
            <td>{{name}} ({{email}})</td>
          </tr>
          <tr>
            <td>Reference</td>
            <td>#{{orderId}}</td>
          </tr>
          <tr>
            <td>Coupon Code</td>
            <td>{{couponCode}}</td>
          </tr>
          <tr>
            <td>Financials</td>
            <td style="color:#16a34a; font-weight:bold;">{{currency}} {{total}}</td>
          </tr>
        </table>

        <a href="https://shop.stmjournals.in/admin/orders" style="color:#2563eb; font-weight:bold;">🚀 Open Admin Management Console</a>
      `,
      description: "Notification broadcast to administrative emails notifying of secure funds arrival."
    },
    {
      key: "USER_WELCOME_ADMIN",
      subject: "New User Alert: {{name}} has registered",
      body: `<h3>User Registration</h3><p>A new user has joined the platform.</p><ul><li>Name: {{name}}</li><li>Email: {{email}}</li></ul>`,
      description: "Notification alert dispatched to administrators upon new accounts."
    },
    {
      key: "PROFORMA_CREATED",
      subject: "Proforma Invoice Details: #{{quoteId}} - STM Journals",
      body: `
        <h2 style="margin-bottom:8px; color:#0f172a;">Dear {{contactName}},</h2>
        <p style="margin-top:0; color:#475569;">Greetings from <strong>STM Journals</strong>!</p>
        <p style="color:#475569;">Thank you for your interest in our subscriptions. Below is your requested digital Proforma breakdown for <strong>{{organization}}</strong>.</p>
        
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 25px 0;">
          <div style="background-color: #0f2a57; color: #ffffff; padding: 15px 20px; font-weight: bold; display:flex; justify-content:space-between;">
            <span>Proforma Invoice Summary</span>
            <span style="color:#bfdbfe;">#{{quoteId}}</span>
          </div>
          <div style="padding: 20px;">
            <div style="font-size:12px; color:#166534; font-weight:bold; margin-bottom:12px; background-color:#f0fdf4; padding:8px 12px; border-radius:4px; border:1px solid #bbf7d0;">🎟 Applied Coupon: {{couponUsed}}</div>
            {{itemsTableHtml}}
            {{financialsHtml}}
          </div>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; border: 1px dashed #bfdbfe;">
          <h3 style="margin: 0 0 10px; color: #1e3a8a; font-size: 16px;">🔒 Secure Online Activation</h3>
          <p style="margin: 0 0 15px; font-size: 14px; color: #1e40af;">You may activate your subscription instantly by completing the verified digital payout.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://shop.stmjournals.in'}/checkout?quoteId={{quoteId}}" style="display:inline-block; background-color:#2563eb; color:white; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">⚡ Complete Payment Now →</a>
        </div>
        
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">Valid for 30 days from generation.</p>
      `,
      description: "Full-detail itemized Proforma receipt dispatched to buying entity."
    },
    {
      key: "PROFORMA_CREATED_ADMIN",
      subject: "🔔 ALERT: New B2B Proforma (#{{quoteId}}) - {{total}} Generated",
      body: `
        <h2 style="color:#0f172a; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">📊 New Proforma Drafted</h2>
        <p style="margin-top:10px; font-size:14px;">An institutional agent has completed configuration of a potential acquisition.</p>
        
        <div style="background-color:#f8fafc; border: 1px solid #e2e8f0; padding:16px; border-radius:6px; margin-bottom:20px; font-size:13px;">
          <table cellpadding="4" cellspacing="0" width="100%">
            <tr><td width="120" style="color:#64748b;">Client:</td><td style="font-weight:bold;">{{contactName}}</td></tr>
            <tr><td style="color:#64748b;">Organization:</td><td style="font-weight:bold;">{{organization}}</td></tr>
            <tr><td style="color:#64748b;">Email/Phone:</td><td>{{email}} | {{phone}}</td></tr>
            <tr><td style="color:#64748b;">Coupon:</td><td>{{couponUsed}}</td></tr>
            <tr><td style="color:#64748b;">Total Forecast:</td><td style="color:#16a34a; font-weight:bold; font-size:15px;">{{total}}</td></tr>
          </table>
        </div>

        <h3 style="font-size:14px; text-transform:uppercase; color:#64748b;">Configuration Manifest:</h3>
        {{itemsTableHtml}}

        <div style="margin-top:25px; text-align:center; border-top: 1px solid #e2e8f0; padding-top:20px;">
          <a href="https://shop.stmjournals.in/admin/proforma" style="color:#2563eb; font-weight:bold; text-decoration:underline;">🚀 Open Admin Tracking Command Console</a>
        </div>
      `,
      description: "Internal alert notifying administrative dashboards of complex deal flow drafts."
    }
];

async function main() {
  console.log("🔄 Rewriting templates in database...");
  for (const item of defaults) {
    await prisma.emailTemplate.upsert({
      where: { key: item.key },
      update: { subject: item.subject, body: item.body },
      create: item,
    });
    console.log(`✅ Updated key: ${item.key}`);
  }
  console.log("✨ All target templates synced with latest markup designs.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
