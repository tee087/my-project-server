# Render Migration Guide

Deploy the Express server to Render and keep the Next.js client on Vercel.

## Deploy the server

1. In Render, create a **Web Service** from this repository and select the `master` branch.
2. Render will use the root [`render.yaml`](./render.yaml). It builds from the `server` directory and starts the server with `npm start`.
3. Set these environment variables in Render. Keep their values in Render only; do not put them in Git:
   - `DATABASE_URL`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_ADMIN_CHAT_ID`
   - `JWT_SECRET` (long random secret)
   - `TELEGRAM_WEBHOOK_SECRET` (long random secret)
   - `FRONTEND_URL` (your Vercel client URL)
4. Deploy. The health check is available at `/api/health`.

## Set the Telegram webhook

After the first successful Render deployment, set the webhook using your real values:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR-RENDER-SERVICE>.onrender.com/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Use the exact same `TELEGRAM_WEBHOOK_SECRET` value configured in Render. Telegram should reply with a JSON response whose `ok` value is `true`.

## Update the frontend

In Vercel, set `NEXT_PUBLIC_API_URL` to:

```text
https://<YOUR-RENDER-SERVICE>.onrender.com/api
```

Redeploy the frontend, then send the bot a command and check the Render logs to verify delivery.

## Important

- Rotate any Telegram token or database password that was previously placed in a committed file.
- Use a paid Render instance for a bot that must remain continuously available; free instances may spin down when idle.
