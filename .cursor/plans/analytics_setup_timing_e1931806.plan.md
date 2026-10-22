---
name: Analytics setup timing
overview: Reuse the Framer PostHog project and GA4 property. You copy the existing IDs, the site build sends events labeled site=cursor, you verify on leaderhealth-platform.vercel.app, then the domain cutover points leaderhealth.clinic at that same build.
todos:
  - id: env-ids
    content: Add the existing Framer PostHog key, PostHog host, and GA4 measurement ID as Vercel env vars
    status: pending
  - id: install-tags
    content: Initialize PostHog and GA4 once from the root layout, with a client pageview on App Router navigations and a PostHog ingest proxy
    status: completed
  - id: exclude-phi
    content: Do not load analytics on /checkout, /checkout/success, or /admin
    status: completed
  - id: cookie-choice
    content: No cookie banner in this pass. CookieYes will gate PostHog and GA4 later. Until then the tags load on public pages.
    status: cancelled
  - id: verify-before-dns
    content: Confirm events on the preview host in PostHog Live and GA4 Realtime, then switch the domain
    status: pending
isProject: false
---

# PostHog and Google Analytics through the domain switch

Nothing in the repo sends analytics today. [app/layout.tsx](app/layout.tsx) wraps every route through [components/SiteShell.tsx](components/SiteShell.tsx), and [package.json](package.json) has no `posthog-js` or Google tag. Live production is [https://leaderhealth-platform.vercel.app/](https://leaderhealth-platform.vercel.app/). `leaderhealth.clinic` still serves Framer until the later DNS cutover in [switch_clinic_domain_25595029.plan.md](switch_clinic_domain_25595029.plan.md).

## Why this order

Put the tags in the build **before** the domain switch, then verify on the Vercel URL. Do not wait until after DNS moves.

- The same PostHog project and the same GA4 measurement ID keep Framer history in one place. A new property would split the data.
- Those IDs are not locked to Framer. Each site sends events only from the snippet loaded on that site. Installing PostHog here records this Next.js site. Framer keeps sending from the snippet already on `leaderhealth.clinic` until that Framer project is unpublished or its tag is removed.
- Both streams share one project and stay distinguishable. Before the domain switch, filter on host: Framer is `leaderhealth.clinic`, this site is `leaderhealth-platform.vercel.app`. The super property `site: cursor` labels this site even during the short DNS window, when both servers can answer for `leaderhealth.clinic`. Framer events will not have that property. After Framer is unpublished, `leaderhealth.clinic` traffic is this site only. A leftover Framer URL would be a different host.
- If the tags are added only after the switch, everyone who visits in that gap is missing from both tools.
- Preview traffic before the switch shows up in the same project. Filter it by hostname (`leaderhealth-platform.vercel.app`) or by `site: cursor`. A second PostHog project is unnecessary.
- After the cutover, unpublish Framer or remove its tags so an old Framer URL cannot keep sending events.

In GA4, keep the existing web stream. The stream URL can stay `leaderhealth.clinic`; hits from the Vercel host still arrive on that measurement ID. Mark the Vercel host as internal traffic and leave that filter on Testing until the check passes. In PostHog, event capture works from any host. Only add domains if the project already uses an authorized-URL list for replay or the toolbar.

`NEXT_PUBLIC_*` values are baked in when Vercel builds. Set them, then redeploy. Opening the site without that redeploy sends nothing.

## 1. You, in PostHog

1. Open the PostHog project Framer already sends to (the same login and project, US at `us.posthog.com` or EU at `eu.posthog.com`).
2. Go to **Settings → Project**. Copy the **Project API key** (`phc_…`). That is `NEXT_PUBLIC_POSTHOG_KEY`.
3. On that same page, copy the ingest host. US is `https://us.i.posthog.com`. EU is `https://eu.i.posthog.com`. That is `NEXT_PUBLIC_POSTHOG_HOST`. The app URL (`us.posthog.com`) is not the ingest host.
4. Authorized URLs are under **Settings (gear) → Project → Web analytics → Authorized URLs** (also labeled Web analytics domains). Direct link: `https://us.posthog.com/settings/project-web-analytics#web-analytics-authorized-urls` (use `eu.posthog.com` if the project is in the EU). The old Toolbar settings page redirects here. This list is for the toolbar and web analytics filters. If it already has domains, add `https://leaderhealth-platform.vercel.app` and `https://leaderhealth.clinic`. If it is empty, leave it empty. An empty list does not block events.
5. Leave the Framer snippet in place. It keeps recording `leaderhealth.clinic` until you unpublish Framer after DNS.

## 2. You, in GA4

1. Open the GA4 property Framer already uses. **Admin** (gear, bottom left) → **Data collection and modification → Data streams**.
2. Open the existing **Web** stream. Copy the **Measurement ID** (`G-…`). That is `NEXT_PUBLIC_GA_MEASUREMENT_ID`. Leave the stream URL as `leaderhealth.clinic`. Hits from the Vercel host still arrive on this ID.
3. On that stream, open **Enhanced measurement** (the gear). Turn **Page views** off. Leave scrolls, outbound clicks, and the other toggles as they are. This site will send page views itself; leaving that toggle on counts each view twice.
4. **Admin → Data display → Custom definitions → Create custom dimension.**
   - Dimension name: `Site`
   - Scope: Event
   - Event parameter: `site`
   - Save. Do this before the first production deploy so reports can split `cursor` from Framer.
5. **Admin → Data collection and modification → Data filters.** Confirm a filter named **Internal Traffic** exists, type Internal traffic, parameter value `internal`. Set its state to **Testing**. Leave it on Testing until after the domain switch. Testing labels Vercel traffic without deleting it, so you can still see the check in Realtime.

## 3. In this repo, before any DNS change

Implement once in the root layout so every current and future page in this app is covered:

- Add `posthog-js`. Initialize it from [app/layout.tsx](app/layout.tsx). Register super property `site: cursor` on every event. If the key is missing, send nothing.
- Proxy PostHog in [next.config.ts](next.config.ts): `/ingest` rewrites to the PostHog host, and the client uses `/ingest` as `api_host`.
- Load GA4 with `next/script`. `send_page_view: false`. A client component sends `page_view` on `usePathname` and `useSearchParams`, with event parameter `site: cursor`. On `leaderhealth-platform.vercel.app` only, also set `traffic_type: internal`.
- Skip `/checkout`, `/checkout/success`, and `/admin`. [lib/content/cookies-policy.ts](lib/content/cookies-policy.ts) forbids behavioral analytics where health data is processed. `/checkout` collects health screening, so it stays off. Public pages, including `/affiliates` marketing pages, stay on.
- No cookie banner and no footer Cookie Preferences control in this pass. CookieYes will own consent later and will be wired to gate these tags. Until that install, PostHog and GA4 load on the allowed pages.
- Next.js changes pages without a full reload, so a tag that only runs on first load misses every in-site click. That is why page views are sent again on each client navigation.

Asking to execute this plan builds this section in the repo. It does not log into PostHog, GA4, or Vercel, and it does not change DNS. Those stay the numbered steps outside this section. After the code is in, the three Production env vars and a redeploy still have to happen before any events are sent.

## 4. You, on Vercel, then the rebuild

1. Vercel project `leaderhealth-platform` → **Settings → Environment Variables**. Add these for **Production**:
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`
2. **Deployments → the latest Production deployment → Redeploy.** Turn off “use existing Build Cache” so the new env vars are compiled into the client bundle.
3. Wait until that deployment is Ready. The live URL is still `https://leaderhealth-platform.vercel.app`. DNS has not moved.

## 5. You, verify on the Vercel URL

1. Open a private window to `https://leaderhealth-platform.vercel.app`.
2. PostHog → **Activity → Live events**. Confirm a `$pageview` with `site` = `cursor` and `$host` = `leaderhealth-platform.vercel.app`. Click through to a shop or article page and confirm a second pageview without a full reload.
3. Open `/checkout`. Confirm no new PostHog event for that page.
4. GA4 → **Reports → Realtime**. Confirm an active user and a page path on `leaderhealth-platform.vercel.app`, with event parameter `site` = `cursor`. Click to another public page and confirm the path changes.
5. Framer traffic on `leaderhealth.clinic` continues in the same project without `site` = `cursor`.

## 6. Domain switch, after that check passes

Follow [switch_clinic_domain_25595029.plan.md](switch_clinic_domain_25595029.plan.md). Analytics needs no second install. The same Production build starts recording `leaderhealth.clinic` when DNS points at Vercel.

1. Vercel → **Settings → Domains**. Add `leaderhealth.clinic` on Production. Add `www.leaderhealth.clinic` and redirect it to the apex.
2. At the DNS host, point only the apex and `www` at the records Vercel shows. Leave `products`, `myportal`, and mail records unchanged.
3. Set Production `NEXT_PUBLIC_SITE_URL` = `https://leaderhealth.clinic` and redeploy Production (this is the site-URL lock-in from the domain plan; the analytics keys are already in the build).
4. When `https://leaderhealth.clinic` loads this site, unpublish the Framer site or remove its PostHog and GA tags.
5. Private window on `https://leaderhealth.clinic`. PostHog Live shows `$host` = `leaderhealth.clinic` and `site` = `cursor`. GA4 Realtime shows that host and the same parameter.
6. In GA4, set the **Internal Traffic** filter from Testing to **Active**. Visits to the leftover `leaderhealth-platform.vercel.app` URL then drop out of standard reports. `leaderhealth.clinic` traffic stays.
7. `https://www.leaderhealth.clinic` redirects to the apex. `products.leaderhealth.clinic` and `myportal.leaderhealth.clinic` are unchanged and stay untracked until those apps get their own snippets.

## Will new pages be tracked?

Yes, for pages added in this Next app. The snippet sits on the root layout, so a new route, and every URL under existing dynamic routes (`/products/[slug]`, `/articles/[slug]`, `/labs/[slug]`, `/legal/[slug]`), gets a pageview and PostHog autocapture with no extra tag.

Two limits:

- A page on another host is not covered. The patient portal (`myportal.leaderhealth.clinic`) and the quiz (`products.leaderhealth.clinic`) need their own snippets if they should be in the same project.
- Framer custom events (a named purchase or add-to-cart conversion) do not transfer. Pageviews, clicks, and GA4 enhanced measurement do. Purchase and other named events are a separate follow-up on checkout success, and checkout itself should stay untracked for health-data reasons unless that event is sent without page contents or form answers.
