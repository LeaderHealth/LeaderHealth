export type LegalPage = {
  slug: string;
  title: string;
  effective?: string;
  sections: { heading: string; paragraphs: string[] }[];
};

export const legalPages: LegalPage[] = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    effective: "July 1, 2026",
    sections: [
      {
        heading: "Plain-English summary",
        paragraphs: [
          "Leader Health is a healthtech platform operated by LH Ventures LLC as the technology and administrative-services company. Clinical care is delivered by independent licensed clinicians who practice through an Independent Provider Network. The Independent Provider Network is the HIPAA Covered Entity for your medical record; Leader Health is its Business Associate. We do not sell your Protected Health Information, and we do not use your PHI for cross-context behavioral advertising. Questions: privacy@myleaderhealth.com.",
        ],
      },
      {
        heading: "Who we are",
        paragraphs: [
          "\"Leader Health,\" \"we,\" \"our,\" or \"us\" means Leader Health, the trade name of LH Ventures LLC, a Delaware limited liability company foreign-qualified in Texas, together with its affiliates. Leader Health is a technology and administrative-services company. Leader Health does not practice medicine.",
          "Clinical services are provided by independent licensed clinicians. Pharmacy services are provided by independently owned licensed pharmacies. Laboratory services are provided by independent reference laboratories.",
          "Protected Health Information created and held by the Independent Provider Network is governed by the HIPAA Notice of Privacy Practices, which controls in case of conflict with respect to PHI.",
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: [
          "Account information (name, email, password, phone, date of birth, address); intake and health-history information; identity verification documents where required; payment information processed through our payment processor (we do not store full card numbers); and communications with support or clinicians.",
          "We also collect device and connection data, usage data, and cookies as described in our tracking practices, plus lab results, pharmacy data, and clinical notes from partners involved in your care.",
        ],
      },
      {
        heading: "How we use and share information",
        paragraphs: [
          "We use personal information to administer your account, coordinate care with the Affiliated Provider Network, Pharmacies, and Labs, process payments, communicate with you, secure the platform, prevent fraud, and comply with law.",
          "We do not use AI or automated decision-making to make material clinical decisions about your care. Providers make all prescribing decisions. We do not sell personal information.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "California and other state-law rights, including access, deletion, and correction, can be exercised at privacy@myleaderhealth.com or via the Do Not Sell or Share My Info page. We are implementing support for Global Privacy Control (GPC) opt-out preference signals.",
        ],
      },
    ],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    effective: "July 1, 2026",
    sections: [
      {
        heading: "Agreement",
        paragraphs: [
          "These Terms govern your use of Leader Health websites and related services operated by LH Ventures LLC. By using the site, you agree to these Terms. If you do not agree, do not use the platform.",
        ],
      },
      {
        heading: "Not medical advice on this website",
        paragraphs: [
          "Content on this marketing site is educational and is not a diagnosis, prescription, or provider-patient relationship. Clinical care begins only after you complete intake and a licensed clinician evaluates you.",
        ],
      },
      {
        heading: "Eligibility and accounts",
        paragraphs: [
          "You must be 18 or older to create an account. You are responsible for the accuracy of information you submit and for keeping portal credentials confidential.",
        ],
      },
      {
        heading: "Compounded medications",
        paragraphs: [
          "Compounded medications are prepared by licensed pharmacies and are not FDA-approved. Leader Health is not a pharmacy and does not manufacture or dispense medications. Availability may vary by state.",
        ],
      },
    ],
  },
  {
    slug: "telehealth-consent",
    title: "Telehealth Consent",
    sections: [
      {
        heading: "Consent to telehealth",
        paragraphs: [
          "By starting care, you consent to evaluation and treatment via telehealth. You understand that telehealth has benefits and limitations, including the possibility that your clinician may determine you need in-person care.",
        ],
      },
      {
        heading: "Independent clinicians",
        paragraphs: [
          "Care is delivered by independent licensed clinicians in the state where you are located. Leader Health does not practice medicine. Your treating clinician exercises independent clinical judgment.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: [
          "Video, messages, and records are handled under the HIPAA Notice and Privacy Policy. Do not join visits from a setting where others can overhear sensitive information if you can avoid it.",
        ],
      },
    ],
  },
  {
    slug: "important-safety-information",
    title: "Important Safety Information",
    sections: [
      {
        heading: "Read before you start",
        paragraphs: [
          "Prescription treatments offered through Leader Health can cause serious side effects. Your clinician will review your history and, when required, labs before prescribing. This page is not a complete list of risks.",
        ],
      },
      {
        heading: "GLP-1 medications (semaglutide, tirzepatide)",
        paragraphs: [
          "Risk of thyroid C-cell tumors. Do not use if you or a family member has had medullary thyroid cancer, or if you have MEN 2. Compounded. Not FDA approved. Not a generic of Wegovy or Ozempic. Gastrointestinal side effects, pancreatitis, gallbladder disease, and dehydration can occur. These medications are not used in pregnancy.",
        ],
      },
      {
        heading: "Hormone therapies and peptides",
        paragraphs: [
          "Testosterone, women's hormone therapy, sermorelin, and related treatments require monitoring. Report chest pain, severe headache, shortness of breath, allergic reaction, or other urgent symptoms to emergency services. Discuss fertility goals before starting testosterone.",
        ],
      },
    ],
  },
  {
    slug: "hipaa-notice",
    title: "HIPAA Notice of Privacy Practices",
    sections: [
      {
        heading: "Covered Entity",
        paragraphs: [
          "The Independent Provider Network is the HIPAA Covered Entity for your medical record. Leader Health acts as a Business Associate under a written Business Associate Agreement.",
        ],
      },
      {
        heading: "How PHI is used",
        paragraphs: [
          "Protected Health Information is used and disclosed for treatment, payment, and health-care operations as permitted by HIPAA, and as described in the full Notice provided at registration and in your patient dashboard.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "You have rights to access, amend, and receive an accounting of certain disclosures of your PHI, and to request restrictions and confidential communications. Contact privacy@myleaderhealth.com or your dashboard support channel to exercise these rights.",
        ],
      },
    ],
  },
  {
    slug: "consumer-health-data-privacy",
    title: "Consumer Health Data Privacy",
    sections: [
      {
        heading: "Additional health-data notice",
        paragraphs: [
          "Certain states, including Washington and Nevada, require extra disclosures about consumer health data. We collect health information to coordinate care, verify identity, and operate the platform. We do not sell consumer health data.",
        ],
      },
      {
        heading: "Requests",
        paragraphs: [
          "To request access, deletion, or to appeal a decision, email privacy@myleaderhealth.com with \"Consumer Health Data\" in the subject line.",
        ],
      },
    ],
  },
  {
    slug: "do-not-sell",
    title: "Do Not Sell or Share My Info",
    sections: [
      {
        heading: "We do not sell your information",
        paragraphs: [
          "Leader Health does not sell personal information and does not share it for cross-context behavioral advertising. If you still wish to record an opt-out preference, email privacy@myleaderhealth.com or use a Global Privacy Control signal when available.",
        ],
      },
    ],
  },
  {
    slug: "refunds-cancellations",
    title: "Refunds & Cancellations",
    sections: [
      {
        heading: "Cancellations",
        paragraphs: [
          "You may cancel a subscription according to the timing in the Subscription Terms. Cancel before the next billing date to avoid the following cycle's charge. Portal cancellation or written request to help@myleaderhealth.com is required.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Because compounded medications are prepared for you, opened or shipped prescriptions are generally not returnable. If a shipment is lost, damaged, or filled in error, contact support so we can coordinate with the pharmacy. Lab panels that have already been drawn are not refundable.",
        ],
      },
    ],
  },
  {
    slug: "subscription-terms",
    title: "Subscription Terms",
    sections: [
      {
        heading: "Billing",
        paragraphs: [
          "Many protocols are billed monthly until canceled. Prices shown are starting prices and may change with dose, format, or clinically required labs. You authorize recurring charges to the payment method on file.",
        ],
      },
      {
        heading: "Clinical gate",
        paragraphs: [
          "Payment does not guarantee a prescription. A licensed clinician must determine that treatment is appropriate. If you are not a candidate, you will be told and charged only for services already performed (such as labs).",
        ],
      },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    sections: [
      {
        heading: "How shipping works",
        paragraphs: [
          "After a clinician approves a prescription, a licensed pharmacy ships medication to the address on file. Temperature-sensitive products may use expedited or cold-chain shipping. Delivery windows vary by pharmacy and destination.",
        ],
      },
      {
        heading: "Your responsibilities",
        paragraphs: [
          "Keep your address and phone number current. Someone should be available to receive packages that require a signature or refrigeration. Report damaged or missing packages promptly to help@myleaderhealth.com.",
        ],
      },
    ],
  },
  {
    slug: "state-restrictions",
    title: "State Restrictions",
    sections: [
      {
        heading: "Availability varies",
        paragraphs: [
          "Not every therapy is available in every state. Controlled substances, compounding rules, and clinician licensure limit what can be prescribed or shipped to your location. Your intake will show options available where you are.",
        ],
      },
      {
        heading: "Questions",
        paragraphs: [
          "If you are unsure whether a treatment can be offered in your state, contact help@myleaderhealth.com before completing labs.",
        ],
      },
    ],
  },
  {
    slug: "consent-notices",
    title: "Consent & Notices",
    sections: [
      {
        heading: "What this page covers",
        paragraphs: [
          "Telehealth, compounding, and privacy notices that apply when you start care through Leader Health. Clinical care is delivered by independent licensed clinicians. Leader Health provides the technology platform and administrative services.",
        ],
      },
      {
        heading: "Telehealth",
        paragraphs: [
          "By starting intake you consent to evaluation via telehealth. Your clinician may determine you need in-person care. The clinician and practice responsible for your care are identified in your visit record and patient portal.",
        ],
      },
      {
        heading: "Compounded medications",
        paragraphs: [
          "Whether a medicine is FDA approved or compounded is stated on that medicine's own page. Compounded medications are prepared by licensed U.S. pharmacies on a prescriber's order and are not FDA-approved. Leader Health is not a pharmacy and does not compound, manufacture, or dispense medications.",
        ],
      },
      {
        heading: "Related notices",
        paragraphs: [
          "See also Telehealth Consent, Important Safety Information, HIPAA Notice, and the Privacy Policy. For a medical emergency, call 911. This site does not provide medical advice and is not a substitute for care from your own clinician.",
        ],
      },
    ],
  },
  {
    slug: "orders-billings",
    title: "Orders & Billings",
    sections: [
      {
        heading: "How ordering works",
        paragraphs: [
          "Treatment plans are written by licensed U.S. clinicians after review of your intake and lab work. No plan is issued without a provider consultation. Payment does not guarantee a prescription.",
        ],
      },
      {
        heading: "Billing",
        paragraphs: [
          "Many protocols are billed monthly until canceled. Starting prices on product pages may change with dose, format, or required labs. You authorize recurring charges to the payment method on file. HSA and FSA cards can typically be used for eligible services.",
        ],
      },
      {
        heading: "Cancellations and shipments",
        paragraphs: [
          "Cancel before the next billing date to avoid the following cycle's charge via the patient portal or help@myleaderhealth.com. Opened or patient-specific compounded shipments are generally not returnable. Lost, damaged, or incorrect fills should be reported so we can coordinate with the pharmacy.",
        ],
      },
    ],
  },
];

export function getLegal(slug: string) {
  return legalPages.find((p) => p.slug === slug);
}
