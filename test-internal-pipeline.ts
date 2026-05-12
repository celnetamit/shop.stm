import { sendTemplatedEmail } from "./lib/email";

async function test() {
  console.log("📡 Testing internal TypeScript template pipeline...");
  try {
    const success = await sendTemplatedEmail("USER_WELCOME", "vivek.verma@panoptical.org", { name: "Vivek Diagnostic TS" });
    if (success) {
      console.log("✅ SUCCESS: Templated TS logic completed successfully.");
    } else {
      console.error("❌ FAILED: Templated TS logic returned false.");
    }
  } catch (e) {
    console.error("🔥 FATAL ERROR DURING EXECUTION:", e);
  }
  process.exit(0);
}

test();
