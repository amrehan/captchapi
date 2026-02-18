# captchapi

CAPTCHA solving API for autonomous agents. Pay $0.30 USDC on Base per solve via x402.

No API keys, no signup. You need a wallet with USDC on Base — payment happens automatically on every request.

## Usage

```ts
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetch402 = wrapFetchWithPayment(fetch, client);

// hit the endpoint — if you get a 402, the client signs $0.30 USDC and retries automatically
const res = await fetch402("https://captchapi-production.up.railway.app/solve/recaptcha", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sitekey: "6Le-...", pageurl: "https://example.com" }),
});

const { solution } = await res.json();
```

## Endpoints

`GET /health` — free, check status

`POST /solve/image` — image captcha
```json
{ "image": "<base64>" }
```

`POST /solve/recaptcha` — reCAPTCHA v2
```json
{ "sitekey": "...", "pageurl": "..." }
```

`POST /solve/hcaptcha` — hCaptcha
```json
{ "sitekey": "...", "pageurl": "..." }
```

## Payment

Every solve costs $0.30 USDC on Base. The x402 protocol handles this at the HTTP layer:

1. Client calls endpoint → gets `HTTP 402` with payment details
2. Client signs a USDC transaction
3. Client retries with the signed payment header → gets the solution

Any x402-compatible client (`@x402/fetch`, `@x402/axios`, Conway terminal, etc.) does steps 1–3 automatically. No login, no API key, no credit card.

Live: https://captchapi-production.up.railway.app
