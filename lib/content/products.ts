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
  variants?: {
    name: string;
    eyebrow?: string;
    detail: string;
    price: string;
    priceAmount?: string;
    notes: string[];
    image?: string;
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
    labRequired: true,
    image:
      "https://framerusercontent.com/images/xDyQlFKKF945ielQLHRmWsJply8.png?width=785&height=995",
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
    labRequired: true,
    image:
      "https://framerusercontent.com/images/MKfQvxNUoASTK8K9iYyxletrY0.png?width=952&height=1213",
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
    audience: "all",
    price: "Starting From $149/mo",
    labRequired: true,
    image:
      "https://framerusercontent.com/images/Nxmvv0V7wJmcL1463SseCeRgh8.png?width=1080&height=1350",
    tagline: "Peptide support for recovery, body composition, and overnight repair.",
    description:
      "Sermorelin is a growth-hormone–releasing peptide used in physician-guided protocols. Treatment starts with labs so your clinician can confirm it fits your history and goals.",
    benefits: [
      { title: "Overnight support", body: "Typically used at night as part of a recovery-focused plan." },
      { title: "Body composition", body: "Paired with training and protein for lean-mass support." },
      { title: "Lab-first", body: "Prescribed only after evaluation by a licensed provider." },
    ],
  },
  {
    slug: "longevity-glutathione",
    name: "Glutathione",
    category: "longevity",
    audience: "all",
    price: "Starting at $129/Month",
    image:
      "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
    tagline: "Antioxidant support delivered in a format that can actually be absorbed.",
    description:
      "Injectable glutathione is used as a wellness essential for cellular protection and recovery. Your clinician reviews whether it belongs in your protocol.",
    benefits: [
      { title: "Cellular support", body: "An antioxidant that does not survive well in the stomach." },
      { title: "Weekly ritual", body: "Often used as a standing wellness injection." },
      { title: "Clinician guided", body: "Dosing and frequency are set by your provider." },
    ],
  },
  {
    slug: "longevity-nad",
    name: "NAD+",
    category: "longevity",
    audience: "all",
    listed: false,
    price: "Starting at $119",
    image:
      "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
    tagline: "Cellular energy support with injectable and nasal options.",
    description:
      "NAD+ protocols are used for energy and recovery. Your provider helps choose injectable or nasal delivery based on your goals and tolerance.",
    benefits: [
      { title: "Energy support", body: "Used in longevity protocols focused on cellular metabolism." },
      { title: "Two paths", body: "Injectable from $149/mo or nasal spray from $119." },
      { title: "Provider oversight", body: "Not a one-size wellness add-on — dosing is individualized." },
    ],
    variants: [
      {
        name: "NAD+ Injectable",
        eyebrow: "Injectable",
        detail: "Clinician-guided injectable protocol.",
        price: "From $149 / month",
        priceAmount: "$149",
        notes: ["Provider directed"],
      },
      {
        name: "NAD+ Nasal Spray",
        eyebrow: "Nasal spray",
        detail: "Needle-free option for at-home use.",
        price: "From $119",
        priceAmount: "$119",
        notes: ["No needles"],
      },
    ],
  },
  {
    slug: "men-trt-testosterone-cypionate",
    name: "Testosterone Cypionate",
    category: "hormone",
    audience: "men",
    price: "Starting at $109/month",
    labRequired: true,
    image:
      "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
    tagline: "Clinician-led TRT after labs, history, and a real plan for follow-up.",
    description:
      "Testosterone cypionate is prescribed only after evaluation. Your clinician reviews symptoms, labs, and risk factors, then sets a protocol with ongoing monitoring.",
    benefits: [
      { title: "Energy and drive", body: "Used when labs and symptoms support replacement." },
      { title: "Follow-up built in", body: "Dosing is adjusted to labs, not set-and-forget." },
      { title: "Safety first", body: "Hematocrit, estradiol, and symptoms are watched over time." },
    ],
  },
  {
    slug: "men-trt-enclomiphene",
    name: "Enclomiphene",
    category: "hormone",
    audience: "men",
    price: "Starting at $109/month",
    labRequired: true,
    image:
      "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
    tagline: "A fertility-minded option for men who need testosterone support.",
    description:
      "Enclomiphene may be considered when a clinician wants to support testosterone while preserving downstream signaling. Labs and fertility goals drive the decision.",
    benefits: [
      { title: "Alternative path", body: "Not every man needs injectable testosterone first." },
      { title: "Lab guided", body: "Baseline and follow-up labs shape dose and duration." },
      { title: "Goals first", body: "Fertility, symptoms, and safety are reviewed together." },
    ],
  },
  {
    slug: "men-trt-testosterone-cream",
    name: "Testosterone Cream",
    category: "hormone",
    audience: "men",
    price: "Starting at $119/month",
    labRequired: true,
    image:
      "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
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
    image:
      "https://framerusercontent.com/images/GMDs0BF7J9LSEZf6TeYNopUk.png?width=2308&height=836",
    tagline: "Perimenopause and menopause care with more than one delivery option.",
    description:
      "Women's hormone therapy is built around symptoms, labs, and the formats that are actually available — cream, patch, pill, or vaginal options — with a clinician choosing what fits.",
    benefits: [
      { title: "Format flexibility", body: "Patch, cream, oral, and vaginal options when one runs short." },
      { title: "Symptom-led", body: "Sleep, mood, vasomotor symptoms, and bone health are considered together." },
      { title: "Ongoing review", body: "Plans change as your cycle and labs change." },
    ],
  },
  {
    slug: "men-sexual-health-tadalafil",
    name: "Tadalafil",
    seoTitle: "Tadalafil for Erectile Dysfunction Online",
    category: "sexual",
    audience: "men",
    price: "$79/mo",
    image:
      "https://framerusercontent.com/images/xiLmspoD4quCotY2Ro6T9VdAuU.png?width=1890&height=2363",
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
    audience: "all",
    price: "Starting at $189/month",
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
    tagline: "A CNS peptide used for desire — for men and women — when clinically appropriate.",
    description:
      "PT-141 (bremelanotide) acts on the central nervous system rather than blood flow. It is prescribed after a clinician sorts out what is actually driving low desire.",
    benefits: [
      { title: "Desire-focused", body: "Different pathway than PDE5 medications." },
      { title: "Men and women", body: "Used in both when the evaluation supports it." },
      { title: "Nasal option", body: "A needle-free format for at-home use." },
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
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
    tagline: "Combination troches when a clinician wants more than a single agent.",
    description:
      "Men's combo troches may include agents such as sildenafil with supportive ingredients. Your provider decides if a combination belongs in your plan.",
    benefits: [
      { title: "Combination approach", body: "More than one pathway when clinically useful." },
      { title: "Dissolvable", body: "Troche format for at-home use." },
      { title: "Prescribed, not stacked DIY", body: "Doses are set by a licensed clinician." },
    ],
  },
  {
    slug: "women-sexual-health-combo-troches",
    name: "Combo Troches",
    category: "sexual",
    audience: "women",
    listed: false,
    price: "Starting at $229/month",
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
    tagline: "Intimacy blends prescribed after a clinician evaluates desire, hormones, and safety.",
    description:
      "Women's combo troches may combine agents such as PT-141 with other supportive ingredients. This is a clinical decision, not a wellness stack.",
    benefits: [
      { title: "Whole-picture eval", body: "Hormones, medications, and desire are reviewed together." },
      { title: "Personalized blend", body: "Only used when the evaluation supports it." },
      { title: "Follow-up", body: "Side effects and benefit are checked, not assumed." },
    ],
  },
  {
    slug: "women-hrt-testosterone-cream",
    name: "Testosterone Cream",
    category: "hormone",
    audience: "women",
    price: "Starting at $297/month",
    image:
      "https://framerusercontent.com/images/z3UQWonIr4HVs8sU45l8CqF9Y.png?width=1080&height=1350",
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
    audience: "women",
    price: "Starting at $195/month",
    image:
      "https://framerusercontent.com/images/v18TtF6idRTxtVpZ4ELVTqQf8Q.png?width=1080&height=1350",
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
    category: "hormone",
    audience: "women",
    price: "Starting at $267",
    image:
      "https://framerusercontent.com/images/z3UQWonIr4HVs8sU45l8CqF9Y.png?width=1080&height=1350",
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
    category: "hormone",
    audience: "women",
    price: "Starting at $69",
    image:
      "https://framerusercontent.com/images/z3UQWonIr4HVs8sU45l8CqF9Y.png?width=1080&height=1350",
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
    category: "hormone",
    audience: "women",
    price: "Starting at $169",
    image:
      "https://framerusercontent.com/images/GMDs0BF7J9LSEZf6TeYNopUk.png?width=2308&height=836",
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
    audience: "women",
    price: "Starting at $207",
    image:
      "https://framerusercontent.com/images/GMDs0BF7J9LSEZf6TeYNopUk.png?width=2308&height=836",
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
    audience: "women",
    price: "Starting at $207",
    image:
      "https://framerusercontent.com/images/GMDs0BF7J9LSEZf6TeYNopUk.png?width=2308&height=836",
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
    audience: "all",
    price: "Starting at $159",
    labRequired: true,
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
    tagline: "A clinician-guided oxytocin option for intimacy and connection.",
    description:
      "Oxytocin nasal spray is prescribed after a clinician reviews desire, relationship context, and other medications. It is not a substitute for evaluating hormones, pain, or mood.",
    benefits: [
      { title: "Needle-free", body: "A nasal format for at-home use when prescribed." },
      { title: "Used in blends", body: "Also appears in some combo troches when clinically useful." },
      { title: "Evaluation first", body: "Labs may be required so the rest of the picture is not missed." },
    ],
  },
  {
    slug: "sildenafil-combo-troche-(sildenafil-oxytocin-b12)",
    name: "Sildenafil Combo Troche (Sildenafil + Oxytocin + B12)",
    category: "sexual",
    audience: "all",
    price: "Starting at $89/month",
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
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
    audience: "all",
    price: "Starting at $229/month",
    image:
      "https://framerusercontent.com/images/pa9pIi4me0ue0YEMZpLwghozic.png?width=1024&height=587",
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
    audience: "all",
    price: "Starting at $149/month",
    image:
      "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
    tagline: "Injectable NAD+ for cellular energy support under clinician direction.",
    description:
      "NAD+ injectable protocols are used in longevity care focused on cellular metabolism. Your provider sets frequency and whether a nasal option is a better fit.",
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
    audience: "all",
    price: "Starting at $119",
    image:
      "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
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

export const labs = [
  {
    slug: "labs-complete-panel",
    name: "Complete Lab",
    biomarkers: "64 biomarkers",
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

export function productsFor(audience?: Audience, category?: Category) {
  return products.filter((p) => {
    if (p.listed === false) return false;
    const audienceOk = !audience || audience === "all" || p.audience === audience || p.audience === "all";
    const categoryOk = !category || p.category === category;
    return audienceOk && categoryOk;
  });
}
