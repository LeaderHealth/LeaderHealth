export type Article = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  body: string[];
  listed?: boolean;
};

const glp1Stop = {
  title: "What Happens If You Pause or Stop GLP-1 Support: The Maintenance Decision, Explained",
  date: "Jul 14, 2026",
  category: "Weight Loss",
  excerpt:
    "Why appetite and weight often rebound after stopping, and how a clinician thinks about maintenance.",
  body: [
    "Stopping a GLP-1 medication is a clinical decision, not a calendar event. Appetite often returns; some weight often follows. That is expected biology, not a personal failure.",
    "A maintenance conversation covers protein, resistance training, the lowest effective dose if continuing, and whether a pause is being driven by side effects, cost, supply, or goals. None of those should be handled with a sudden stop and no plan.",
  ],
};

const sermorelinGuide = {
  title: "What Is Sermorelin? A Physician's Guide to Growth Hormone Support Through Peptide Therapy",
  date: "Dec 4, 2025",
  category: "Longevity",
  excerpt:
    "How sermorelin is used in physician-guided protocols, what labs matter, and what it is not.",
  body: [
    "Sermorelin is a growth-hormone–releasing hormone analog used in some longevity and recovery protocols. It is not a substitute for addressing sleep, training, and nutrition, and it is not an anti-aging guarantee.",
    "A responsible protocol starts with history and labs, screens for contraindications, and follows symptoms plus follow-up testing. Compounded sermorelin is not FDA-approved; it is prepared by a licensed pharmacy on a prescriber's order.",
  ],
};

export const articles: Article[] = [
  {
    slug: "hormone-replacement-therapy-perimenopause-guide",
    title:
      "What Every Woman Should Know About Hormone Replacement Therapy in Perimenopause — and Why Most Doctors Don't Tell You",
    date: "Apr 24, 2026",
    category: "HRT / menopause",
    excerpt:
      "A physician-reviewed look at perimenopause hormone therapy — what changes, what options exist, and why monitoring beats a one-size prescription.",
    body: [
      "Perimenopause is not a sudden cliff. Estrogen, progesterone, and sleep can wobble for years while labs still look 'normal.' That is why a useful conversation starts with symptoms — vasomotor, sleep, mood, bleeding, sexual comfort — not a single blood draw.",
      "Hormone therapy is one tool, not a personality makeover. Route matters: patch, pill, cream, and vaginal estrogen are not interchangeable, and shortages of one format should lead to a planned switch, not a gap in care.",
      "Women with a uterus typically need endometrial protection when taking systemic estrogen. Clotting history, migraine with aura, and breast-cancer risk change the plan. Those are clinical decisions, which is why Leader Health starts with history and, when indicated, labs.",
    ],
  },
  {
    slug: "testosterone-replacement-therapy-men-guide",
    title: "Testosterone Replacement Therapy: A Physician's Evidence-Based Guide to TRT in 2026",
    date: "Apr 24, 2026",
    category: "Hormone Therapy",
    excerpt:
      "When TRT is appropriate, what labs to watch, and why fertility and hematocrit belong in the first visit — not the fine print.",
    body: [
      "Low energy is not a testosterone diagnosis. TRT is considered when symptoms and confirmed low levels line up, after a clinician looks at sleep, medications, pituitary signals, and fertility goals.",
      "Injection, cream, and alternatives such as enclomiphene are different tools. Transfer risk with creams, hematocrit with injections, and fertility suppression are not optional topics.",
      "Follow-up is the treatment. Dose is adjusted to labs and how you feel — not to a social-media target range.",
    ],
  },
  {
    slug: "hormone-therapy-options-when-estrogen-format-runs-short",
    title: "Estrogen Hard to Fill? Your Hormone Therapy Options When a Format Runs Short",
    date: "Jul 21, 2026",
    category: "HRT / menopause",
    excerpt:
      "A physician-reviewed guide to estrogen delivery options when your patch is hard to fill — how patch, gel, spray, oral, and vaginal routes compare, and how to switch safely.",
    body: [
      "Patch shortages are frustrating because the patch is often the right clinical choice, not a luxury. The useful move is a planned switch to another estradiol route with the same clinician watching symptoms and bleeding — not a DIY pause.",
      "Vaginal estrogen treats local symptoms and is not a full substitute for systemic therapy. Oral estradiol, cream, and gel each have trade-offs around clotting risk, convenience, and availability.",
      "If a format runs short, contact your care team before you run out. A gap in therapy is a medical event, not a supply footnote.",
    ],
  },
  {
    slug: "recovery-peptides-evidence-vs-hype",
    title: "Recovery Peptides: Separating the Evidence From the Hype (and Where the FDA Stands)",
    date: "Jul 21, 2026",
    category: "Peptides / performance",
    excerpt:
      "A physician-reviewed look at recovery peptides — what is actually studied versus marketed, and what the FDA's compounding review does and does not change.",
    body: [
      "Most peptide marketing outruns the evidence. A few compounds have clinical use cases; many are sold as research chemicals with no legitimate pharmacy trail.",
      "Compounding rules and FDA actions change what pharmacies can prepare. That is not a loophole to shop around — it is a reason to stay inside a licensed clinician-plus-pharmacy path.",
      "If you compete in tested sport, anti-doping lists are a separate and stricter filter. Being 'available online' is not the same as being permitted.",
    ],
  },
  {
    slug: "perimenopause-or-low-desire-reading-the-signals",
    title: "Is It Perimenopause or Low Desire? How to Read the Signals Together",
    date: "Jul 21, 2026",
    category: "Sexual health (women's)",
    excerpt:
      "A physician-reviewed guide to telling perimenopause-driven low desire from primary low libido — the overlapping signals, and how a clinician sorts them out.",
    body: [
      "Low desire in midlife is often several problems wearing one complaint. Night sweats wreck sleep; dryness makes sex hurt; mood and relationship context sit on top. Treating only one layer is why people bounce between products.",
      "A clinician sorts hormones, medications, pain, and mental health before naming a peptide or a cream. PT-141, local estrogen, and systemic HRT answer different questions.",
    ],
  },
  {
    slug: "semaglutide-vs-tirzepatide-comparison-guide",
    title:
      "Semaglutide vs Tirzepatide: How to Think About the Trade-Off (and Why Monitoring Matters More Than the Molecule)",
    date: "Jul 20, 2026",
    category: "Weight Loss",
    excerpt:
      "A physician-reviewed comparison of semaglutide and tirzepatide — mechanism, trial results, and tolerability — and why monitoring matters more than the molecule.",
    body: [
      "If you are trying to decide between semaglutide and tirzepatide, the honest short answer is this: head-to-head, tirzepatide produced more average weight loss — but the molecule is not the variable that will most determine your result. Both are highly effective. What separates a good outcome from a frustrating one is usually the care around the medication: how it is titrated, whether your muscle is protected, and whether anyone is monitoring your labs and adjusting the plan.",
      "Semaglutide is a GLP-1 receptor agonist: it acts on a single pathway. Tirzepatide is a dual agonist: it acts on GLP-1 and GIP. Engaging two complementary pathways appears to produce a somewhat stronger average effect — but individual response and tolerability vary widely.",
      "In STEP 1, adults taking semaglutide lost an average of about 14.9% of body weight over 68 weeks. In SURMOUNT-1, tirzepatide produced average reductions of roughly 15% to 21% depending on dose. SURMOUNT-5, the first randomized head-to-head trial, found about 20.2% average reduction with tirzepatide versus about 13.7% with semaglutide at 72 weeks. These are averages, not promises.",
      "Both medications carry a boxed warning about thyroid C-cell tumors in rodents and are contraindicated in people with a personal or family history of medullary thyroid carcinoma or MEN 2.",
    ],
  },
  {
    slug: "recovery-peptides-anti-doping-sourcing-guide",
    title:
      "Recovery Peptides and the Anti-Doping Question: What Athletes Should Verify Before They Buy",
    date: "Jul 20, 2026",
    category: "Peptides",
    excerpt:
      "A physician-reviewed look at recovery peptides — what is actually studied versus marketed, the anti-doping reality, and what athletes should verify before they buy.",
    body: [
      "Recovery peptides are marketed aggressively to athletes. The evidence, the compounding rules, and the anti-doping lists are not the same conversation — and mixing them up is how people get hurt or banned.",
      "If you compete in a tested sport, assume many popular peptides are prohibited. WADA and sport-specific lists change. Verify the substance, the source, and your organization's current rules before you buy anything.",
      "Clinically, the useful question is not which peptide is trending but whether a licensed clinician, a legitimate pharmacy, and a monitoring plan exist.",
    ],
  },
  {
    slug: "low-libido-in-women-causes-evaluation-guide",
    title:
      "When Desire Fades: How a Clinician Sorts Out What's Actually Behind Low Libido in Women",
    date: "Jul 20, 2026",
    category: "Women's Health",
    excerpt:
      "A physician-reviewed guide to telling perimenopause-driven low desire from primary low libido — the overlapping signals, and how a clinician sorts them out.",
    body: [
      "Low desire is common and rarely has a single cause. Hormones, sleep, medications, relationship context, and pain can all sit in the same week. A useful evaluation does not start with a product; it starts with the story.",
      "Perimenopause can change desire through vasomotor symptoms, sleep fragmentation, vaginal dryness, and shifting estrogen and testosterone. Medications such as SSRIs, and medical issues such as thyroid disease, deserve a look before anyone talks about peptides or troches.",
    ],
  },
  {
    slug: "when-the-scale-stops-moving-in-menopause-why-weight-and-hormones-belong-in-one-plan",
    title: "When the Scale Stops Moving in Menopause: Why Weight and Hormones Belong in One Plan",
    date: "Jul 15, 2026",
    category: "Weight Loss",
    excerpt:
      "Why midlife weight gain is often hormones plus metabolism, and why GLP-1 care without a hormone look is an incomplete plan.",
    body: [
      "Menopause changes where weight sits and how hard it is to lose. Sleep, insulin sensitivity, and muscle loss all move at once. A GLP-1 medication can help appetite; it does not automatically fix estrogen-related symptoms or protect muscle.",
      "The more durable approach is one clinician looking at labs, protein, resistance training, and whether HRT belongs — not two disconnected programs.",
    ],
  },
  {
    slug: "sleep-testosterone-and-recovery-the-triad-most-men-optimizing-hormones-overlook",
    title: "Sleep, Testosterone, and Recovery: The Triad Most Men Optimizing Hormones Overlook",
    date: "Jul 14, 2026",
    category: "Hormone Therapy",
    excerpt:
      "Why poor sleep can look like low testosterone, and why TRT without recovery work underperforms.",
    body: [
      "A short night lowers morning testosterone and raises the chance you will chase a prescription for a sleep problem. Screening for apnea, alcohol, and training load is not a delay tactic.",
      "If TRT is appropriate, recovery still has to be in the plan: sleep opportunity, protein, and not adding volume the week a dose increases.",
    ],
  },
  {
    slug: "biological-age-and-longevity-lab-tests-what-the-evidence-actually-supports",
    title: "Biological Age and Longevity Lab Tests: What the Evidence Actually Supports",
    date: "Jul 14, 2026",
    category: "Longevity",
    excerpt:
      "Which biomarkers change a plan, and which 'biological age' scores are still marketing.",
    body: [
      "A useful lab panel answers clinical questions: thyroid, metabolic health, hormones, inflammation, nutrients, liver and kidney. Those change prescriptions and follow-up.",
      "Biological-age scores can be interesting and still not validated enough to drive treatment by themselves. Leader Health's advanced panel is built around markers a clinician can act on, not a single vanity number.",
    ],
  },
  { slug: "stopping-glp-1-maintenance-decision-guide", ...glp1Stop },
  { slug: "glp1-pause-or-stop-maintenance", listed: false, ...glp1Stop },
  {
    slug: "daily-tadalafil-sexual-health-cardiovascular-benefits",
    title: "Daily Low-Dose Tadalafil: What the Evidence Shows for Sexual and Cardiovascular Health",
    date: "Apr 24, 2026",
    category: "Sexual Health",
    excerpt:
      "How daily tadalafil differs from as-needed use, and why cardiac history still comes first.",
    body: [
      "Daily low-dose tadalafil is a different pattern than a tablet before sex. Some men prefer the spontaneity; some need as-needed dosing. The clinical screen — nitrates, blood pressure, interacting drugs — is the same.",
      "Cardiovascular signals in the literature are not a reason to self-start. They are a reason to have a clinician decide if daily use belongs in your plan.",
    ],
  },
  { slug: "sermorelin-peptide-therapy-guide", ...sermorelinGuide },
  { slug: "what-is-sermorelin-guide", listed: false, ...sermorelinGuide },
  {
    slug: "pt-141-bremelanotide-sexual-health-guide",
    title: "PT-141 (Bremelanotide): How This CNS Peptide Supports Sexual Desire in Men and Women",
    date: "May 8, 2026",
    category: "Sexual Health",
    excerpt:
      "Why PT-141 is not a blood-flow drug, who it may help, and what to screen for first.",
    body: [
      "PT-141 acts on the central nervous system rather than on penile or clitoral blood flow. That is why it shows up when desire, not mechanics, is the complaint — and why it is used in some intimacy blends with a PDE5 medication.",
      "Nausea and blood-pressure changes are real. It is prescribed after a clinician sorts hormones, medications, and what 'low desire' actually means for you.",
    ],
  },
  {
    slug: "nad-plus-injectable-oral-evidence-guide",
    title:
      "NAD+ Supplementation: What the Science Actually Shows About Oral Precursors vs. Injectable NAD+",
    date: "Feb 25, 2026",
    category: "Longevity",
    excerpt:
      "Oral precursors and injectable NAD+ are not the same intervention. Here is how a clinician thinks about the evidence.",
    body: [
      "NAD+ is a cofactor, not a vitamin you can sprinkle on cereal with guaranteed longevity results. Oral precursors and injectable NAD+ have different absorption stories and different evidence.",
      "Leader Health offers injectable and nasal formats when a clinician believes they belong in a monitored plan — not as a substitute for sleep, training, and metabolic care.",
    ],
  },
  {
    slug: "injectable-l-glutathione-antioxidant-guide",
    title:
      "Injectable L-Glutathione: The Antioxidant That Doesn't Survive the Stomach — and Why Delivery Method Matters",
    date: "May 11, 2026",
    category: "Longevity",
    excerpt:
      "Why oral glutathione is a poor stand-in for an injectable protocol, and when clinicians consider it.",
    body: [
      "Glutathione is poorly absorbed when swallowed. That is the entire point of an injectable protocol — not a marketing flourish.",
      "It is still a compounded, clinician-directed therapy. 'Antioxidant' is not a diagnosis. Your provider decides if it belongs next to your other care.",
    ],
  },
  {
    slug: "glp-1-medications-weight-management-guide",
    title: "GLP-1 Medications for Weight Management: A Physician's Guide to Semaglutide and Tirzepatide",
    date: "May 4, 2026",
    category: "Weight Loss",
    excerpt:
      "How GLP-1 medications work, who should not take them, and why titration and muscle protection decide the outcome.",
    body: [
      "Semaglutide and tirzepatide reduce appetite through gut-hormone pathways. They are prescription medications with a boxed warning about thyroid C-cell tumors in animals and clear contraindications including medullary thyroid cancer and MEN 2.",
      "Compounded versions are not FDA-approved generics of branded products. Labs, titration, protein, and resistance training are the difference between a monitored plan and a mailed prescription.",
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function publishedArticles() {
  return articles.filter((a) => a.listed !== false);
}
