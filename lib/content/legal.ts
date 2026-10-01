import { privacyPolicy } from "@/lib/content/privacy-policy";
import { cookiesPolicy } from "@/lib/content/cookies-policy";
import { consumerHealthDataPrivacy } from "@/lib/content/consumer-health-data-privacy";
import {
  doNotSell,
  hipaaNotice,
  refundsCancellations,
  shippingPolicy,
  stateRestrictions,
  subscriptionTerms,
  telehealthConsent,
  termsOfService,
  compoundingDisclosure,
  accessibilityStatement,
} from "@/lib/content/published-legal";

export type LegalRun = {
  text: string;
  bold?: boolean;
  href?: string;
};

export type LegalBlock =
  | { kind: "p"; text: string; runs?: LegalRun[] }
  | { kind: "h3"; text: string; runs?: LegalRun[] }
  | { kind: "list"; items: string[]; runs?: (LegalRun[] | null)[] }
  | { kind: "table"; headers: string[]; rows: string[][]; cellRuns?: (LegalRun[] | null)[][] };

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  blocks?: LegalBlock[];
};

export type LegalPage = {
  slug: string;
  title: string;
  effective?: string;
  intro?: LegalBlock[];
  sections: LegalSection[];
};

export const legalPages: LegalPage[] = [
  privacyPolicy,
  cookiesPolicy,
  consumerHealthDataPrivacy,
  termsOfService,
  telehealthConsent,
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
  hipaaNotice,
  doNotSell,
  refundsCancellations,
  subscriptionTerms,
  shippingPolicy,
  stateRestrictions,
  compoundingDisclosure,
  accessibilityStatement,
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
