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
  | { kind: "list"; items: string[]; runs?: (LegalRun[] | null)[]; ordered?: boolean }
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
    effective: "August 30, 2026",
    intro: [
      {
        kind: "p",
        text: "This page is a general safety summary. It is not a substitute for the full prescribing information, the advice of your Provider, or the counseling you receive from the pharmacy. Read the medication guide that accompanies your prescription. Telehealth is not for emergencies — if you think you are having a medical emergency, call 911 or go to the nearest emergency room.",
      },
    ],
    sections: [
      {
        heading: "Not for emergencies",
        paragraphs: [
          "Leader Health is for non-urgent care. Do not use the Platform for emergencies, severe symptoms, thoughts of self-harm, chest pain, difficulty breathing, signs of stroke, severe allergic reaction, or any life-threatening condition. Call 911.",
        ],
      },
      {
        heading: "Who should not use certain therapies",
        paragraphs: [
          "Some therapies are not appropriate for everyone. Depending on the therapy, you should not start — and must tell your Provider — if you are pregnant, planning pregnancy, or breastfeeding; if you have a personal or family history of certain cancers (including, for some therapies, medullary thyroid carcinoma or Multiple Endocrine Neoplasia syndrome type 2); if you have significant heart, liver, kidney, or psychiatric disease; a history of pancreatitis or gallbladder disease; an eating disorder; or if you take medications that may interact. Your Provider determines whether a therapy is medically appropriate for you based on your history and labs.",
        ],
      },
      {
        heading: "Compounded medications",
        paragraphs: [
          "Some products offered through the Platform are compounded medications prepared by a licensed compounding pharmacy for an individual patient. Compounded drugs are not FDA-approved, and the FDA does not review them for safety, effectiveness, or quality before they are marketed. Compounded medications are permitted for specific patient needs when clinically appropriate. Your Provider and pharmacist will discuss whether a compounded option is appropriate for you.",
        ],
        blocks: [
          {
            kind: "p",
            text: "Some products offered through the Platform are compounded medications prepared by a licensed compounding pharmacy for an individual patient. Compounded drugs are not FDA-approved, and the FDA does not review them for safety, effectiveness, or quality before they are marketed. Compounded medications are permitted for specific patient needs when clinically appropriate. Your Provider and pharmacist will discuss whether a compounded option is appropriate for you.",
            runs: [
              { text: "Some products offered through the Platform are compounded medications prepared by a licensed compounding pharmacy for an individual patient. " },
              { text: "Compounded drugs are not FDA-approved", bold: true },
              { text: ", and the FDA does not review them for safety, effectiveness, or quality before they are marketed. Compounded medications are permitted for specific patient needs when clinically appropriate. Your Provider and pharmacist will discuss whether a compounded option is appropriate for you." },
            ],
          },
        ],
      },
      {
        heading: "Category-specific safety",
        paragraphs: [
          "The therapies below carry distinct risks. This is a summary only; your Provider will review the risks that apply to you.",
          "GLP-1 / weight-management therapies (e.g., semaglutide, tirzepatide). Common side effects include nausea, vomiting, diarrhea, constipation, and abdominal pain. Serious risks may include pancreatitis, gallbladder disease, kidney injury from dehydration, low blood sugar (especially with insulin or sulfonylureas), and, in animal studies, thyroid C-cell tumors — do not use if you or a family member has had medullary thyroid carcinoma or MEN 2. Seek care for severe or persistent abdominal pain, signs of an allergic reaction, or a neck mass.",
          "Hormone therapies (including testosterone / TRT and other hormone therapies). Risks may include changes in blood counts (elevated hematocrit), blood clots, cardiovascular effects, mood changes, acne, fluid retention, effects on fertility, and — for some hormone therapies — effects on the prostate or breast tissue. Ongoing lab monitoring is required. Testosterone is a controlled substance and is subject to the additional rules below.",
          "Sexual-health medications. Risks may include headache, flushing, low blood pressure, vision or hearing changes, and priapism (a prolonged, painful erection lasting more than 4 hours — seek emergency care). Do not combine with nitrates. Tell your Provider about heart disease and all medications.",
          "Peptides and other therapies. Evidence and regulatory status vary by product; some are not FDA-approved. Risks may include injection-site reactions, changes in blood sugar, water retention, and other effects your Provider will review. Do not use any therapy for performance-enhancement or in a manner inconsistent with your Provider's instructions.",
        ],
        blocks: [
          {
            kind: "p",
            text: "The therapies below carry distinct risks. This is a summary only; your Provider will review the risks that apply to you.",
          },
          {
            kind: "p",
            text: "GLP-1 / weight-management therapies (e.g., semaglutide, tirzepatide). Common side effects include nausea, vomiting, diarrhea, constipation, and abdominal pain. Serious risks may include pancreatitis, gallbladder disease, kidney injury from dehydration, low blood sugar (especially with insulin or sulfonylureas), and, in animal studies, thyroid C-cell tumors — do not use if you or a family member has had medullary thyroid carcinoma or MEN 2. Seek care for severe or persistent abdominal pain, signs of an allergic reaction, or a neck mass.",
            runs: [
              { text: "GLP-1 / weight-management therapies (e.g., semaglutide, tirzepatide).", bold: true },
              { text: " Common side effects include nausea, vomiting, diarrhea, constipation, and abdominal pain. Serious risks may include pancreatitis, gallbladder disease, kidney injury from dehydration, low blood sugar (especially with insulin or sulfonylureas), and, in animal studies, thyroid C-cell tumors — do not use if you or a family member has had medullary thyroid carcinoma or MEN 2. Seek care for severe or persistent abdominal pain, signs of an allergic reaction, or a neck mass." },
            ],
          },
          {
            kind: "p",
            text: "Hormone therapies (including testosterone / TRT and other hormone therapies). Risks may include changes in blood counts (elevated hematocrit), blood clots, cardiovascular effects, mood changes, acne, fluid retention, effects on fertility, and — for some hormone therapies — effects on the prostate or breast tissue. Ongoing lab monitoring is required. Testosterone is a controlled substance and is subject to the additional rules below.",
            runs: [
              { text: "Hormone therapies (including testosterone / TRT and other hormone therapies).", bold: true },
              { text: " Risks may include changes in blood counts (elevated hematocrit), blood clots, cardiovascular effects, mood changes, acne, fluid retention, effects on fertility, and — for some hormone therapies — effects on the prostate or breast tissue. Ongoing lab monitoring is required. Testosterone is a controlled substance and is subject to the additional rules below." },
            ],
          },
          {
            kind: "p",
            text: "Sexual-health medications. Risks may include headache, flushing, low blood pressure, vision or hearing changes, and priapism (a prolonged, painful erection lasting more than 4 hours — seek emergency care). Do not combine with nitrates. Tell your Provider about heart disease and all medications.",
            runs: [
              { text: "Sexual-health medications.", bold: true },
              { text: " Risks may include headache, flushing, low blood pressure, vision or hearing changes, and priapism (a prolonged, painful erection lasting more than 4 hours — seek emergency care). Do not combine with nitrates. Tell your Provider about heart disease and all medications." },
            ],
          },
          {
            kind: "p",
            text: "Peptides and other therapies. Evidence and regulatory status vary by product; some are not FDA-approved. Risks may include injection-site reactions, changes in blood sugar, water retention, and other effects your Provider will review. Do not use any therapy for performance-enhancement or in a manner inconsistent with your Provider's instructions.",
            runs: [
              { text: "Peptides and other therapies.", bold: true },
              { text: " Evidence and regulatory status vary by product; some are not FDA-approved. Risks may include injection-site reactions, changes in blood sugar, water retention, and other effects your Provider will review. Do not use any therapy for performance-enhancement or in a manner inconsistent with your Provider's instructions." },
            ],
          },
        ],
      },
      {
        heading: "Controlled substances",
        paragraphs: [
          "Certain medications are controlled substances. They are prescribed only when clinically appropriate, are subject to state and federal telemedicine-prescribing rules, and may require identity verification and additional monitoring. Do not share, sell, transfer, or divert any prescribed medication. Misuse can cause serious harm and is unlawful.",
        ],
        blocks: [
          {
            kind: "p",
            text: "Certain medications are controlled substances. They are prescribed only when clinically appropriate, are subject to state and federal telemedicine-prescribing rules, and may require identity verification and additional monitoring. Do not share, sell, transfer, or divert any prescribed medication. Misuse can cause serious harm and is unlawful.",
            runs: [
              { text: "Certain medications are controlled substances. They are prescribed only when clinically appropriate, are subject to state and federal telemedicine-prescribing rules, and may require identity verification and additional monitoring. " },
              { text: "Do not share, sell, transfer, or divert", bold: true },
              { text: " any prescribed medication. Misuse can cause serious harm and is unlawful." },
            ],
          },
        ],
      },
      {
        heading: "Drug and condition interactions",
        paragraphs: [
          "Tell your Provider about all prescription and over-the-counter medications, supplements, and herbal products you take, and about all of your medical conditions and allergies. Do not start, stop, or change how you take any medication without talking to your Provider.",
        ],
      },
      {
        heading: "Side effects and when to seek care",
        paragraphs: [
          "Any medication can cause side effects, including serious or, rarely, life-threatening reactions. Stop the medication and seek emergency care for signs of a severe allergic reaction (swelling of the face, lips, tongue, or throat; trouble breathing; hives), severe or persistent abdominal pain, fainting, chest pain, or any symptom that feels severe or rapidly worsening. Report side effects to your care team through the Platform. You may also report side effects of an FDA-regulated product to the FDA at 1-800-FDA-1088 or www.fda.gov/medwatch.",
        ],
        blocks: [
          {
            kind: "p",
            text: "Any medication can cause side effects, including serious or, rarely, life-threatening reactions. Stop the medication and seek emergency care for signs of a severe allergic reaction (swelling of the face, lips, tongue, or throat; trouble breathing; hives), severe or persistent abdominal pain, fainting, chest pain, or any symptom that feels severe or rapidly worsening. Report side effects to your care team through the Platform. You may also report side effects of an FDA-regulated product to the FDA at 1-800-FDA-1088 or www.fda.gov/medwatch.",
            runs: [
              { text: "Any medication can cause side effects, including serious or, rarely, life-threatening reactions. Stop the medication and seek emergency care for signs of a severe allergic reaction (swelling of the face, lips, tongue, or throat; trouble breathing; hives), severe or persistent abdominal pain, fainting, chest pain, or any symptom that feels severe or rapidly worsening. Report side effects to your care team through the Platform. You may also report side effects of an FDA-regulated product to the " },
              { text: "FDA at 1-800-FDA-1088", bold: true },
              { text: " or " },
              { text: "www.fda.gov/medwatch", href: "https://www.fda.gov/medwatch" },
              { text: "." },
            ],
          },
        ],
      },
      {
        heading: "No guarantee of results",
        paragraphs: [
          "Individual results vary. No specific outcome is promised. Therapy works best alongside appropriate diet, activity, monitoring, and follow-up as directed by your Provider.",
        ],
      },
      {
        heading: "Storage and handling",
        paragraphs: [
          "Store medications as directed on the label and by the pharmacy (some require refrigeration). Keep all medications out of the reach of children and pets. Do not use a medication after its expiration date. Dispose of unused medication safely.",
        ],
      },
      {
        heading: "Questions",
        paragraphs: [
          "Contact your care team at care@myleaderhealth.com. For questions about a specific prescription, your pharmacy's counseling line is the best resource.",
        ],
        blocks: [
          {
            kind: "p",
            text: "Contact your care team at care@myleaderhealth.com. For questions about a specific prescription, your pharmacy's counseling line is the best resource.",
            runs: [
              { text: "Contact your care team at " },
              { text: "care@myleaderhealth.com", href: "mailto:care@myleaderhealth.com" },
              { text: ". For questions about a specific prescription, your pharmacy's counseling line is the best resource." },
            ],
          },
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
