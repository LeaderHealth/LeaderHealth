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

Set `AFFILIATE_ADMIN_EMAIL` and `AFFILIATE_ADMIN_PASSWORD`, then open [http://localhost:3000/admin/affiliates](http://localhost:3000/admin/affiliates). The sign-in screen lets you choose Admin or Affiliate. Admins sign in with that email and password. From that page, add a name, email, and commission percent, and optionally a portal password of 8–128 characters. Saving the account assigns a unique affiliate ID and a default tracking link. That link uses the affiliate ID and includes `utm_source`, `utm_medium`, and `utm_campaign`. Admins copy it from the tracking-links list, and each affiliate sees the same link after signing in. The page also lists the promo codes created in Gen Health. Each row can activate, deactivate, or replace that portal password. Clicks and paid orders are stored in Firestore. Commission totals skip dry-run checkouts.

Affiliates sign in at [http://localhost:3000/affiliates](http://localhost:3000/affiliates) with the email and portal password from the admin page. They see only their own clicks, paid orders, commission, and referral link. A wrong email, wrong password, or deactivated code all show the same message.

Email sign-in links stay hidden until both `RESEND_API_KEY` and `AFFILIATE_FROM_EMAIL` are set. `AFFILIATE_FROM_EMAIL` must be a verified Resend sender, for example `Leader Health <affiliates@leaderhealth.clinic>`. A link expires in 15 minutes, works once, and can be requested again after one minute. Existing affiliates have no password until you set one; until then they can sign in only by email link, and only after Resend is configured.

### Firestore rules

`firestore.rules` denies every client read and write. This site reads and writes Firestore only from the server through the Admin SDK, which is not limited by these rules. Publish the rules after any change:

```powershell
npx --yes firebase-tools login
npx --yes firebase-tools deploy --only firestore:rules --project leaderhealth-affiliate
```

The sign-in account needs access to the `leaderhealth-affiliate` project. Mark paid on the Payouts page only records a payment that was already made somewhere else. It does not send money.

## Affiliate order tracking

Affiliate order tracking is integrated between the Leader Health website and internal checkout repositories using Firebase Firestore. Leader Health stores the affiliate ID alongside the corresponding Gen Health order ID, rather than relying on Gen Health to store affiliate information.

### How it works

The internal checkout captures the affiliate ID from `utm_source`. Once Gen Health creates an order, checkout sends both the affiliate ID and Gen Health order ID to Leader Health through `POST /api/affiliate/order`. The endpoint validates the request using a shared secret and saves the association in Firestore. Once Gen Health confirms payment, the dashboard matches the order ID, attributes the sale, and calculates commission using the affiliate's assigned rule.

Creating an order does not guarantee a completed purchase. Waiting for Gen Health to confirm payment prevents commissions from being calculated on unpaid or abandoned orders.

### Environment variables

Both repositories must use the same shared secret, which developers can configure themselves in their local environment files. No additional secret-generation setup is required.

Leader Health website (`.env.local`):

```env
AFFILIATE_ORDER_SECRET=YOUR_SHARED_SECRET
```

Internal checkout (`.env`):

```env
LEADERHEALTH_ORIGIN=http://localhost:3000
LEADERHEALTH_AFFILIATE_SECRET=YOUR_SHARED_SECRET
```

For production, replace `localhost:3000` with the deployed Leader Health website origin. Keep secrets server-side.

### Testing without a card

Manually test affiliate order attribution using an existing paid Gen Health order ID.

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/affiliate/order" -Headers @{ "x-affiliate-secret" = "YOUR_SHARED_SECRET" } -ContentType "application/json" -Body '{"orderId":"YOUR_PAID_GENHEALTH_ORDER_ID","utm_source":"YOUR_AFFILIATE_ID"}'
```

- `YOUR_SHARED_SECRET`: shared secret configured locally in both repositories.
- `YOUR_PAID_GENHEALTH_ORDER_ID`: existing paid order ID from Gen Health.
- `YOUR_AFFILIATE_ID`: unique affiliate ID used as `utm_source`.

The endpoint saves the order-to-affiliate association in Firestore. When the dashboard imports paid Gen Health orders, it matches the order ID and calculates the affiliate's commission.

This command manually associates an existing order with an affiliate. It does not verify automatic checkout integration. Use test orders to avoid incorrectly attributing real customer purchases.

### Real transaction testing

Complete a real purchase through an affiliate tracking link to verify that:

- The affiliate ID and Gen Health order ID are automatically sent to Leader Health and saved in Firestore.
- The paid order appears under Admin → Affiliates → Orders with accurate sales and commission amounts.
- The order is recorded only once, preventing duplicate commissions.

Affiliate order tracking is implemented and supports manual testing. A real transaction is still required to validate the complete checkout-to-commission workflow.
