---
name: Required labs card
overview: "Replace the “labs included” card with a required-labs notice: upload existing results in the patient portal after checkout, or add the same Complete and/or Advanced panel the product already calls for."
todos:
  - id: rewrite-card
    content: Rewrite BundledLabPanel to say labs are required, explain portal upload, and add the existing Complete and/or Advanced panel for that product's audience
    status: completed
  - id: fix-contradicting-copy
    content: Update the testosterone cypionate highlight and the women's program hero sentence that still say labs are included or scheduled
    status: completed
  - id: verify-labs-card
    content: "Check a Complete-only product and Women's Hormone Therapy: copy, buttons, and adding the gendered lab to the cart"
    status: completed
isProject: false
---

# Required labs instead of included labs

The glass card in [components/BundledLabPanel.tsx](components/BundledLabPanel.tsx) currently tells people the lab is included and shows an **Included** badge. That card is rendered on product heroes via [components/ProductHero.tsx](components/ProductHero.tsx) and on the women’s program page in [components/WomenHormoneTherapy.tsx](components/WomenHormoneTherapy.tsx).

Keep which panel each treatment asks for:

- Complete only: Testosterone Cypionate, Testosterone Cream (men), Testosterone Cream (women), low-dose testosterone injection
- Complete and Advanced: Women’s Hormone Therapy, Enclomiphene, Estradiol Pill

## Card

Turn `BundledLabPanel` into a client component. Shared copy, with the **Required** badge in place of **Included**:

- Labs are required before treatment.
- If you already have results, upload them in the patient portal after checkout.
- If you don’t, add the panel below.

Add buttons use `cartItemFromLab` and the product audience, so a men’s treatment adds the Men lab and a women’s treatment adds the Women lab. Prices stay Complete $179 and Advanced $399. The free provider-consultation row stays.

If that exact lab is already in the cart, the button does not raise the quantity. A second, different panel still hits the existing one-lab cart rule.

## Same-screen copy that still says labs are included

- Testosterone Cypionate `highlight` in [lib/content/products.ts](lib/content/products.ts): drop “labs are included” and keep the $109/month offer.
- Women’s program hero sentence in [components/WomenHormoneTherapy.tsx](components/WomenHormoneTherapy.tsx) that says upload during intake and that the panel will be scheduled: replace it so it matches the card.

Leave the FAQ line about routine monitoring labs alone. That is follow-up care, not this purchase card.

## Check

On a Complete-only product and on Women’s Hormone Therapy, confirm the card no longer says included, the right panel buttons appear, and adding a lab puts the gendered panel in the cart.