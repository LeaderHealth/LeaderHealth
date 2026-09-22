"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { cartItemFromSlug } from "@/lib/cart/items";
import { cartSubtotal } from "@/lib/cart/types";
import { getProduct, labs } from "@/lib/content/products";
import {
  CHECKOUT_STEPS,
  CONSENTS,
  HRT_BLOCKED_STATES,
  INCLUDED_ITEMS,
  MEDICAL_CONDITIONS,
  SUPPORT_EMAIL,
  TRUST_POINTS,
  type CheckoutStepId,
} from "@/lib/checkout/copy";
import {
  countPhoneDigits,
  getDobInputBounds,
  isDetailsComplete,
  isPoBoxAddress,
  isScreeningComplete,
  isShippingComplete,
  isValidDateOfBirth,
  isValidEmail,
  isValidUsZip,
  type ConsentState,
  type ContactState,
  type ShippingState,
} from "@/lib/checkout/validation";
import { matchCatalogItem } from "@/lib/genhealth/match";
import { CHECKOUT_SUCCESS_KEY, formatPrice, type CatalogItem } from "@/lib/genhealth/types";
import { US_STATES } from "@/lib/genhealth/usStates";
import {
  INVALID_KEY_MESSAGE,
  NMI_FIELD_IDS,
  loadCollectJs,
  mountCardFields,
  requestPaymentToken,
  warmGateway,
} from "@/lib/nmi/collect";

export type CheckoutFormProps = {
  catalog: CatalogItem[];
  seedProduct?: string;
  seedVariant?: string;
};

const fieldClass =
  "w-full rounded-full bg-white/90 px-4 py-3 text-sm text-ink outline-none placeholder:text-taupe";
const CHECKOUT_FORM_ID = "lh-checkout-form";

const emptyContact: ContactState = { firstName: "", lastName: "", email: "", phone: "", dob: "" };
const emptyShipping: ShippingState = { address1: "", city: "", state: "TX", zip: "", discreet: true };
const emptyConsent: ConsentState = {
  terms: false,
  privacy: false,
  telehealth: false,
  hipaa: false,
  marketing: false,
};

function isLabSlug(slug: string) {
  return labs.some((lab) => lab.slug === slug) || slug.startsWith("labs-");
}

function isHormoneSlug(slug: string) {
  return getProduct(slug)?.category === "hormone";
}

export function CheckoutForm({ catalog, seedProduct, seedVariant }: CheckoutFormProps) {
  const router = useRouter();
  const { items, addItem, setQuantity, removeItem, ready } = useCart();
  const [openStep, setOpenStep] = useState<CheckoutStepId>("details");
  const [contact, setContact] = useState(emptyContact);
  const [shipping, setShipping] = useState(emptyShipping);
  const [screeningAnswer, setScreeningAnswer] = useState("");
  const [consent, setConsent] = useState(emptyConsent);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [nmi, setNmi] = useState<{
    configured: boolean;
    tokenizationKey: string;
    gatewayBaseUrl: string;
    chargesEnabled: boolean;
  } | null>(null);
  const [collectReady, setCollectReady] = useState(false);
  const [fieldsMounted, setFieldsMounted] = useState(false);
  const dobBounds = useMemo(() => getDobInputBounds(), []);

  useEffect(() => {
    setFieldsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout/nmi")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const tokenizationKey = typeof data.tokenizationKey === "string" ? data.tokenizationKey : "";
        const gatewayBaseUrl =
          typeof data.gatewayBaseUrl === "string" ? data.gatewayBaseUrl : "https://secure.nmi.com";
        setNmi({
          configured: Boolean(data.configured) && Boolean(tokenizationKey),
          tokenizationKey,
          gatewayBaseUrl,
          chargesEnabled: Boolean(data.chargesEnabled),
        });
        if (tokenizationKey) warmGateway(gatewayBaseUrl);
        else setCardError("Payment fields could not load. Refresh the page, or contact support if it keeps happening.");
      })
      .catch(() => {
        if (!cancelled) setNmi({ configured: false, tokenizationKey: "", gatewayBaseUrl: "", chargesEnabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fieldsMounted || !nmi?.configured) return;
    let cancelled = false;
    setCollectReady(false);
    loadCollectJs(nmi.tokenizationKey, nmi.gatewayBaseUrl)
      .then(async () => {
        if (cancelled) return;
        const started = Date.now();
        while (!Object.values(NMI_FIELD_IDS).every((id) => Boolean(document.getElementById(id)))) {
          if (Date.now() - started > 5000) throw new Error(INVALID_KEY_MESSAGE);
          await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
        }
        return mountCardFields({
          onValidation: (field, ok, message) => {
            setFieldErrors((current) => {
              const next = { ...current };
              if (ok) delete next[field];
              else next[field] = message;
              return next;
            });
          },
        });
      })
      .then(() => {
        if (!cancelled) setCollectReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setCollectReady(false);
        setCardError(err instanceof Error ? err.message : INVALID_KEY_MESSAGE);
      });
    return () => {
      cancelled = true;
    };
  }, [fieldsMounted, nmi]);

  useEffect(() => {
    if (!ready || seeded || !seedProduct) return;
    const already = items.some(
      (item) => item.slug === seedProduct && (!seedVariant || item.variant === seedVariant),
    );
    if (!already) {
      const seededItem = cartItemFromSlug(seedProduct, seedVariant);
      if (seededItem) addItem({ ...seededItem, quantity: 1 }, { open: false });
    }
    setSeeded(true);
  }, [addItem, items, ready, seedProduct, seedVariant, seeded]);

  const selected = useMemo(() => {
    const list = Array.isArray(catalog) ? catalog : [];
    for (const line of items) {
      const match = matchCatalogItem(list, { product: line.slug, variant: line.variant });
      if (match) return match;
    }
    return undefined;
  }, [catalog, items]);

  const hasLabs = items.some((item) => isLabSlug(item.slug));
  const hasHormone = items.some((item) => isHormoneSlug(item.slug));
  const blockedByScreening = screeningAnswer === "yes";
  const blockedByState = hasHormone && HRT_BLOCKED_STATES.includes(shipping.state);
  const detailsDone = isDetailsComplete(contact);
  const screeningDone = isScreeningComplete(screeningAnswer, consent);
  const shippingDone = isShippingComplete(shipping) && !blockedByState && !(hasLabs && isPoBoxAddress(shipping.address1));
  const subtotal = cartSubtotal(items);
  const payLabel = subtotal > 0 ? `PAY ${formatPrice(subtotal)}` : "COMPLETE CHECKOUT";

  function patchContact(update: Partial<ContactState>) {
    setContact((current) => ({ ...current, ...update }));
  }
  function patchShipping(update: Partial<ShippingState>) {
    setShipping((current) => ({ ...current, ...update }));
  }

  function stepErrors(id: CheckoutStepId) {
    const next: Record<string, string> = {};
    if (id === "details") {
      if (!contact.firstName.trim()) next.firstName = "Enter your first name";
      if (!contact.lastName.trim()) next.lastName = "Enter your last name";
      if (!isValidEmail(contact.email)) next.email = "Enter a valid email address";
      if (countPhoneDigits(contact.phone) < 10) next.phone = "Enter a 10-digit phone number";
      if (!contact.dob) next.dob = "Enter your date of birth";
      else if (!isValidDateOfBirth(contact.dob)) next.dob = "You must be 18 or older.";
    }
    if (id === "screening") {
      if (!screeningAnswer) next.screening = "Please answer the medical screening question.";
      else if (screeningAnswer !== "yes" && !screeningDone) {
        next.consent = "Please review and accept all required agreements.";
      }
    }
    if (id === "shipping") {
      if (!shipping.address1.trim()) next.address1 = "Enter your street address";
      else if (hasLabs && isPoBoxAddress(shipping.address1)) {
        next.address1 = "Lab kits cannot ship to a PO box. Enter a street address.";
      }
      if (!shipping.city.trim()) next.city = "Enter your city";
      if (!shipping.state) next.state = "Select a state";
      if (!isValidUsZip(shipping.zip)) next.zip = "Enter a valid 5-digit ZIP code.";
    }
    return next;
  }

  function advance(id: CheckoutStepId) {
    const next = stepErrors(id);
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    if (id === "shipping" && blockedByState) return;
    setErrors({});
    const index = CHECKOUT_STEPS.findIndex((step) => step.id === id);
    const following = CHECKOUT_STEPS[index + 1];
    if (following) setOpenStep(following.id);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCardError(null);

    for (const step of CHECKOUT_STEPS) {
      if (step.id === "payment") continue;
      const next = stepErrors(step.id);
      if (Object.keys(next).length) {
        setErrors(next);
        setOpenStep(step.id);
        setError(
          step.id === "screening"
            ? Object.values(next)[0]
            : `Please finish ${step.id === "details" ? "your details" : "your shipping address"} to continue.`,
        );
        return;
      }
    }
    if (blockedByScreening) {
      setOpenStep("screening");
      setError("You are not eligible to complete checkout online based on your screening answers.");
      return;
    }
    if (blockedByState) {
      setOpenStep("shipping");
      setError(`We aren’t licensed for hormone therapy in ${shipping.state} yet.`);
      return;
    }
    if (items.length === 0) {
      setError("Add a treatment to your cart before checking out.");
      return;
    }
    if (!selected?.clientProductId) {
      setError("We couldn’t match this treatment. Try another option or contact us.");
      return;
    }

    if (nmi?.configured) {
      if (!collectReady) {
        setOpenStep("payment");
        setError("Payment is still loading. Please wait a moment and try again.");
        return;
      }
    } else if (!nmi || nmi.chargesEnabled) {
      setOpenStep("payment");
      setCardError("Payment fields could not load. Refresh the page, or contact support if it keeps happening.");
      return;
    }

    setPending(true);
    let token = "";
    if (nmi?.configured) {
      try {
        token = await requestPaymentToken();
      } catch (tokenErr) {
        setOpenStep("payment");
        setCardError(tokenErr instanceof Error ? tokenErr.message : "Could not read your card details. Please re-enter them.");
        setPending(false);
        return;
      }
    }
    const payload = {
      clientProductId: selected.clientProductId,
      product: items[0]?.slug,
      variant: items[0]?.variant,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      dateOfBirth: contact.dob,
      street1: shipping.address1,
      city: shipping.city,
      state: shipping.state,
      zip: shipping.zip,
      discreet: shipping.discreet,
      consents: consent,
      paymentToken: token,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        retokenize?: boolean;
        orderId?: string;
        productName?: string;
        magicLink?: string | null;
        charged?: boolean;
        paymentStatus?: string;
      };
      if (!response.ok || !data.success) {
        const message = data.error || "Could not complete checkout.";
        const safe = /genhealth/i.test(message) ? "Could not complete checkout. Try again in a moment." : message;
        if (data.retokenize) {
          setOpenStep("payment");
          setCardError(safe);
        } else {
          setError(safe);
        }
        return;
      }
      sessionStorage.setItem(
        CHECKOUT_SUCCESS_KEY,
        JSON.stringify({
          ...data,
          email: contact.email,
          productName: items.map((item) => item.name).join(", ") || data.productName,
        }),
      );
      router.push("/checkout/success");
    } catch {
      setError("Network error. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  const paymentReady = nmi ? (nmi.configured ? collectReady : !nmi.chargesEnabled) : false;
  const submitDisabled =
    pending || !ready || items.length === 0 || blockedByScreening || blockedByState || !paymentReady;


  return (
    <form
      id={CHECKOUT_FORM_ID}
      onSubmit={onSubmit}
      noValidate
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]"
    >
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-white/80">
            <span>
              Step {CHECKOUT_STEPS.findIndex((step) => step.id === openStep) + 1} of {CHECKOUT_STEPS.length}
            </span>
            <span>{CHECKOUT_STEPS.find((step) => step.id === openStep)?.title}</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-[#dcd4bd] transition-all"
              style={{
                width: `${((CHECKOUT_STEPS.findIndex((step) => step.id === openStep) + 1) / CHECKOUT_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <AccordionCard
            step={1}
            title="Your details"
            subtitle="Name, email, phone, and date of birth"
            summary={detailsDone ? `${contact.firstName} ${contact.lastName}` : undefined}
            complete={detailsDone}
            open={openStep === "details"}
            onToggle={() => setOpenStep("details")}
          >
            {openStep === "details" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName}>
                    <input
                      required
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="Jane"
                      value={contact.firstName}
                      onChange={(event) => patchContact({ firstName: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Last name" error={errors.lastName}>
                    <input
                      required
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="Doe"
                      value={contact.lastName}
                      onChange={(event) => patchContact({ lastName: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Email" error={errors.email}>
                    <input
                      required
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="jane@example.com"
                      value={contact.email}
                      onChange={(event) => patchContact({ email: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Phone" error={errors.phone}>
                    <input
                      required
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="(555) 000-0000"
                      value={contact.phone}
                      onChange={(event) => patchContact({ phone: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Date of birth" error={errors.dob}>
                    <input
                      required
                      type="date"
                      name="dateOfBirth"
                      autoComplete="bday"
                      min={dobBounds.min}
                      max={dobBounds.max}
                      value={contact.dob}
                      onChange={(event) => patchContact({ dob: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <ContinueButton onClick={() => advance("details")}>Continue to screening</ContinueButton>
              </>
            ) : null}
          </AccordionCard>

          <AccordionCard
            step={2}
            title="Screening & consent"
            subtitle="Eligibility and required agreements"
            summary={screeningDone ? "Cleared to continue" : blockedByScreening ? "Needs a care team review" : undefined}
            complete={screeningDone}
            open={openStep === "screening"}
            onToggle={() => setOpenStep("screening")}
          >
            {openStep === "screening" ? (
              <>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/70">Medical screening</p>
                <p className="mt-2 text-sm text-white/90">Do any of the following apply to you?</p>
                <ul className="mt-3 space-y-1.5 text-sm text-white/80">
                  {MEDICAL_CONDITIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "no", label: "No, none apply" },
                    { value: "yes", label: "Yes, one or more" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-full bg-white/10 px-4 py-3 text-sm ${
                        screeningAnswer === option.value ? "ring-2 ring-[#dcd4bd]" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="medicalScreening"
                        value={option.value}
                        checked={screeningAnswer === option.value}
                        onChange={() => setScreeningAnswer(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {errors.screening ? <p className="mt-2 text-sm text-[#ffd6d6]">{errors.screening}</p> : null}
                {blockedByScreening ? (
                  <div className="mt-4 rounded-[18px] bg-[#2a1212]/70 p-4">
                    <p className="font-medium">You can’t complete this order online</p>
                    <p className="mt-2 text-sm text-white/80">
                      Based on your screening answers, this treatment isn’t available through self-checkout. Our care
                      team can talk through safer alternatives with you.
                    </p>
                    <a className="mt-3 inline-block text-sm underline" href={`mailto:${SUPPORT_EMAIL}`}>
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-white/70">Agreements & consent</p>
                    <div className="mt-3 space-y-2">
                      {CONSENTS.map((item) => (
                        <ConsentRow
                          key={item.key}
                          checked={consent[item.key]}
                          title={item.title}
                          onChange={(checked) => setConsent((current) => ({ ...current, [item.key]: checked }))}
                        >
                          {item.prefix}{" "}
                          <Link href={item.href} target="_blank" className="underline">
                            {item.linkLabel}
                          </Link>
                          .
                        </ConsentRow>
                      ))}
                      <ConsentRow
                        checked={consent.marketing}
                        title="Messaging & subscription terms"
                        onChange={(checked) => setConsent((current) => ({ ...current, marketing: checked }))}
                      >
                        By providing my phone number and email, I agree to receive text messages and emails about this
                        offer, my order, and Leader Health updates. I understand this is an auto-renewing subscription
                        billed every 30 days unless cancelled prior. Message and data rates may apply.
                      </ConsentRow>
                    </div>
                    {errors.consent ? <p className="mt-2 text-sm text-[#ffd6d6]">{errors.consent}</p> : null}
                    <ContinueButton onClick={() => advance("screening")}>Continue to shipping</ContinueButton>
                  </>
                )}
              </>
            ) : null}
          </AccordionCard>

          <AccordionCard
            step={3}
            title="Shipping"
            subtitle="Where we send your order"
            summary={shippingDone ? `${shipping.city}, ${shipping.state}` : undefined}
            complete={shippingDone}
            open={openStep === "shipping"}
            onToggle={() => setOpenStep("shipping")}
          >
            {openStep === "shipping" ? (
              <>
                {hasLabs ? (
                  <p className="mb-3 text-sm text-white/80">Your at-home lab kit ships here, so a street address is required.</p>
                ) : null}
                <Field label="Street address" error={errors.address1}>
                  <input
                    required
                    name="street1"
                    autoComplete="street-address"
                    placeholder="123 Main St"
                    value={shipping.address1}
                    onChange={(event) => patchShipping({ address1: event.target.value })}
                    className={fieldClass}
                  />
                </Field>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="City" error={errors.city}>
                    <input
                      required
                      name="city"
                      autoComplete="address-level2"
                      placeholder="City"
                      value={shipping.city}
                      onChange={(event) => patchShipping({ city: event.target.value })}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="State" error={errors.state}>
                    <select
                      required
                      name="state"
                      autoComplete="address-level1"
                      value={shipping.state}
                      onChange={(event) => patchShipping({ state: event.target.value })}
                      className={fieldClass}
                    >
                      {US_STATES.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.code}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ZIP code" error={errors.zip}>
                    <input
                      required
                      name="zip"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={5}
                      placeholder="ZIP"
                      value={shipping.zip}
                      onChange={(event) =>
                        patchShipping({ zip: event.target.value.replace(/\D/g, "").slice(0, 5) })
                      }
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[18px] bg-white/10 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={shipping.discreet}
                    onChange={(event) => patchShipping({ discreet: event.target.checked })}
                  />
                  <span>
                    Ship in plain, unbranded packaging <span className="text-white/70">(recommended)</span>
                  </span>
                </label>
                {blockedByState ? (
                  <div className="mt-4 rounded-[18px] bg-[#2a1212]/70 p-4">
                    <p className="font-medium">We can’t ship hormone therapy to {shipping.state} yet</p>
                    <p className="mt-2 text-sm text-white/80">
                      Try a different shipping state, or remove the hormone therapy item to continue.
                    </p>
                  </div>
                ) : (
                  <ContinueButton onClick={() => advance("shipping")}>Continue to payment</ContinueButton>
                )}
              </>
            ) : null}
          </AccordionCard>

          <AccordionCard
            step={4}
            title="Payment"
            subtitle="Card details — billed to your shipping address"
            complete={detailsDone && screeningDone && shippingDone}
            open={openStep === "payment"}
            keepMounted={fieldsMounted}
            onToggle={() => setOpenStep("payment")}
          >
            <p className="text-sm text-white/80">Card details</p>
            <div
              className={`relative mt-2 min-h-[52px] overflow-hidden rounded-full bg-white/90 px-4 py-3 ${
                cardError ? "ring-2 ring-[#ffd6d6]" : ""
              }`}
              aria-busy={!collectReady || undefined}
            >
              {!collectReady && !cardError ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center gap-3 px-4 text-sm text-taupe">
                  <span className="flex-1">Loading secure card fields…</span>
                  <span>MM / YY</span>
                  <span>CVC</span>
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <div
                  id={NMI_FIELD_IDS.ccnumber}
                  className="nmi-card-slot min-h-6 min-w-0 flex-1"
                  aria-label="Card number"
                />
                <div id={NMI_FIELD_IDS.ccexp} className="nmi-card-slot h-6 w-[72px] shrink-0" aria-label="Expiry date" />
                <div id={NMI_FIELD_IDS.cvv} className="nmi-card-slot h-6 w-[48px] shrink-0" aria-label="Security code" />
              </div>
            </div>
            {!cardError
              ? Object.entries(fieldErrors)
                  .filter(([, message]) => Boolean(message))
                  .map(([field, message]) => (
                    <p key={field} className="mt-2 text-sm text-[#ffd6d6]" role="alert">
                      {message}
                    </p>
                  ))
              : null}
            {cardError ? (
              <p className="mt-2 text-sm text-[#ffd6d6]" role="alert">
                {cardError}
              </p>
            ) : null}
            {shippingDone ? (
              <p className="mt-3 text-sm text-white/75">
                Billed to {shipping.address1}, {shipping.city}, {shipping.state} {shipping.zip} — same as your shipping
                address.
              </p>
            ) : null}
            <p className="mt-3 text-sm text-white/75">
              Secured with 256-bit encryption. Your card number never touches our servers. Your clinician reviews the
              request before anything is prescribed.
            </p>
          </AccordionCard>
        </div>

        {error ? <p className="mt-4 text-sm text-[#ffd6d6]">{error}</p> : null}
        <button
          type="submit"
          disabled={submitDisabled}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-ink disabled:opacity-60"
        >
          {pending ? (nmi?.chargesEnabled ? "PROCESSING PAYMENT…" : "SUBMITTING…") : payLabel}
          <span aria-hidden>→</span>
        </button>
        <p className="mt-3 text-center text-sm text-white/75">
          By paying you agree to our{" "}
          <Link href="/legal/terms-of-service" target="_blank" className="underline">
            terms of service
          </Link>
          .
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[12px] text-white/80">
          {TRUST_POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f37477]" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 lg:sticky lg:top-28">
        <aside className="rounded-[28px] bg-[#331110] p-6 text-[#f7f3f5] md:p-7">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#f37477]">Your bag</p>
          <h2 className="mt-2 font-serif-italic text-[32px] leading-none">Order summary</h2>
          <p className="mt-2 text-sm text-white/60">
            {items.length} {items.length === 1 ? "item" : "items"} · free shipping
          </p>
          <div className="mt-6 space-y-4">
            {!ready ? (
              <p className="text-sm text-white/75">Loading your bag…</p>
            ) : items.length === 0 ? (
              <div>
                <p className="text-sm text-white/75">Nothing in your cart yet.</p>
                <Link
                  href="/shop-all-products"
                  className="mt-4 inline-flex rounded-[10px] bg-[#dcd4bd] px-4 py-2.5 text-xs font-medium tracking-[0.08em] text-ink"
                >
                  SHOP TREATMENTS
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="flex gap-3 border-b border-white/10 pb-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#4a201e]">
                    <Image src={item.image} alt="" fill className="object-contain p-1.5" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight">{item.name}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {isLabSlug(item.slug) ? "One-time lab panel · At-home kit" : item.priceLabel}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full bg-white/10">
                        <button type="button" className="h-7 w-7" onClick={() => setQuantity(item.id, item.quantity - 1)}>
                          –
                        </button>
                        <span className="w-5 text-center text-xs">{item.quantity}</span>
                        <button type="button" className="h-7 w-7" onClick={() => setQuantity(item.id, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      {items.length > 1 ? (
                        <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-white/55 underline">
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-white/70">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>Shipping</dt>
              <dd>Free</dd>
            </div>
            <div className="flex items-end justify-between pt-2">
              <dt>Total due</dt>
              <dd className="text-3xl text-white">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            form={CHECKOUT_FORM_ID}
            disabled={submitDisabled}
            className="mt-5 flex w-full items-center justify-center rounded-[10px] bg-[#dcd4bd] py-3.5 text-xs font-medium tracking-[0.08em] text-ink disabled:opacity-60"
          >
            {pending ? (nmi?.chargesEnabled ? "PROCESSING PAYMENT…" : "SUBMITTING…") : payLabel}
          </button>
        </aside>
        <aside className="rounded-[28px] bg-[#2a1212] p-6 text-[#f7f3f5]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#f37477]">What’s included</p>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            {INCLUDED_ITEMS.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="mt-0.5 text-[#f37477]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-white/80">
      {label}
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1 block text-xs text-[#ffd6d6]">{error}</span> : null}
    </label>
  );
}

function ContinueButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 flex w-full items-center justify-center rounded-[10px] bg-white/15 py-3 text-xs font-medium tracking-[0.08em]"
    >
      {children}
    </button>
  );
}

function ConsentRow({
  checked,
  title,
  onChange,
  children,
}: {
  checked: boolean;
  title: string;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-[18px] bg-white/10 p-4 text-sm ${checked ? "ring-1 ring-[#dcd4bd]" : ""}`}>
      <input type="checkbox" className="mt-1" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="block font-medium">{title} *</span>
        <span className="mt-1 block text-white/75">{children}</span>
      </span>
    </label>
  );
}

function AccordionCard({
  step,
  title,
  subtitle,
  summary,
  complete,
  open,
  keepMounted = false,
  onToggle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  summary?: string;
  complete: boolean;
  open: boolean;
  keepMounted?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/25 bg-white/14 shadow-xl backdrop-blur-md">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left md:px-6">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-sm">
          {complete && !open ? "✓" : step}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-none">{title}</span>
          <span className="mt-1 block text-sm text-white/70">{open || !summary ? subtitle : summary}</span>
        </span>
        <span aria-hidden className="text-white/60">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open || keepMounted ? (
        <div className={open ? "px-5 pb-5 md:px-6 md:pb-6" : "pointer-events-none h-0 overflow-hidden opacity-0"}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
