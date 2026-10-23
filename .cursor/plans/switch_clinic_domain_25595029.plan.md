---
name: Switch clinic domain
overview: Replace the Framer site on leaderhealth.clinic with the Vercel project leaderhealth-platform. You add the domain in Vercel, swap the apex and www DNS records off Framer, then remove the domain from the Framer project.
todos:
  - id: vercel-domain
    content: In Vercel project leaderhealth-platform, add leaderhealth.clinic as Production and redirect www to the apex
    status: pending
  - id: dns
    content: In Cloudflare, delete the two Framer A records, add the apex CNAME and both _vercel TXT records Vercel shows, and point www at the same Vercel CNAME. Leave every other record.
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

Open the Vercel project `leaderhealth-platform` → **Settings → Domains** → **Add Domains**.

On the dialog, for the apex:

- Domain: `leaderhealth.clinic`
- Uncheck **Redirect apex domains to www**. That box makes `www.leaderhealth.clinic` the public site and sends `leaderhealth.clinic` to www. This app, the affiliate links, and the LegitScript badge use the apex.
- **Connect to an environment** → **Production**
- Add the domain

Then add `www.leaderhealth.clinic` in a second pass:

- Choose **Redirect to Another Domain**
- Redirect to `leaderhealth.clinic`
- Use a **308 Permanent Redirect**

Copy the DNS records from the Vercel domain page. This project is on the new Vercel DNS target, so there is no A record. Both `leaderhealth.clinic` and `www` use a CNAME to `93a890475e381814.vercel-dns-016.com`. Vercel also asks for two TXT records at `_vercel` because the domain is already linked to another Vercel account. Leave `leaderhealth-platform.vercel.app` attached. It keeps working after the cutover.

Vercel will show the new domain as misconfigured until DNS updates. That is expected.

## 2. Match the records on the Vercel domain page

DNS is on Cloudflare. Vercel is not asking for `76.76.21.21`. Cloudflare can put a CNAME on the apex, which is the record Vercel shows. Copy each value with the copy button on that page so the long TXT strings are complete. Set every new or edited record to **DNS only** (grey cloud).

Delete:

- Both apex A records: `leaderhealth.clinic` → `31.43.160.6` and `leaderhealth.clinic` → `31.43.161.6`. Those are Framer. The apex CNAME cannot be added while these A records exist.
- The `_acme-challenge` CNAME (`82358840-24dc-…`). That is Framer’s certificate check.

Add or edit:

- Apex CNAME: name `@`, target `93a890475e381814.vercel-dns-016.com`.
- `www` CNAME: change `sites.framer.app` to `93a890475e381814.vercel-dns-016.com`.
- Two TXT records, both named `_vercel`. One value starts with `vc-domain-verify=leaderhealth.clinic,` and the other with `vc-domain-verify=www.leaderhealth.clinic,`. The orange banner is why these exist: the domain is already claimed by a different Vercel account, and these records prove this project may use it. Vercel says they can be removed after verification succeeds.

Leave every other row. That includes the three CAA records, `_domainconnect`, `affiliate`, `autodiscover`, `myportal`, `products`, `pm-bounces`, `rsend`, `send`, the MX record, and the existing TXT records. Those are the quiz, the portal, and mail.

In Vercel, click **Refresh** on both domains after Cloudflare saves. Both should leave “Verification Required” and the apex should show Production. Propagation is often a few minutes. During that window some visitors still see Framer.

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
