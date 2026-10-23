export type Category = "hormone" | "sexual" | "longevity" | "weight-loss";
export type Audience = "men" | "women" | "all";

export type Product = {
  slug: string;
  name: string;
  category: Category;
  audience: Audience;
  price: string;
  labRequired?: boolean;
  listed?: boolean;
  image: string;
  tagline: string;
  description: string;
  eyebrow?: string;
  badge?: string;
  paragraphs?: string[];
  highlight?: string;
  safety?: string;
  disclaimer?: string;
  compare?: boolean;
  seoTitle?: string;
  faqs?: { q: string; a: string }[];
  benefits: { title: string; body: string }[];
  clientProductId?: string;
  threeMonthProductId?: string;
  variants?: {
    name: string;
    eyebrow?: string;
    detail: string;
    price: string;
    priceAmount?: string;
    notes: string[];
    image?: string;
    clientProductId?: string;
    threeMonthProductId?: string;
    listed?: boolean;
  }[];
};

export const products: Product[] = [
  {
    slug: "weight-loss-semaglutide",
    name: "Semaglutide",
    seoTitle: "Compounded Semaglutide Weight Loss",
    category: "weight-loss",
    audience: "all",
    price: "Starting From $129/mo",
    image: "/images/products/semaglutide.png",
    tagline: "Provider-guided GLP-1 support for sustainable weight management.",
    eyebrow: "Weight Loss",
    badge: "Medication",
    compare: true,
    highlight: "Three-month start, cancel anytime.",
    safety:
      "*Risk of thyroid C cell tumors. Do not use if you or a family member has had medullary thyroid cancer, or if you have MEN 2. Compounded. Not FDA approved. Not a generic of Wegovy or Ozempic.",
    description:
      "Ready to take weight management seriously? Semaglutide is a GLP-1 medication that works alongside healthy eating and activity. You start with labs and a review of your history before any prescription. Your provider sets your dose, guides your titration, and tracks your progress along the way.",
    benefits: [
      { title: "Drives Weight Loss", body: "Supports healthy, sustainable weight management." },
      { title: "Reduces Appetite", body: "GLP-1 action helps you feel full longer and eat less." },
      { title: "Supports Blood Sugar", body: "Helps stabilize glucose for better metabolic health." },
    ],
    variants: [
      {
        name: "Semaglutide Injectable",
        eyebrow: "Weekly injection",
        clientProductId: "prod_48ed6c335e9719fef64960ca",
        detail: "Titrated dosing, adjusted as you progress.",
        price: "From $159 / month",
        priceAmount: "$159",
        notes: ["4 doses / month", "Supplies included"],
        image:
          "https://framerusercontent.com/images/qjehMU3idCiDUkHLomxHWBSbnkk.png?width=626&height=888",
      },
      {
        name: "Semaglutide Sublingual",
        eyebrow: "Daily sublingual",
        clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_ed9cf69ee67ee9d531a8168e",
        detail: "Needle-free troche that dissolves under the tongue.",
        price: "From $129 / month",
        priceAmount: "$129",
        notes: ["30 troches / month", "No needles"],
        image:
          "https://framerusercontent.com/images/a35lvlEcdBD3i8gaqZ0pHpHg.png?width=1060&height=1002",
      },
    ],
  },
  {
    slug: "weight-loss-tirzepatide",
    name: "Tirzepatide",
    seoTitle: "Tirzepatide Weight Loss Program Online",
    category: "weight-loss",
    audience: "all",
    price: "Starting at $229",
    image: "/images/products/tirzepatide.png",
    tagline: "Dual-agonist support for appetite, metabolism, and body composition.",
    eyebrow: "Weight Loss",
    badge: "Medication",
    compare: true,
    safety:
      "*Risk of thyroid C cell tumors. Do not use if you or a family member has had medullary thyroid cancer, or if you have MEN 2. Compounded. Not FDA approved. Not a generic of Mounjaro or Zepbound.",
    description:
      "Tirzepatide works on two appetite pathways, paired with healthy eating and activity for weight management. Before any prescription, your team reviews your labs, weight history, medications, and health background. Your provider sets your dose, guides titration, and checks in as you go. A clinician-led plan around your goals and needs.",
    benefits: [
      { title: "Improves Metabolic Health", body: "Targets hunger hormones GLP-1 and GIP to significantly reduce appetite and promote sustained fat loss." },
      { title: "Reduces Body Weight", body: "Helps regulate blood sugar levels and supports healthier insulin response over time." },
      { title: "Curbs Cravings", body: "Slows gastric emptying so you feel fuller longer and eat less without feeling deprived." },
    ],
    variants: [
      {
        name: "Tirzepatide Injectable",
        eyebrow: "Weekly injection",
        clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_8991a4069a861f874caedde1",
        detail: "Titrated dosing, adjusted as you progress.",
        price: "From $249 / month",
        priceAmount: "$249",
        notes: ["4 doses / month", "Supplies included"],
        image:
          "https://framerusercontent.com/images/nRou5ezUCB89as5C3yZkRliVl0.png?width=769&height=979",
      },
      {
        name: "Tirzepatide Sublingual",
        eyebrow: "Daily sublingual",
        clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_80847dd1802c8e722b24959e",
        detail: "Needle-free troche that dissolves under the tongue.",
        price: "From $229 / month",
        priceAmount: "$229",
        notes: ["30 troches / month", "No needles"],
        image:
          "https://framerusercontent.com/images/BqEQwOsB8kfY0RMAijwLoWRAWg.png?width=963&height=651",
      },
    ],
  },
  {
    slug: "longevity-sermorelin",
    name: "Sermorelin",
    category: "longevity",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_901e56cf05c4aa2bf0d0109d",
    threeMonthProductId: "prod_901e56cf05c4aa2bf0d0109d_1",
    audience: "all",
    price: "Starting From $149/mo",
    labRequired: true,
    image: "/images/products/sermorelin.png",
    tagline: "Peptide support for recovery, body composition, and overnight repair.",
    highlight: "$149/month, three-month start, then cancel anytime.",
    safety:
      "*Do not use if you have active cancer, or if you are pregnant or breastfeeding. Compounded. Not FDA approved. No FDA approved sermorelin product is on the market.",
    description:
      "Sermorelin is a nightly injectable that works with your body's own growth hormone system. Rather than replacing growth hormone the way HGH does, it gently prompts your pituitary gland to release more of your own — a different approach by design. Your provider tracks your IGF-1 levels and checks in on how you're responding over time. It's offered as a provider-guided wellness trial focused on better sleep, recovery, and how you feel day to day.",
    benefits: [
      { title: "Monitored with labs", body: "Sermorelin is designed to stimulate the body's own GH/IGF-1 axis, but symptom outcomes in healthy adults remain uncertain." },
      { title: "Mechanism-led trial", body: "Your provider may track IGF-1 and safety markers to avoid overexposure and reassess whether continuing makes sense." },
      { title: "Supports GH signaling", body: "Sermorelin is designed to encourage pulsatile growth hormone release rather than replace growth hormone directly." },
    ],
  },
  {
    slug: "longevity-glutathione",
    name: "Glutathione",
    category: "longevity",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_keU1sjz2zEQ918IBpBEF",
    threeMonthProductId: "keU1sjz2zEQ918IBpBEF_1",
    audience: "all",
    price: "Starting at $129/Month",
    image: "/images/products/glutathione.png",
    tagline: "Antioxidant support delivered in a format that can actually be absorbed.",
    highlight: "Starting at $129/Month",
    description:
      "Glutathione is a powerful antioxidant that helps protect cells from oxidative stress while supporting cellular health and detoxification processes. It also plays a key role in helping the body manage free radicals and maintain healthy cell function. Glutathione therapy is designed to support antioxidant levels as part of a broader approach to wellness and longevity. Your provider reviews your health history, goals, and treatment needs to determine if glutathione is a good fit for you.",
    benefits: [
      { title: "Antioxidant support", body: "Helps support the body’s natural defenses against oxidative stress." },
      { title: "Cellular health", body: "Supports healthy cellular function and the body’s natural repair processes." },
      { title: "Detoxification support", body: "Supports the liver and the body’s natural pathways for processing and eliminating compounds." },
    ],
  },
  {
    slug: "longevity-nad",
    name: "NAD+",
    category: "longevity",
    audience: "all",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_3d638894ad732191af0214fa",
    threeMonthProductId: "prod_3d638894ad732191af0214fa_2",
    price: "Starting at $149/month",
    image: "/images/products/nad-compounded.png?v=4",
    tagline: "Injectable NAD+ for cellular energy support under clinician direction.",
    highlight: "$149/month, three-month start, then cancel anytime.",
    description:
      "NAD+ is an injectable coenzyme your cells rely on for energy production and DNA repair. Levels naturally dip as we age, and many patients report feeling more energized and focused. Your provider guides you through gradual dose adjustments to keep you comfortable and minimize flushing, so you build up tolerance at the right pace. It's offered as a wellness trial with easy at-home subcutaneous dosing.",
    benefits: [
      { title: "Evidence still emerging", body: "NAD+ is involved in mitochondrial energy metabolism and related cellular pathways." },
      { title: "Restores Cellular Energy", body: "Results vary, clinical evidence in healthy adults is still emerging." },
      { title: "At-home route", body: "Subcutaneous dosing removes the need for clinic-based infusions when prescribed." },
    ],
  },
  {
    slug: "men-trt-testosterone-cypionate",
    name: "Testosterone Cypionate",
    category: "hormone",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_9e90b3a402901fa3eaa65d7b",
    audience: "men",
    price: "Starting at $109/month",
    labRequired: true,
    image: "/images/products/testosterone-cypionate.png",
    tagline: "Clinician-led TRT after labs, history, and a real plan for follow-up.",
    highlight: "Medication and provider access for $109/month. Three-month start, then cancel anytime.",
    safety:
      "*Do not use if you have breast cancer or known or suspected prostate cancer, or if you are pregnant. FDA approved medication. Schedule III controlled substance; federal law limits refills to five within six months.",
    description:
      "Feeling the effects of low testosterone? This injectable option is for men whose symptoms and lab results point to therapy. You start with a 64-marker panel and a clearance visit, then your clinician personalizes your dose and monitoring.",
    benefits: [
      { title: "May support libido", body: "Testosterone may improve libido; results vary." },
      { title: "Supports monitored levels", body: "Safety labs ensure proper treatment levels." },
      { title: "May support lean mass", body: "Normalizing low testosterone supports lean mass." },
    ],
  },
  {
    slug: "men-trt-enclomiphene",
    name: "Enclomiphene",
    category: "hormone",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_e3bf281c42eef9b1907037e2",
    audience: "men",
    price: "Starting at $109/month",
    labRequired: true,
    image: "/images/products/enclomiphene.png",
    tagline: "A fertility-minded option for men who need testosterone support.",
    highlight: "$109/month, three-month start, then cancel anytime.",
    description:
      "Want to support your own testosterone instead of replacing it? This daily pill may help your body make more naturally, and can fit if you'd rather avoid injections or keep fertility in mind. You start with labs and a clearance visit, then your clinician tracks your progress.",
    benefits: [
      { title: "Supports natural production", body: "Stimulates natural testosterone production via pituitary." },
      { title: "May preserve fertility", body: "Preserves fertility; doesn't replace testosterone directly." },
      { title: "Oral, no injections", body: "Daily pill offers lower-friction injection alternative." },
    ],
  },
  {
    slug: "men-trt-testosterone-cream",
    name: "Testosterone Cream",
    category: "hormone",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_t4oaNGfHRRklQGOdBzKO",
    audience: "men",
    price: "Starting at $119/month",
    labRequired: true,
    image: "/images/products/testosterone-cream-men.png",
    tagline: "Transdermal testosterone when a cream fits your routine better than injections.",
    description:
      "Compounded testosterone cream is one delivery option after labs and a clinician visit. Transfer precautions and follow-up labs still apply.",
    benefits: [
      { title: "Daily application", body: "Fits men who prefer not to inject." },
      { title: "Individualized strength", body: "Compounded to the dose your provider selects." },
      { title: "Monitoring", body: "Levels are rechecked so the dose stays appropriate." },
    ],
  },
  {
    slug: "women-hormone-therapy",
    name: "Women's Hormone Therapy",
    category: "hormone",
    audience: "women",
    price: "Starting at $69/month",
    labRequired: true,
    seoTitle: "Hormone Therapy for Women (HRT) Online",
    image: "/images/products/womens-hormone-therapy.png",
    tagline: "Perimenopause and menopause care with more than one delivery option.",
    highlight: "Starting at just $69/Month.",
    description:
      "Women's Hormone Therapy is a clinician-led program for perimenopause and menopause symptoms. After a 64-marker lab panel and clearance visit, your provider may recommend estradiol, progesterone, testosterone, or other options. Treatment is personalized based on your symptoms, age, health history, and individual risk factors. Ongoing monitoring ensures safe and effective care.",
    benefits: [
      { title: "Lab-guided HRT", body: "Your provider uses labs, history, and symptoms to choose the safest appropriate hormone plan." },
      { title: "May support comfort", body: "A monitored regimen may support temperature comfort, sleep, mood, libido, or vaginal comfort depending on the prescription." },
      { title: "Ongoing monitoring", body: "Follow-up labs and visits help your provider adjust the plan as your biomarkers and symptoms change." },
    ],
  },
  {
    slug: "men-sexual-health-tadalafil",
    name: "Tadalafil",
    seoTitle: "Tadalafil for Erectile Dysfunction Online",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_09762d5a6da3bd6912cc6be3",
    threeMonthProductId: "prod_09762d5a6da3bd6912cc6be3_1",
    category: "sexual",
    audience: "men",
    price: "$79/mo",
    image: "/images/products/tadalafil.png",
    tagline: "Daily or as-needed tadalafil after a clinician screens for safety.",
    eyebrow: "Sexual Health",
    compare: true,
    disclaimer:
      "FDA approved medication. Dispensed as a commercially manufactured, FDA approved product by a licensed U.S. pharmacy. Not compounded.",
    highlight: "$79/month, three-month start, then cancel anytime.",
    safety:
      "*Do not use with any nitrate medicine, including nitroglycerin and poppers. FDA approved medication, dispensed by a licensed U.S. pharmacy.",
    description:
      "Want spontaneity back? Daily low-dose tadalafil is an oral tablet that supports erectile function in eligible men. Because you take a low dose every day, there's no timing a pill before the moment — you're simply ready. Your provider reviews your heart health, blood pressure, and current medications before prescribing to make sure it's a safe fit. One important note: tadalafil can't be combined with nitrate medications, as the combination can cause a dangerous drop in blood pressure.",
    benefits: [
      { title: "Built for spontaneity", body: "Daily tadalafil may help support erectile response when sexual activity occurs." },
      { title: "Supports erections", body: "A steady daily dose can reduce the need to time an on-demand pill." },
      { title: "Clinical safety review", body: "Your provider reviews cardiovascular history and medication interactions before prescribing." },
    ],
  },
  {
    slug: "sexual-health-pt-141-nasal",
    name: "PT-141 nasal",
    category: "sexual",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_4b6c9e4f2344d501bb305b5e",
    audience: "all",
    price: "Starting at $189/month",
    image: "/images/products/pt-141-nasal.png",
    tagline: "A CNS peptide used for desire — for men and women — when clinically appropriate.",
    description:
      "PT-141 is a compounded nasal spray that takes a different route than oral ED meds. Rather than working on blood flow, bremelanotide acts on your brain's arousal pathways — supporting desire itself. You use it on demand, before the moment. Your provider screens your cardiovascular health and blood pressure first, since it can affect blood pressure.",
    highlight: "$189/month, three-month start, then cancel anytime.",
    safety:
      "*Do not use if you have uncontrolled high blood pressure or heart disease, or if you are or may be pregnant. Compounded. Not FDA approved. No bremelanotide nasal spray is FDA approved.",
    benefits: [
      {
        title: "Route-specific review",
        body: "PT-141 is designed to act centrally on pathways linked to sexual desire and arousal.",
      },
      {
        title: "Supports desire",
        body: "Provider evaluates if nasal route is suitable based on differing evidence.",
      },
      {
        title: "Safety-screened",
        body: "Cardiovascular and medication safety screened pre-prescription.",
      },
    ],
  },
  {
    slug: "men-sexual-health-trimix-injectable",
    name: "Trimix Injectable",
    category: "sexual",
    audience: "men",
    price: "Starting at $169/month",
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
    tagline: "Injectable support when oral medications are not enough.",
    description:
      "Trimix is a compounded injectable used when a clinician determines oral options are not a fit. Teaching, dosing, and safety counseling are part of the protocol.",
    benefits: [
      { title: "When orals fail", body: "A next-step option under clinician direction." },
      { title: "Compounded", body: "Prepared by a licensed U.S. pharmacy on order." },
      { title: "Instruction included", body: "Use, storage, and when to seek care are covered." },
    ],
  },
  {
    slug: "men-sexual-health-combo-troches",
    name: "Combo Troches",
    category: "sexual",
    audience: "men",
    listed: false,
    price: "Starting at $89/month",
    image: "/images/products/combo-troches.png",
    tagline: "Combination troches when a clinician wants more than a single agent.",
    highlight: "Starting at $89/month.",
    description:
      "Personalized support for performance, arousal, and intimacy. Our custom-compounded combo troches are designed to support men's sexual wellness with provider-guided treatment tailored to your needs. For most men seeking physical performance support, we recommend our Arousal Troche, which combines sildenafil, oxytocin, and B12 for on-demand support. If reduced desire or libido is also part of the picture, your licensed provider may recommend our more comprehensive Intimacy Blend instead.",
    benefits: [
      { title: "Discreet, on-demand", body: "Prescribed only after your provider determines the right combination for you." },
      { title: "Multi-pathway review", body: "A sublingual troche is taken before activity without an injection or nasal spray." },
      { title: "Provider-tailored", body: "Formulated to your exact needs by your clinician." },
    ],
  },
  {
    slug: "women-sexual-health-combo-troches",
    name: "Combo Troches",
    category: "sexual",
    audience: "women",
    listed: false,
    price: "Starting at $229/month",
    image: "/images/products/combo-troches.png",
    tagline: "Intimacy blends prescribed after a clinician evaluates desire, hormones, and safety.",
    highlight: "Starting at $89/month. Recommended Intimacy Blend: $229/month.",
    description:
      "Personalized support for desire, arousal, and intimacy. Our custom-compounded combo troches are designed to support women's sexual wellness with provider-guided treatment tailored to your needs. For most women, we recommend our Intimacy Blend, which combines PT-141, tadalafil, and oxytocin to support both desire and physical arousal in a single treatment. Your licensed provider will determine the formula that's right for you.",
    benefits: [
      { title: "Discreet, on-demand", body: "Prescribed only after your provider determines the right combination for you." },
      { title: "Multi-pathway review", body: "A sublingual troche is taken before activity without an injection or nasal spray." },
      { title: "Provider-tailored", body: "Formulated to your exact needs by your clinician." },
    ],
  },
  {
    slug: "women-hrt-testosterone-cream",
    name: "Testosterone Cream",
    category: "hormone",
    clientProductId: "6iIhc7giORvkHheSgDLi",
    audience: "women",
    price: "Starting at $297/month",
    image: "/images/products/testosterone-cream-women.png",
    tagline: "Low-dose transdermal testosterone for selected postmenopausal women.",
    eyebrow: "Women HRT",
    paragraphs: [
      "For some postmenopausal women, low desire is the real issue. This low-dose cream may help when diagnosed hypoactive sexual desire disorder is the cause, after a full review. It isn't an energy or weight solution. Your provider keeps your dose in a safe, low range and checks how you're feeling.",
    ],
    safety:
      "Children have been harmed by contact with testosterone on someone else's skin. Wash your hands after applying, let the site dry, and cover it. Compounded. Not FDA approved. No FDA approved testosterone product for women exists. Schedule III controlled substance.",
    description:
      "For some postmenopausal women, low desire is the real issue. This low-dose cream may help when diagnosed hypoactive sexual desire disorder is the cause, after a full review. It isn't an energy or weight solution. Your provider keeps your dose in a safe, low range and checks how you're feeling.",
    benefits: [
      { title: "Sexual desire support", body: "May help improve sexual desire in appropriately selected women experiencing persistent low desire." },
      { title: "Sexual response support", body: "May support arousal, pleasure, and sexual responsiveness as part of an individualized treatment plan." },
      { title: "Provider-monitored hormone support", body: "Uses a transdermal approach with dosing and hormone levels monitored by your provider." },
    ],
  },
  {
    slug: "women-hrt-testosterone-injection-low-dose",
    name: "Testosterone injection (low-dose)",
    category: "hormone",
    clientProductId: "prod_bf762c10c31501cffa97b613",
    audience: "women",
    price: "Starting at $195/month",
    image: "/images/products/testosterone-injection-women.png",
    tagline: "Low-dose injectable testosterone when a clinician selects injection over cream.",
    description:
      "Low-dose testosterone injection is one option in women's hormone care when labs, symptoms, and transfer precautions make a cream a poor fit. Dosing is conservative and monitored.",
    benefits: [
      { title: "Measured dose", body: "Injection avoids household transfer risk that comes with creams." },
      { title: "Symptom-led", body: "Used when desire, energy, or other hormone symptoms support it." },
      { title: "Follow-up labs", body: "Levels are rechecked so the dose stays in an appropriate range." },
    ],
  },
  {
    slug: "women-hormone-therapy-vaginal-estrogen-cream",
    name: "Vaginal Estrogen Cream",
    clientProductId: "prod_760a918920adf50705f785f4",
    category: "hormone",
    audience: "women",
    price: "Starting at $267",
    image: "/images/products/vaginal-estrogen-cream.png",
    tagline: "Local estrogen for vaginal dryness and tissue comfort.",
    description:
      "Vaginal estrogen cream is used for local genitourinary symptoms of menopause. It is a local therapy, not a substitute for systemic HRT when that is what the evaluation supports.",
    benefits: [
      { title: "Local relief", body: "Targets dryness, irritation, and tissue comfort where symptoms live." },
      { title: "Format option", body: "Cream is one of several estrogen formats if a patch or pill is hard to fill." },
      { title: "Clinician directed", body: "Dose and whether systemic therapy is also needed are clinical decisions." },
    ],
  },
  {
    slug: "women-hrt-vaginal-estrogen-suppository",
    name: "Vaginal Estrogen Suppository",
    clientProductId: "prod_838073b1b57336246da98f60",
    threeMonthProductId: "prod_838073b1b57336246da98f60_1",
    category: "hormone",
    audience: "women",
    price: "Starting at $69",
    image: "/images/products/vaginal-estrogen-suppository.png",
    tagline: "A lower-mess local estrogen option for genitourinary symptoms.",
    description:
      "Vaginal estrogen suppositories are another local option when cream is messy or poorly tolerated. Your clinician chooses format based on symptoms and preference.",
    benefits: [
      { title: "Local therapy", body: "Designed for vaginal tissue, not as a full-body hormone replacement." },
      { title: "Simple routine", body: "A measured insert instead of a cream application." },
      { title: "Part of a plan", body: "May sit alongside systemic HRT or stand alone after evaluation." },
    ],
  },
  {
    slug: "women-hormone-therapy-estradiol-patch",
    name: "Estradiol Patch",
    clientProductId: "prod_4f6c68b97e6447cf8869b3dc_1",
    threeMonthProductId: "prod_4f6c68b97e6447cf8869b3dc_2",
    category: "hormone",
    audience: "women",
    price: "Starting at $169",
    image: "/images/products/estradiol-patch.png",
    tagline: "Transdermal estradiol when a patch is the right delivery route.",
    description:
      "Estradiol patches deliver systemic estrogen through the skin. If a format is hard to fill, your clinician can discuss cream, gel, oral, or vaginal alternatives and how to switch safely.",
    benefits: [
      { title: "Steady delivery", body: "A patch avoids a daily pill for many women." },
      { title: "Shortage-aware", body: "When patches run short, other estradiol routes can be considered." },
      { title: "Monitored", body: "Symptoms, bleeding, and safety screening still apply." },
    ],
  },
  {
    slug: "women-hormone-therapy-estradiol-pill",
    name: "Estradiol Pill",
    category: "hormone",
    clientProductId: "prod_4f6c68b97e6447cf8869b3dc",
    audience: "women",
    price: "Starting at $207",
    image: "/images/products/estradiol-pill.png",
    tagline: "Oral estradiol when a clinician prefers a pill to a patch or cream.",
    description:
      "Oral estradiol is one systemic option for menopausal symptoms. Route is chosen with clotting history, preference, and availability in mind — not by default.",
    benefits: [
      { title: "Familiar format", body: "A daily pill when transdermal options are not a fit." },
      { title: "Paired with progesterone", body: "Women with a uterus typically need endometrial protection." },
      { title: "Individualized", body: "Dose and combination are set after history and, when needed, labs." },
    ],
  },
  {
    slug: "women-hormone-therapy-progesterone-(oral)",
    name: "Progesterone (oral)",
    category: "hormone",
    clientProductId: "iZT4cfCiDcwOkqT3TCLg",
    audience: "women",
    price: "Starting at $207",
    image: "/images/products/progesterone.png",
    tagline: "Oral progesterone for endometrial protection and selected sleep/mood symptoms.",
    description:
      "Oral progesterone is commonly used with estrogen in women who have a uterus. It is prescribed as part of a hormone plan, not as a standalone sleep aid.",
    benefits: [
      { title: "Endometrial protection", body: "Used with systemic estrogen when a uterus is present." },
      { title: "Nighttime routine", body: "Often taken in the evening as directed." },
      { title: "Plan, not a stack", body: "Dose is matched to the estrogen regimen your clinician chose." },
    ],
  },
  {
    slug: "oxytocin-nasal-spray",
    name: "Oxytocin Nasal Spray",
    category: "sexual",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_899becab62423bae7c0cb086",
    threeMonthProductId: "prod_899becab62423bae7c0cb086_1",
    audience: "all",
    price: "Starting at $159",
    labRequired: true,
    image: "/images/products/oxytocin-nasal-spray.png",
    tagline: "A clinician-guided oxytocin option for intimacy and connection.",
    highlight: "Starting at $159",
    description:
      "A compounded oxytocin nasal spray used to support emotional connection, intimacy, and sexual arousal in both men and women. Oxytocin works through the nervous system to enhance bonding and pleasure response, taken on demand ahead of intimacy or as directed by your provider. Delivered through a convenient nasal spray, oxytocin has been studied for its role in social and emotional processing and interpersonal connection.",
    benefits: [
      {
        title: "Intimacy support",
        body: "Designed to complement a personalized approach to intimacy and sexual wellness.",
      },
      {
        title: "Connection-focused support",
        body: "Oxytocin has been studied for its role in social and emotional processing associated with interpersonal connection.",
      },
      {
        title: "Convenient nasal delivery",
        body: "A simple intranasal route designed for use according to your provider-prescribed treatment plan.",
      },
    ],
  },
  {
    slug: "sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
    name: "Sildenafil Combo Troche (Sildenafil + Oxytocin + B12)",
    category: "sexual",
    clientProductId: "prod_0016ad161e63a4281e6cc27e_1",
    audience: "all",
    price: "Starting at $89/month",
    image: "/images/products/arousal-blend.png",
    tagline: "Arousal Blend — on-demand support for physical performance and blood flow.",
    description:
      "Supports physical performance and blood flow with a personalized combination of sildenafil, oxytocin, and B12. Ideal when desire is not the primary concern and a clinician wants an affordable, on-demand option.",
    benefits: [
      { title: "Achieving and maintaining erections", body: "Sildenafil is used for physical performance support." },
      { title: "On-demand", body: "Built as an entry-level treatment when a full intimacy blend is not needed." },
      { title: "Clinician screened", body: "Cardiac history and interacting medications are reviewed first." },
    ],
  },
  {
    slug: "intimacy-blend-(pt-141-oxytocin-tadalafil)",
    name: "Intimacy Blend (PT-141 + Oxytocin + Tadalafil)",
    category: "sexual",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_0016ad161e63a4281e6cc27e",
    audience: "all",
    price: "Starting at $229/month",
    image: "/images/products/intimacy-blend.png",
    tagline: "A more comprehensive blend for desire and physical performance together.",
    description:
      "Combines PT-141, tadalafil, and oxytocin to support both desire and physical performance. Used when low libido is part of the picture and a clinician wants a longer-lasting, more spontaneous option.",
    benefits: [
      { title: "Desire and performance", body: "PT-141 plus a PDE5 medication when both belong in the plan." },
      { title: "For men and women", body: "The same blend is used when the evaluation supports it." },
      { title: "Not DIY stacking", body: "Doses are set by a licensed clinician after screening." },
    ],
  },
  {
    slug: "nad-injectable",
    name: "NAD+ Injectable",
    category: "longevity",
    clientProductId: "lqC1jqTPT4qpYeqJY6Xf_fBrgIaNDrv1dZunwCWUg_prod_3d638894ad732191af0214fa",
    threeMonthProductId: "prod_3d638894ad732191af0214fa_2",
    audience: "all",
    price: "Starting at $149/month",
    image: "/images/products/nad-injectable.png",
    tagline: "Injectable NAD+ for cellular energy support under clinician direction.",
    description:
      "NAD+ injectable protocols are used in longevity care focused on cellular metabolism. Your provider sets the dose and how often you take it.",
    benefits: [
      { title: "Injectable delivery", body: "Used when a clinician prefers parenteral NAD+ over oral precursors." },
      { title: "Energy support", body: "Part of a longevity plan, not a standalone miracle." },
      { title: "Monitored", body: "Tolerance and goals are reviewed over time." },
    ],
  },
  {
    slug: "longevity-nad-nasal-spray",
    name: "NAD+ Nasal Spray",
    category: "longevity",
    listed: false,
    audience: "all",
    price: "Starting at $119",
    image: "/images/products/nad-overview.png",
    tagline: "Needle-free NAD+ when a nasal format fits your routine.",
    description:
      "NAD+ nasal spray is an at-home option for patients whose clinician prefers not to start with injections. It is still a prescribed protocol, not an over-the-counter wellness spray.",
    benefits: [
      { title: "No needles", body: "A nasal format for at-home use." },
      { title: "Clinician directed", body: "Frequency is set with your longevity plan." },
      { title: "Alternative path", body: "Injectable NAD+ remains available if this is not enough." },
    ],
  },
];

/** Treatments that stay on the public site. Everything else keeps its record and stays off until this list changes. */
const publicProductSlugs = new Set([
  "weight-loss-semaglutide",
  "weight-loss-tirzepatide",
  "longevity-nad",
  "men-trt-testosterone-cypionate",
  "men-trt-enclomiphene",
]);

const hiddenVariantNames = new Set(["Semaglutide Sublingual", "Tirzepatide Sublingual"]);

for (const product of products) {
  product.listed = publicProductSlugs.has(product.slug);
  for (const variant of product.variants ?? []) {
    if (hiddenVariantNames.has(variant.name)) variant.listed = false;
  }
}

export type Lab = {
  slug: string;
  name: string;
  biomarkers: string;
  price: string;
  image: string;
  description: string;
  recommended?: boolean;
  clientProductId?: string;
  clientProductIds?: { Men: string; Women: string };
};

export const labs: Lab[] = [
  {
    slug: "labs-complete-panel",
    name: "Complete Lab",
    biomarkers: "64 biomarkers",
    clientProductIds: {
      Men: "prod_2ffa3e2c3529d51fdc902bb9",
      Women: "MOm8K4PW2aanX9qiz35M",
    },
    price: "$179",
    image:
      "https://framerusercontent.com/images/F7x0JTDFEFbHV8R25qS1PWofP6g.png?width=1620&height=2880",
    description:
      "A baseline panel so your clinician can see the metrics that actually change a treatment plan — hormones, metabolic markers, and safety labs.",
  },
  {
    slug: "labs-advance-panel",
    name: "Advanced Lab",
    biomarkers: "100 biomarkers",
    clientProductIds: {
      Men: "o5OqsW4Mva0AhsKMq5E2",
      Women: "1IMJ6w6iDS0IiHYGDTWP",
    },
    price: "$399",
    recommended: true,
    image:
      "https://framerusercontent.com/images/X7bsiY1oJsGU4I96M8TqKDKmvY.png?width=1620&height=2880",
    description:
      "A deeper performance and longevity panel, including additional biomarkers and a clinical review of the results.",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function listedVariants(product: Product) {
  return (product.variants ?? []).filter((variant) => variant.listed !== false);
}

const singleFormImages: Record<string, string> = {
  "weight-loss-semaglutide": "/images/products/semaglutide-injectable.png?v=4",
  "weight-loss-tirzepatide": "/images/products/tirzepatide-injectable.png?v=4",
};

/** Public view of a product. A single listed form uses that form's image and price; the other forms stay in the catalog. */
export function presentListedProduct(product: Product): Product {
  const variants = listedVariants(product);
  if (variants.length !== 1) return { ...product, variants };
  const variant = variants[0];
  const price = variant.priceAmount ? `Starting at ${variant.priceAmount}/month` : variant.price;
  return {
    ...product,
    variants: variants.map((item) => ({
      ...item,
      image: singleFormImages[product.slug] ?? item.image,
    })),
    image: singleFormImages[product.slug] ?? variant.image ?? product.image,
    price,
    clientProductId: variant.clientProductId ?? product.clientProductId,
    threeMonthProductId: variant.threeMonthProductId ?? product.threeMonthProductId,
  };
}

export function listedClientProductIds() {
  const ids = new Set<string>();
  const add = (id?: string) => {
    if (id) ids.add(id);
  };
  for (const product of products) {
    if (product.listed === false) continue;
    add(product.clientProductId);
    add(product.threeMonthProductId);
    for (const variant of listedVariants(product)) {
      add(variant.clientProductId);
      add(variant.threeMonthProductId);
    }
  }
  for (const lab of labs) {
    add(lab.clientProductId);
    add(lab.clientProductIds?.Men);
    add(lab.clientProductIds?.Women);
  }
  return ids;
}

export function productsFor(audience?: Audience, category?: Category) {
  return products.filter((p) => {
    if (p.listed === false) return false;
    const audienceOk = !audience || audience === "all" || p.audience === audience || p.audience === "all";
    const categoryOk = !category || p.category === category;
    return audienceOk && categoryOk;
  }).map(presentListedProduct);
}
