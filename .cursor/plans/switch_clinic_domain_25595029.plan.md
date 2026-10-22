---
name: Switch clinic domain
overview: Production stays on https://leaderhealth-platform.vercel.app until DNS is changed later. Resend is only for the contact form and affiliate sign-in mail; it does not attach the clinic domain. The domain cutover is a later Vercel plus DNS step.
todos:
  - id: contact-email
    content: "Optional, independent of the domain: verify a sending domain in Resend, set RESEND_API_KEY plus CONTACT_FROM_EMAIL and CONTACT_TO_EMAIL in Vercel (and .env.local for local only), then redeploy"
    status: pending
  - id: vercel-domain
    content: "Later, when ready to cut over: add leaderhealth.clinic in Vercel and redirect www to the apex"
    status: pending
  - id: dns
    content: "Later: point only apex and www DNS at Vercel; leave products, myportal, and mail records unchanged"
    status: pending
  - id: env-redeploy
    content: "At cutover: set NEXT_PUBLIC_SITE_URL=https://leaderhealth.clinic on Production and redeploy. Until then the live host is the vercel.app URL"
    status: pending
  - id: allowlists
    content: "At cutover: allow leaderhealth.clinic on the checkout iframe app and NMI if those allowlists exist"
    status: pending
isProject: false
---

# Domain later, email is separate

Live production is [https://leaderhealth-platform.vercel.app/](https://leaderhealth-platform.vercel.app/). `leaderhealth.clinic` is not attached yet. A Resend account does not change that URL.

Two independent pieces:

- **Contact form email** can be turned on now, while the site stays on the Vercel URL.
- **The clinic domain** is a later cutover. Do not change DNS until you are ready to replace whatever currently serves `leaderhealth.clinic`.

`.env.local` is only read by `npm run dev` on your machine. Vercel never sees it. Anything the live site needs goes in the Vercel project **Settings → Environment Variables**, then Production is redeployed.

## Contact form email (not the domain)

The form posts to [`app/api/contact/route.ts`](app/api/contact/route.ts). It returns 503 until `RESEND_API_KEY` is set. Sending is implemented in [`lib/contact/email.ts`](lib/contact/email.ts).

- `RESEND_API_KEY`: the secret from the Resend dashboard. Required. Same key is also used for affiliate sign-in links.
- `CONTACT_FROM_EMAIL`: the address visitors see as the sender of the notification. It must be on a domain you have verified in Resend (Resend shows DNS records to add for that domain). Either a bare address or a named sender works. Examples: `support@myleaderhealth.com` or `LeaderHealth Website <support@myleaderhealth.com>`. If unset, the code sends as `LeaderHealth Website <support@myleaderhealth.com>`. Resend rejects that until `myleaderhealth.com` is a verified sending domain. Until a domain is verified, Resend only allows `onboarding@resend.dev`, and only to the email on the Resend account.
- `CONTACT_TO_EMAIL`: the inbox that receives each submission. It does not have to be a Resend domain. If unset, mail goes to `support@myleaderhealth.com`. `reply_to` is always the visitor's address, so a reply from that inbox goes back to them.

For the live site, set those three on Vercel Production and redeploy. Copy the same values into `.env.local` only if you want the form to send while running locally. `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` are not in [`.env.example`](.env.example) yet; affiliate mail uses the separate `AFFILIATE_FROM_EMAIL` (example `Leader Health <affiliates@leaderhealth.clinic>`), which also has to be a verified Resend sender.

## Until the domain cutover

Leave `NEXT_PUBLIC_SITE_URL` unset only if you want JSON-LD and affiliate links to already say `https://leaderhealth.clinic` (that is the production fallback in [`lib/seo/schema.ts`](lib/seo/schema.ts), even while the browser is on `leaderhealth-platform.vercel.app`). To make those links match the URL people actually open today, set Production `NEXT_PUBLIC_SITE_URL` to `https://leaderhealth-platform.vercel.app` and change it to `https://leaderhealth.clinic` on the day DNS moves.

## Later: attach leaderhealth.clinic

Do this in the Vercel project `leaderhealth-platform` when you want the public site on the clinic domain. Leave the `*.vercel.app` URL in place as a fallback.

## 1. Add the domain in Vercel

In the project: **Settings → Domains**.

- Add `leaderhealth.clinic` and assign it to Production.
- Add `www.leaderhealth.clinic` and redirect it to the apex (`https://leaderhealth.clinic`). The code and LegitScript badge use the apex, so www should not be the canonical host.
- Vercel will show the exact DNS records and issue the certificate after those records resolve.

## 2. Change only the website DNS

At the registrar (or wherever `leaderhealth.clinic` DNS is hosted), point the website records at Vercel and leave everything else alone.

- Apex `leaderhealth.clinic`: the A record Vercel shows (typically `76.76.21.21`). If the registrar supports it, an ALIAS/ANAME to `cname.vercel-dns.com` is equivalent.
- `www`: CNAME to `cname.vercel-dns.com`.

Do not change these. They are separate apps already linked from this site:

- `products.leaderhealth.clinic` (Get Started / quiz) in [`lib/content/site.ts`](lib/content/site.ts)
- `myportal.leaderhealth.clinic` (patient portal), same file
- Any MX, SPF, DKIM, or DMARC records. Site email is `@myleaderhealth.com`, but `affiliates@leaderhealth.clinic` is the Resend sender in [`.env.example`](.env.example). Overwriting TXT/MX records would break that mail.

This replaces whatever currently serves the live apex. Propagation is often a few minutes and can take up to 48 hours. Vercel marks the domain Valid once the certificate is issued.

## 3. Set the production site URL and redeploy

In Vercel **Settings → Environment Variables**, for Production only:

- `NEXT_PUBLIC_SITE_URL` = `https://leaderhealth.clinic`

That variable is read at build time by `siteOrigin()` in [`lib/seo/schema.ts`](lib/seo/schema.ts) (JSON-LD and affiliate links). Production already falls back to this URL if the variable is unset, so this is a lock-in, not a code fix. Redeploy Production after saving it. Do not set it on Preview or Development.

No application code needs to change for the cutover.

## 4. Allow the new origin where other systems check the host

- **Checkout iframe.** `/checkout` embeds the separate app at `leader-health-internal-checkout-page-git-main-leader-health.vercel.app` ([`lib/cart/storefrontCheckout.ts`](lib/cart/storefrontCheckout.ts)). If that project restricts parent origins or `frame-ancestors`, add `https://leaderhealth.clinic`.
- **NMI.** If the Collect.js tokenization key is locked to referring domains in the NMI portal, add `leaderhealth.clinic`. Collect.js runs inside the checkout iframe, so this only matters if that key is restricted to the parent host.
- **Resend.** Confirm the `leaderhealth.clinic` sending domain is still verified after the DNS edit. Do not replace its DKIM/SPF records with the website records.

## 5. Confirm after DNS is valid

- `https://leaderhealth.clinic` loads this deployment, and `https://www.leaderhealth.clinic` redirects to the apex.
- `https://products.leaderhealth.clinic` and `https://myportal.leaderhealth.clinic` still open the quiz and portal.
- A product can be added to the cart and the checkout iframe loads.
- An affiliate tracking link copies as `https://leaderhealth.clinic/?ref=...`.
