# Helm marketing site

Canonical domain: **https://helm.mgmhospitality.co**

The "owner's OS" for independent restaurants — manage managers, inventory,
scheduling, cashflow, and bills in one place.

## What's here

```
sites/helm/
  index.html      # single-page marketing site
  styles.css      # light/professional SaaS aesthetic
  app.js          # waitlist form wiring (Supabase insert + demo fallback)
  config.js       # Supabase URL + anon key (placeholders — fill in before deploy)
  logo.svg        # primary wordmark
  logo-dark.svg   # light wordmark variant for dark backgrounds
  favicon.svg     # square mark
  vercel.json     # security headers + cache policy
  README.md       # this file
```

Form writes to Supabase table `helm_waitlist` — see migration
`supabase/migrations/0005_helm_waitlist.sql`. Public anon INSERT allowed;
internal-only SELECT / UPDATE / DELETE, same pattern as Bytecall.

## Publish checklist

### 1 · Pick a Supabase project

Two options:

- **Reuse the existing RevKitchen Platform Supabase project.** Simplest.
  `helm_waitlist` sits alongside `bytecall_signups` and
  `partner_applications`, and every signup hits the same `activity_log`
  admin feed.
- **Spin up a dedicated MGM Hospitality Supabase project.** Cleaner
  separation if MGM is legally/operationally a different entity. You'll
  also need to copy over the `is_internal()` helper and `activity_log`
  table from migration `0001_initial_schema.sql` (the policies and
  trigger in `0005` reference them).

### 2 · Apply the migration

From the project root:

```bash
# Against whichever Supabase project you chose:
supabase db push
# or, if you apply migrations manually:
psql "$SUPABASE_DB_URL" -f supabase/migrations/0005_helm_waitlist.sql
```

### 3 · Fill in `config.js`

Open `sites/helm/config.js` and replace the two placeholders with the
values from that project's **Settings → API** page:

```js
window.HELM_CONFIG = {
  SUPABASE_URL:      "https://<ref>.supabase.co",
  SUPABASE_ANON_KEY: "eyJ..."
};
```

> The anon key is safe in the browser. Do **not** put the service_role
> key here — it would bypass RLS.

### 4 · Deploy the folder

All three options work — pick whichever is already set up for
`mgmhospitality.co`.

#### Option A · Vercel (fastest)

```bash
cd sites/helm
npx vercel --prod
# Follow prompts: create project "helm" under the MGM team
# When asked for "What's your project's output directory?", accept the default (".")
```

Then in the Vercel dashboard:

1. **Settings → Domains** → add `helm.mgmhospitality.co`.
2. Vercel will show the DNS record to add:
   - Type: `CNAME`
   - Name: `helm`
   - Value: `cname.vercel-dns.com`
3. Add that CNAME in whichever DNS provider holds `mgmhospitality.co`
   (Cloudflare, Namecheap, Route 53, etc.).
4. Verify — cert auto-provisions in ~60 seconds.

#### Option B · Cloudflare Pages

1. Connect the `revkitchenplatform` GitHub repo.
2. Build settings: **no build command**, build output directory
   `sites/helm`.
3. **Custom domains → Set up a custom domain** → enter
   `helm.mgmhospitality.co`. Cloudflare will auto-create the CNAME if
   the zone is on Cloudflare; otherwise it gives you the target to set
   manually.

#### Option C · Netlify

```bash
cd sites/helm
npx netlify deploy --prod --dir .
```

Then **Site settings → Domain management → Add custom domain** →
`helm.mgmhospitality.co`. Netlify gives you the CNAME target
(`<site>.netlify.app`).

### 5 · Smoke test

1. Visit https://helm.mgmhospitality.co/ — should load, cert valid.
2. Scroll to the waitlist form, submit a dummy entry.
3. In Supabase **Table editor → helm_waitlist**, confirm the row landed.
4. In **activity_log**, confirm an event of type `helm.waitlist_submitted`
   was written.

## Local preview

```bash
cd sites/helm
python3 -m http.server 4322
# open http://localhost:4322
```

If `config.js` still has placeholders, the form runs in demo mode
(thank-you toast shown, payload logged to the console, no network call
to Supabase).

## Updating the site

Any change to `index.html` / `styles.css` / `app.js` ships on the next
push to main (if you wired a git-connected deploy) or the next manual
`vercel --prod` / `netlify deploy`. The `config.js` file is set to
`Cache-Control: no-cache` so credential swaps take effect immediately.
