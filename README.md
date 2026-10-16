# LeaderHealth-Platform

Next.js rebuild of [leaderhealth.clinic](https://leaderhealth.clinic/).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

Patient Portal, Continue to Checkout, Get Started stay on their existing external URLs.

## Cart checkout

Copy `.env.example` to `.env.local` and set `GEN_HEALTH_API_KEY`, `GEN_HEALTH_PUBLIC_API_BASE_URL`, and `NEXT_PUBLIC_STOREFRONT_ORIGIN`, then restart `npm run dev`. If `GEN_HEALTH_API_KEY` is unset, local checkout reads the key from `firebase/functions/config.js`. That file can also supply `GEN_HEALTH_PUBLIC_API_BASE_URL`.

Continue to checkout posts the cart to `POST /api/cart/checkout`. The route loads the Gen Health catalog from `GEN_HEALTH_PUBLIC_API_BASE_URL` (default `https://api.gen-health.app`) and matches each cart line by its `clientProductId`. A match sends the browser to the storefront checkout. `NEXT_PUBLIC_STOREFRONT_ORIGIN` defaults to `http://localhost:8888`, so the storefront needs to be running there. When that variable is set, `storefrontPath` uses the same origin. Leave `NEXT_PUBLIC_STOREFRONT_ORIGIN` unset in production.

Without `GEN_HEALTH_API_KEY`, the cart still accepts products, but checkout stops before the catalog is loaded and every item gets the same message.

## Affiliate tracking

Leave the Firebase variables unset to skip click and order logging. Tracking uses the existing affiliate Firebase project. Copy that project's service account into `.env.local`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Restart `npm run dev` after changing these. For a local emulator instead of a cloud project, set `FIREBASE_PROJECT_ID` and `FIRESTORE_EMULATOR_HOST` (for example `127.0.0.1:8080`) and leave the service account fields unset.

Set `AFFILIATE_ADMIN_EMAIL` and `AFFILIATE_ADMIN_PASSWORD`, then open [http://localhost:3000/admin/affiliates](http://localhost:3000/admin/affiliates). The sign-in screen lets you choose Admin or Affiliate. Admins sign in with that email and password. From that page, add a code, name, email, and commission percent, and optionally a portal password of 8–128 characters. Each row can activate, deactivate, or replace that portal password. Share links like `/?ref=code`. Clicks and paid orders are stored in Firestore. Commission totals skip dry-run checkouts.

Affiliates sign in at [http://localhost:3000/affiliates](http://localhost:3000/affiliates) with the email and portal password from the admin page. They see only their own clicks, paid orders, commission, and referral link. A wrong email, wrong password, or deactivated code all show the same message.

Email sign-in links stay hidden until both `RESEND_API_KEY` and `AFFILIATE_FROM_EMAIL` are set. `AFFILIATE_FROM_EMAIL` must be a verified Resend sender, for example `Leader Health <affiliates@leaderhealth.clinic>`. A link expires in 15 minutes, works once, and can be requested again after one minute. Existing affiliates have no password until you set one; until then they can sign in only by email link, and only after Resend is configured.
