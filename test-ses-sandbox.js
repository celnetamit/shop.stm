const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

async function testSandboxMode() {
  const region = process.env.AWS_REGION;
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const from = process.env.AWS_FROM_EMAIL;

  console.log("🔍 PROBING SES SANDBOX STATUS...");
  console.log("📡 Attempting dispatch to a known unverified address...");

  const client = new SESClient({ region, credentials: { accessKeyId: accessKey, secretAccessKey: secretKey } });

  const params = {
    Source: from,
    Destination: { ToAddresses: ["unverified-tester-12345@gmail.com"] }, // THIS WILL FAIL IF IN SANDBOX
    Message: {
      Subject: { Data: "Sandbox Probe Test" },
      Body: { Text: { Data: "Testing account egress restrictions." } },
    },
  };

  try {
    await client.send(new SendEmailCommand(params));
    console.log("🟢 PRODUCTION MODE CONFIRMED: AWS allowed the send to an unverified Gmail!");
    console.log("💡 Result: Your account has Production Access. Any delivery issue is likely downstream spam filtering.");
  } catch (err) {
    console.error("\n🔴 SANDBOX RESTRICTION DETECTED!");
    console.error(`🚫 Error Name: ${err.name}`);
    console.error(`🚫 Error Message: ${err.message}`);
    console.log("\n💡 ACTION REQUIRED:");
    console.log("1. Your AWS SES account is still in 'Sandbox Mode'.");
    console.log("2. AWS blocks ALL outbound emails to addresses you haven't explicitly verified in the AWS Console.");
    console.log("3. You must click 'Request Production Access' in your AWS Console Dashboard to lift this limit.");
  }
}

testSandboxMode();
