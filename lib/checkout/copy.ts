export const CHECKOUT_STEPS = [
  { id: "details", title: "Your details", subtitle: "Name, email, phone, and date of birth" },
  { id: "screening", title: "Screening & consent", subtitle: "Eligibility and required agreements" },
  { id: "shipping", title: "Shipping", subtitle: "Where we send your order" },
  { id: "payment", title: "Payment", subtitle: "Card details — billed to your shipping address" },
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number]["id"];

export const MEDICAL_CONDITIONS = [
  "History of prostate cancer or elevated PSA",
  "Polycythemia (high red blood cell count)",
  "Untreated severe sleep apnea",
  "Uncontrolled heart failure",
  "Male breast cancer",
  "Desire for fertility in the near future",
  "Severe liver or kidney disease",
  "Known hypersensitivity to testosterone",
];

export const HRT_BLOCKED_STATES = ["SC"];

export const INCLUDED_ITEMS = [
  "Free telehealth consult with a licensed U.S. physician",
  "Prescription review & ongoing clinical monitoring",
  "Discreet delivery from a licensed compounding pharmacy",
  "Patient portal access for refills and messaging",
];

export const TRUST_POINTS = ["HSA / FSA accepted", "Licensed pharmacy partners", "Ships in discreet packaging"];

export const CONSENTS = [
  {
    key: "terms",
    title: "Terms & Conditions",
    href: "/legal/terms-of-service",
    linkLabel: "Terms & Conditions",
    prefix: "I have read and agree to the",
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    href: "/legal/privacy-policy",
    linkLabel: "Privacy Policy",
    prefix: "I have read and agree to the",
  },
  {
    key: "telehealth",
    title: "Telehealth consent",
    href: "/legal/telehealth-consent",
    linkLabel: "Telehealth Consent Form",
    prefix: "I consent to receive telehealth services and have read the",
  },
  {
    key: "hipaa",
    title: "HIPAA notice",
    href: "/legal/hipaa-notice",
    linkLabel: "HIPAA Notice of Privacy Practices",
    prefix: "I acknowledge receipt of the",
  },
] as const;

export const SUPPORT_EMAIL = "help@myleaderhealth.com";
