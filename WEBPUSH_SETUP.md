# Background Push Notifications (optional)

By default, FocusFlow can only notify you while the app is open — that's a hard
browser limitation. To get a notification when a focus timer ends **even if the
app is fully closed**, you need Web Push: a small server piece that sends the
notification at the right time.

This builds on the Supabase cloud sync you already set up (`SUPABASE_SETUP.md`).
You must be **signed in** in the app for background alerts to work, and on iPhone
the app must be **installed to the Home Screen** (iOS only supports web push for
installed PWAs).

> Timing note: the sender runs on a 1-minute cron, so a "session over" alert can
> arrive up to ~1 minute late when the app is closed. When the app is open it's
> instant.

You'll need the **Supabase CLI** for the function deploy:
`npm i -g supabase` (or see supabase.com/docs/guides/cli).

---

## 1. Generate VAPID keys

VAPID keys authorize your app to send pushes. Generate a pair (private key stays
secret — it never goes in the client or git):

```bash
npx web-push generate-vapid-keys
```

You'll get a **Public Key** and a **Private Key**. Keep them handy.

## 2. Create the database tables

Supabase → **SQL Editor** → paste `supabase/push_migration.sql` → **Run**.
(Creates `push_subscriptions` + `scheduled_pushes` with row-level security.)

## 3. Deploy the Edge Function

From the project root, link your project once (ref is in your Supabase URL,
`https://<ref>.supabase.co`), then deploy:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy send-pushes
```

## 4. Set the function's secrets

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY="<public key from step 1>" \
  VAPID_PRIVATE_KEY="<private key from step 1>" \
  VAPID_SUBJECT="mailto:you@example.com"
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the function
automatically — don't set those.)

## 5. Schedule it every minute (pg_cron)

Supabase → **SQL Editor** → run this, replacing `<ref>` and `<ANON_KEY>` (the
same public anon key already in your app):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'focusflow-send-pushes',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://<ref>.supabase.co/functions/v1/send-pushes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

To stop it later: `select cron.unschedule('focusflow-send-pushes');`

## 6. Add the public key to the app

The client needs the **public** VAPID key at build time.

- **Local:** add to `.env`:
  ```
  VITE_VAPID_PUBLIC_KEY=<public key from step 1>
  ```
- **Vercel:** Project → Settings → Environment Variables → add
  `VITE_VAPID_PUBLIC_KEY` (All Environments) → then **redeploy** (env vars only
  bake in on a fresh build).

## 7. Turn it on

1. Open the **installed** app on your phone (Home Screen icon), signed in.
2. **Settings → Notifications → Background alerts** → toggle on → allow
   notifications when prompted.
3. Start a focus timer, lock your phone / switch apps, and wait — you'll get a
   "Focus session complete" notification when it ends.

---

## How it works

- Starting a work timer inserts a row in `scheduled_pushes` with `fire_at` = the
  timer's end time.
- The cron-triggered `send-pushes` function sends any due pushes to your
  device's subscription via the Web Push protocol; the service worker
  (`public/push-sw.js`) shows the notification.
- If you pause/reset/finish the timer inside the app, the scheduled push is
  cancelled so you don't get a duplicate.

## Troubleshooting

- **No toggle / says "requires setup":** `VITE_VAPID_PUBLIC_KEY` isn't in the
  build. Add it and redeploy.
- **Toggle won't turn on:** you must be signed in and (on iOS) have the app
  installed to the Home Screen; also allow notifications.
- **Nothing arrives:** check the function logs (Supabase → Edge Functions →
  send-pushes → Logs) and that the cron job is running (`select * from
  cron.job;`).
- **`web-push` import errors on deploy:** the function uses `npm:web-push`; make
  sure your Supabase CLI is current (`supabase --version`).
