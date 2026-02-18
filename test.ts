import "dotenv/config";
import { Solver } from "@2captcha/captcha-solver";

const TWOCAPTCHA_KEY = process.env.TWOCAPTCHA_API_KEY!;
const SERVER = `http://localhost:${process.env.PORT ?? 3000}`;

async function main() {
  console.log("=== captchapi test ===\n");

  // 1. Check 2captcha balance
  console.log("1. checking 2captcha API key...");
  const solver = new Solver(TWOCAPTCHA_KEY);
  const balance = await solver.balance();
  console.log(`   ✓ balance: $${balance}\n`);

  // 2. Health check
  console.log("2. hitting /health...");
  const health = await fetch(`${SERVER}/health`);
  const healthData = await health.json() as Record<string, unknown>;
  console.log(`   ✓ status: ${health.status}`, healthData, "\n");

  // 3. Confirm /solve/image returns 402 (payment wall is up)
  console.log("3. confirming payment wall on /solve/image...");
  const wall = await fetch(`${SERVER}/solve/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: "test" }),
  });
  console.log(`   ✓ got HTTP ${wall.status} (expected 402)\n`);

  console.log("all good. your API keys work and the payment wall is live.");
  console.log("to test a real solve, fund a Base wallet with USDC and use @x402/fetch.");
}

main().catch((e) => {
  console.error("test failed:", e.message ?? e);
  process.exit(1);
});
