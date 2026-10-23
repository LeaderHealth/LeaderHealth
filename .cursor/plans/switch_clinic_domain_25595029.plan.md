---
name: Switch clinic domain
overview: Replace the Framer site on leaderhealth.clinic with the Vercel project leaderhealth-platform. You add the domain in Vercel, swap the apex and www DNS records off Framer, then remove the domain from the Framer project.
todos:
  - id: vercel-domain
    content: In Vercel project leaderhealth-platform, add leaderhealth.clinic as Production and redirect www to the apex
    status: pending
  - id: dns
    content: At the DNS host, replace only the Framer A and CNAME records for the apex and www with the records Vercel shows. Leave products, myportal, and mail records unchanged
    status: pending
  - id: framer-remove
    content: After the clinic domain loads the Vercel site, remove leaderhealth.clinic and www from the Framer project so Framer no longer claims the domain
    status: pending
  - id: env-redeploy
    content: Set NEXT_PUBLIC_SITE_URL=https://leaderhealth.clinic on Vercel Production and redeploy
    status: pending
  - id: verify
    content: Confirm the clinic domain, www redirect, products and portal subdomains, and checkout
    status: pending
isProject: false
---

# Put this site on leaderhealth.clinic

Today [https://leaderhealth.clinic](https://leaderhealth.clinic) is the Framer site. This app is live at [https://leaderhealth-platform.vercel.app](https://leaderhealth-platform.vercel.app). No code change is required. You do this in Vercel, at the place that hosts DNS for `leaderhealth.clinic`, and in Framer.

Changing the apex and `www` records is what takes Framer off the public URL. Removing the domain inside Framer is the cleanup so Framer stops claiming it. Do the DNS change first, confirm this site is up, then remove it in Framer.

If the CookieYes banner still needs to be on the Vercel site before public traffic moves, finish that first. This cutover does not install it.

## 1. Add the domain in Vercel

Open the Vercel project `leaderhealth-platform` → **Settings → Domains**.

- Add `leaderhealth.clinic` and assign it to **Production** (the deployment that is already on `leaderhealth-platform.vercel.app`).
- Add `www.leaderhealth.clinic` and set it to **redirect** to `https://leaderhealth.clinic`.
- Copy the DNS records Vercel shows. Use those values in the next step, not a remembered IP. Vercel’s usual values are an A record of `76.76.21.21` for the apex and a CNAME of `cname.vercel-dns.com` for `www`.
- Leave `leaderhealth-platform.vercel.app` attached. It keeps working after the cutover.

Vercel will show the new domain as misconfigured until DNS updates. That is expected.

## 2. Point the website DNS at Vercel

Open the DNS host for `leaderhealth.clinic` (the registrar, Cloudflare, or wherever the records live). Replace only the records that currently send the main site to Framer.

- Apex (`@` / `leaderhealth.clinic`): delete the Framer A records (Framer’s are often `31.43.160.6` and `31.43.161.6`, or a CNAME to `sites.framer.app`). Add the single A record Vercel gave you.
- `www`: delete the Framer CNAME (often `sites.framer.app`). Add a CNAME to `cname.vercel-dns.com`, or whatever host Vercel lists.

Leave these records exactly as they are:

- `products.leaderhealth.clinic` (Get Started / quiz)
- `myportal.leaderhealth.clinic` (patient portal)
- MX, SPF, DKIM, and DMARC records. Those are mail. The public site email is `@myleaderhealth.com`. Replacing TXT or MX records can break sending.

If the domain’s nameservers are Framer’s, move DNS back to the registrar (or Cloudflare) and recreate the records there, including the untouched subdomains and mail records, before deleting anything. Export or screenshot the full zone first.

On Cloudflare, set the apex and `www` records to DNS only (grey cloud) until Vercel marks the domain Valid.

Propagation is often a few minutes and can take up to 48 hours. During that window some visitors still see Framer and some see this site.

## 3. Remove the domain from Framer

After `https://leaderhealth.clinic` shows this Vercel site (the “Become the strongest version of yourself” page from `leaderhealth-platform`, not the old Framer page):

- In the Framer project, open **Site Settings → Domains** and remove `leaderhealth.clinic` and `www.leaderhealth.clinic`.
- Unpublish the Framer site, or leave the project in the Framer account unpublished. The project can stay as an archive. It will no longer be what visitors get at the clinic domain.

Do this after DNS is serving Vercel. Removing the domain in Framer while DNS still points at Framer replaces the old site with a Framer error, not with this app.

## 4. Lock the site URL and redeploy

In Vercel → **Settings → Environment Variables**, Production only:

- `NEXT_PUBLIC_SITE_URL` = `https://leaderhealth.clinic`

Redeploy Production. Affiliate links and structured data in [`lib/seo/schema.ts`](lib/seo/schema.ts) already fall back to that URL in production. Setting it makes the cutover explicit. Do not set it on Preview.

## 5. Check the live site

- `https://leaderhealth.clinic` is this app, with a valid certificate.
- `https://www.leaderhealth.clinic` redirects to the apex.
- `https://products.leaderhealth.clinic` still opens the quiz.
- `https://myportal.leaderhealth.clinic` still opens the portal.
- Add a product and confirm `/checkout` still loads the checkout iframe.
- Framer’s domain settings no longer list `leaderhealth.clinic`.
