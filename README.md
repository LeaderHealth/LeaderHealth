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

Copy `.env.example` to `.env.local` and set `GEN_HEALTH_API_KEY`, then restart `npm run dev`. If that variable is unset, local checkout reads the key from `firebase/functions/config.js`.

Continue to checkout posts the cart to `POST /api/cart/checkout`. The route loads the Gen Health catalog and matches each cart line by its `clientProductId`. A match sends the browser to the storefront checkout. The default origin is `http://localhost:8888`, so the storefront needs to be running there. Set `NEXT_PUBLIC_STOREFRONT_ORIGIN` in `.env.local` to use another origin, then restart `npm run dev`. Leave that variable unset in production.

Without `GEN_HEALTH_API_KEY`, the cart still accepts products, but checkout stops before the catalog is loaded and every item gets the same message.
