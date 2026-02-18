import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { Solver } from "@2captcha/captcha-solver";

// --- Config ---
const PORT = Number(process.env.PORT ?? 3000);
const PAY_TO = process.env.PAY_TO as `0x${string}`;
const NETWORK = (process.env.NETWORK ?? "eip155:8453") as `eip155:${number}`;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://facilitator.openx402.ai";
const PRICE = process.env.PRICE ?? "$0.30";
const TWOCAPTCHA_KEY = process.env.TWOCAPTCHA_API_KEY!;

if (!PAY_TO) {
  console.error("Missing PAY_TO environment variable (your 0x wallet address)");
  process.exit(1);
}
if (!TWOCAPTCHA_KEY) {
  console.error("Missing TWOCAPTCHA_API_KEY environment variable");
  process.exit(1);
}

// --- x402 setup ---
const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK,
  new ExactEvmScheme()
);

const routeConfig = (description: string) => ({
  accepts: { scheme: "exact" as const, price: PRICE, network: NETWORK, payTo: PAY_TO },
  description,
  mimeType: "application/json",
});

// --- 2captcha solver ---
const solver = new Solver(TWOCAPTCHA_KEY);

// --- App ---
const app = new Hono();

// Free health check
app.get("/health", (c) => c.json({ status: "ok", price: PRICE, network: NETWORK }));

// x402 payment wall on solve routes
app.use(
  paymentMiddleware(
    {
      "POST /solve/image": routeConfig("Solve image CAPTCHA (base64 PNG/JPG)"),
      "POST /solve/recaptcha": routeConfig("Solve reCAPTCHA v2"),
      "POST /solve/hcaptcha": routeConfig("Solve hCaptcha"),
    },
    resourceServer
  )
);

// POST /solve/image
// Body: { image: "<base64 string>" }
app.post("/solve/image", async (c) => {
  const body = await c.req.json<{ image: string }>();
  if (!body.image) {
    return c.json({ error: "Missing 'image' field (base64 encoded)" }, 400);
  }
  const result = await solver.imageCaptcha({ body: body.image });
  return c.json({ solution: result.data });
});

// POST /solve/recaptcha
// Body: { sitekey: "...", pageurl: "..." }
app.post("/solve/recaptcha", async (c) => {
  const body = await c.req.json<{ sitekey: string; pageurl: string }>();
  if (!body.sitekey || !body.pageurl) {
    return c.json({ error: "Missing 'sitekey' or 'pageurl'" }, 400);
  }
  const result = await solver.recaptcha({ googlekey: body.sitekey, pageurl: body.pageurl });
  return c.json({ solution: result.data });
});

// POST /solve/hcaptcha
// Body: { sitekey: "...", pageurl: "..." }
app.post("/solve/hcaptcha", async (c) => {
  const body = await c.req.json<{ sitekey: string; pageurl: string }>();
  if (!body.sitekey || !body.pageurl) {
    return c.json({ error: "Missing 'sitekey' or 'pageurl'" }, 400);
  }
  const result = await solver.hcaptcha({ sitekey: body.sitekey, pageurl: body.pageurl });
  return c.json({ solution: result.data });
});

// --- Start ---
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`captchapi running on port ${PORT}`);
  console.log(`  payTo:       ${PAY_TO}`);
  console.log(`  network:     ${NETWORK}`);
  console.log(`  price:       ${PRICE} per solve`);
  console.log(`  facilitator: ${FACILITATOR_URL}`);
});
