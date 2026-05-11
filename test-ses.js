const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const dotenv = require("dotenv");
const path = require("path");

// Explicitly load existing .env
dotenv.config({ path: path.join(__dirname, ".env") });

async function test() {
  const region = process.env.AWS_REGION || "us-east-1";
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const from = process.env.AWS_FROM_EMAIL || "noreply@stmjournals.in";

  console.log("🔍 Starting SES Diagnostics...");
  console.log(`📡 Target Region: ${region}`);
  console.log(`📧 Attempting from: ${from}`);
  console.log(`🔑 Key Detected: ${accessKey ? accessKey.substring(0, 6) + "..." : "MISSING"}`);

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

  // We try sending to the sender themselves just to verify the credentials and FROM verification
  const params = {
    Source: from,
    Destination: { ToAddresses: [from] },
    Message: {
      Subject: { Data: "🚀 AWS SES Delivery Test" },
      Body: { Text: { Data: `SES is functioning properly.\n\nTimestamp: ${new Date().toISOString()}` } },
    },
  };

  try {
    console.log("📡 Dispatching raw command to AWS API...");
    const result = await client.send(new SendEmailCommand(params));
    console.log("✅ SUCCESS! AWS accepted the request.");
    console.log(`🆔 MessageId: ${result.MessageId}`);
    console.log("\n🎉 Verification complete: Your credentials and sender email are VALID.");
  } catch (err) {
    console.error("\n❌ AWS API REJECTED THE REQUEST!");
    console.error("--------------------------------------------------");
    console.error(`Error Name: ${err.name}`);
    console.error(`Error Message: ${err.message}`);
    console.error("--------------------------------------------------");
    
    if (err.name === "MessageRejected" || err.message.includes("Email address is not verified")) {
      console.log("\n💡 Diagnosis: This usually means either the 'From' address isn't verified in AWS console, or your account is in 'Sandbox Mode' where only verified emails can receive mail.");
    } else if (err.name === "UnrecognizedClientException" || err.name === "InvalidClientTokenId") {
      console.log("\n💡 Diagnosis: The AWS Access Key / Secret keys you are using are invalid or revoked.");
    }
  }
}

test();
