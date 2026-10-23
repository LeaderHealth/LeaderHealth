---
name: Hide without deleting
overview: Keep hidden products and page sections in the same staging-to-main code, and turn them off with the existing listed flag so bringing one back is a small edit, not a branch merge.
todos:
  - id: catalog-404
    content: Make unlisted products and articles return a 404 and stop building those pages
    status: completed
  - id: nav-home
    content: Filter the navbar, mobile menu, tablet menu, footer, and homepage from the same listed and visible flags
    status: pending
  - id: checkout-guard
    content: Refuse checkout and cart adds for unlisted products
    status: completed
isProject: false
---

# Hide work in place, do not park it on a branch

When a request comes in to take something off the site, leave the code where it is. Mark it as not listed. Ship that change on `staging`, then to `main`. The files stay in the project, so they keep working with the rest of the site. Turning something back on later is removing that mark.

## Why a separate branch is a bad place to store this

A branch feels like a safe drawer. You put the old pages on `archive/peptides` (or similar) and delete them from `staging`. The problem shows up months later, when you want that work back.

`staging` and `main` do not sit still. Checkout rules, navigation, product IDs, and page layout keep changing. The archive branch stays frozen on the day you cut it. By the time you need the old work, the rest of the site has moved on. Putting it back means merging two versions of the same files and fixing conflicts by hand. That is slower and riskier than flipping a setting.

This repo already shows the drift. `main` is 15 commits ahead of its remote and 1 commit behind it. Another long-lived branch would add a third copy to keep in sync.

A branch is also easy to forget. It is not what the live site runs. Nobody notices when it no longer matches cart rules or a redesigned header until the day you try to merge it.

Git already remembers deleted files in history. The reason to keep the files in the current code is practical: they stay up to date. A hidden product still type-checks, still has its images and checkout IDs, and still fits the current page layout. You do not rebuild it from an old snapshot.

Use a branch only while something is unfinished and not ready to live on `staging`. Once it is in, hide it with the flag and delete that branch.

If you want a bookmark of the full site before a big round of hiding, put a tag on today's `staging` commit, for example `archive/full-site-2026-10-22`. A tag is a label on one commit. It does not move and it does not need merges. It is a reference point, not the way you turn a product back on.

## What we already have

Products and articles already have a `listed` field in [lib/content/products.ts](lib/content/products.ts) and [lib/content/articles.ts](lib/content/articles.ts).

- `listed: false` means "keep the record, do not show it in the shop."
- Shop pages and search already skip those items.
- NAD+, both combo-troche products, and a few articles already use this. Their text, images, and checkout IDs are still in the file.

That flag is the off switch. The holes below are the places that do not read it yet.

## What still shows hidden work, and how to close each hole

**The product page still exists if you know the URL.** [app/products/[slug]/page.tsx](app/products/[slug]/page.tsx) builds a page for every product, including ones with `listed: false`. Someone with an old link, or Google, can still open it.

Fix: if the product is unlisted, show the normal "page not found" page. Stop generating those URLs. Do the same for articles in [app/articles/[slug]/page.tsx](app/articles/[slug]/page.tsx). The blog list already hides them; the direct link should too.

**The navbar and the footer each keep their own list of links.** Hiding a product in the catalog does not remove it from either one. NAD+ is already `listed: false` and still sits in the footer under Longevity.

The desktop menu in [components/Header.tsx](components/Header.tsx) reads [lib/content/nav.ts](lib/content/nav.ts). The phone menu ([components/MobileNav.tsx](components/MobileNav.tsx)) and the tablet menu ([components/TabletNav.tsx](components/TabletNav.tsx)) use that same file, then add a few links of their own, including Peptides and Energy & Longevity. The footer does not use that file. Its treatment links are written out again in [components/Footer.tsx](components/Footer.tsx). About, Contact, FAQ, Learn, and the legal links are a separate short list in both the header and the footer.

Fix, in two groups:

- Product links (Semaglutide, NAD+, testosterone, and the rest). After the list is built, drop any link whose product has `listed: false`. Do this for the shared menu data and again for the footer list. If every product in a group is hidden, hide that group too, so visitors do not see an empty "Longevity" or "Sexual Health" heading. Homepage campaign cards in [components/HomePage.tsx](components/HomePage.tsx) use the same check.
- Page links that are not a single product (About, FAQ, the Peptides page, the Energy page, a footer column). Give each one `visible: true` or `visible: false` in one small list. The header, the phone menu, the tablet menu, and the footer all read that list. A hidden page drops out of every one of them together. Legal links stay unless someone explicitly asks to hide a policy.

**Checkout can still sell a hidden product.** A saved checkout link can pass a product id even after the shop no longer shows it.

Fix: when something is added to the cart or sent to checkout, look up the product and reject it if `listed` is false. The id stays in the product file for the day you turn it back on. It just cannot be purchased while it is hidden.

**A homepage block or a whole marketing page is not a product.** Examples: the peptides page, an energy section, a testimonial block. There is no `listed` field on those.

Fix: do not delete the component. Stop placing it on the page, and keep a short on/off list in one content file (`visible: false` next to the section or page name). The header, footer, and homepage read that list. Turning the section back on is changing `false` to `true` and putting the component back in the layout. The component file never leaves the repo.

## How a hide request gets done

1. Set `listed: false` on the product or article, or `visible: false` on a section or page.
2. Check the desktop menu, the phone menu, the tablet menu, the footer, the homepage, the shop, search, the direct URL, and checkout. The item should be gone from all of them.
3. Commit that on `staging` and promote it to `main`. Both sites run the same code. What visitors see is controlled by the flag, not by which branch is deployed.
