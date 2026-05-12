const { sendTemplatedEmail } = require("./lib/email");

async function test() {
  console.log("📡 Testing internal template pipeline...");
  const success = await sendTemplatedEmail("USER_WELCOME", "vivek.verma@panoptical.org", { name: "Vivek Diagnostic" });
  if (success) {
    console.log("✅ SUCCESS: Templated logic completed successfully.");
  } else {
    console.error("❌ FAILED: Templated logic returned false.");
  }
  process.exit(0);
}

test();
