# Enabling Cloud Sync (Supabase)

FocusFlow works fully offline with your data stored locally in the browser
(IndexedDB). Cloud sync is **optional** — turn it on to back up your data and
sync it across devices. It's free and takes about 5 minutes.

> You only do this once. Until you finish, the app keeps working local-only and
> the "Cloud sync" card in Settings shows it isn't configured yet.

---

## 1. Create a free Supabase project

1. Go to **https://supabase.com** and sign up (free, no credit card).
2. Click **New project**. Pick any name (e.g. `focusflow`), set a database
   password (save it somewhere), choose a region near you, and create it.
3. Wait ~1 minute for it to finish provisioning.

## 2. Create the database table

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/migration.sql` from this project, copy its contents, paste
   into the editor, and click **Run**. You should see "Success".

This creates one table (`focusflow_snapshots`) with row-level security so each
account can only ever see its own data.

## 3. Get your two keys

1. Go to **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon public** key (a long string under "Project API keys").
   - ⚠️ Use the **anon / public** key. **Never** the `service_role` / secret key.

## 4. Add the keys to the app

1. In the project root, copy `.env.example` to a new file named `.env`.
2. Paste your values:

   ```
   VITE_SUPABASE_URL=https://abcd1234.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
   ```

3. Restart the dev server (`npm run dev`). Vite only reads `.env` at startup.

## 5. Sign in

1. Open the app → **Settings** → **Cloud sync**.
2. Enter an email + password and click **Create account**.
   - If your project has email confirmation on (default), confirm via the email
     Supabase sends, then come back and **Sign in**.
   - To skip confirmation for personal use: Supabase → **Authentication** →
     **Providers** → **Email** → turn **Confirm email** off.
3. Once signed in, your data backs up automatically after each change, and
   signing in on another device pulls your latest data down.

---

## How sync works (and its limits)

- **Offline-first:** your local copy is always the source of truth for the UI.
  Everything works with no network; changes mirror to the cloud when online.
- **Snapshot model:** the whole dataset is stored as one JSON document per user.
- **Conflict resolution:** last-write-wins at the dataset level. If you edit on
  two devices while both are offline, the one that syncs later wins. For a single
  person's devices this is almost never an issue; if you're worried, hit
  **Sync now** before switching devices, and use **Settings → Export** for a
  manual backup.
- **Deletes** propagate as part of the snapshot (a deleted item is simply absent
  from the next sync), so they sync correctly.

## Security notes

- The anon key is safe to ship in a client app — row-level security is what
  protects data, and the migration enables it so each user only accesses their
  own row.
- `.env` is git-ignored; never commit real keys.
