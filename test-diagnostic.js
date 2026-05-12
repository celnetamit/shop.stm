const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

async function test() {
  const region = process.env.AWS_REGION || "ap-south-1";
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const from = process.env.AWS_FROM_EMAIL || "noreply@stmjournals.in";
  const to = "vivek.verma@panoptical.org";

  console.log("🔍 Starting External Address Diagnostics...");
  console.log(`📡 Target Region: ${region}`);
  console.log(`📧 Attempting From: ${from}`);
  console.log(`📧 Recipient: ${to}`);

  if (!accessKey || !secretKey) {
    console.error("❌ Missing credentials in .env!");
    process.exit(1);
  }

  const client = new SESClient({
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  const params = {
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: "🚀 STM Journals - External Diagnostic Test" },
      Body: { Text: { Data: `Diagnostics test initiated at ${new Date().toISOString()}.\nTarget recipient validated.` } },
    },
  };

  try {
    const result = await client.send(new SendEmailCommand(params));
    console.log("✅ SUCCESS! Sent to target.");
    console.log(`Message ID: ${result.MessageId}`);
  } catch (err) {
    console.error("\n❌ AWS API REJECTED REQUEST FOR EXTERNAL RECIPIENT:");
    console.error(`Error Type: ${err.name}`);
    console.error(`Error Text: ${err.message}`);
  }
}

test();
