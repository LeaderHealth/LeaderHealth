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
