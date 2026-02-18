# captchapi

CAPTCHA solving API for autonomous agents. Pay $0.30 USDC on Base per solve via x402.

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
402 response → sign $0.30 USDC tx on Base → retry. Any x402 client handles this automatically.

Live: https://captchapi-production.up.railway.app
