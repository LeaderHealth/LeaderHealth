export type ArticleFaq = {
  question: string;
  answer: string;
};

export const articleFaqs: Record<string, ArticleFaq[]> = {
  "hormone-replacement-therapy-perimenopause-guide": [
    {
      "question": "Is HRT safe for perimenopause?",
      "answer": "For most healthy women under 60 or within 10 years of menopause onset, the current consensus from the North American Menopause Society is that the benefits of hormone therapy outweigh the risks. Safety depends on individual history, delivery method, and ongoing monitoring — which is why this is a conversation to have with a knowledgeable provider, not a one-size-fits-all answer."
    },
    {
      "question": "What is the timing hypothesis?",
      "answer": "The timing hypothesis is the idea that hormone therapy started earlier in the menopause transition — before age 60 or within 10 years of the final menstrual period — has a more favorable risk-benefit profile than hormone therapy started later. It is supported by the current peer-reviewed literature."
    },
    {
      "question": "What is the difference between bioidentical and synthetic hormones?",
      "answer": "Bioidentical hormones have the same molecular structure as the hormones your body produces. Synthetic hormones, like the medroxyprogesterone acetate used in the original WHI study, have a different structure and a different risk profile. \"Bioidentical\" is a molecular description, not a guarantee of safety — but it is a meaningful distinction."
    },
    {
      "question": "Can HRT cause breast cancer?",
      "answer": "Combined estrogen-progestin therapy in the WHI was associated with a small absolute increase in breast cancer events. The estrogen-only arm of the same study showed a reduction. The current consensus is that for women in the appropriate timing window, the absolute risk is small and should be weighed against the benefits for symptom relief and bone, cognitive, and possibly cardiovascular health."
    },
    {
      "question": "Will HRT cause weight gain?",
      "answer": "The body composition changes most women notice in perimenopause — particularly increased abdominal fat — are largely driven by the hormone changes of the transition itself. Hormone therapy does not consistently cause weight gain in studies, and may help with body composition for some women."
    },
    {
      "question": "Can women with a history of breast cancer use vaginal estrogen?",
      "answer": "The position has softened over the past decade. The Menopause Society and ACOG now support shared decision-making about low-dose vaginal estrogen in selected breast cancer survivors with severe GSM, particularly those on aromatase inhibitors. This is a conversation to have with both your oncology team and a menopause-knowledgeable provider — it is no longer the automatic \"no\" it once was."
    },
    {
      "question": "How do I find a provider who actually understands perimenopause?",
      "answer": "Look for providers with MSCP (Menopause Society Certified Practitioner) credentialing, ask specifically about their approach to perimenopause (not just menopause), and pay attention to whether they take a full clinical history or rely on a single lab value to dismiss symptoms."
    }
  ],
  "testosterone-replacement-therapy-men-guide": [
    {
      "question": "What testosterone level is considered low?",
      "answer": "The American Urological Association uses below 300 ng/dL on at least two early-morning fasting blood tests, combined with symptoms consistent with deficiency. A single value in isolation is not a diagnosis."
    },
    {
      "question": "What is the difference between free and total testosterone?",
      "answer": "Total testosterone measures all the testosterone in your blood. Free testosterone is the 1–3% not bound to carrier proteins — that fraction is biologically active. SHBG levels can make the total look reasonable while the free is genuinely low."
    },
    {
      "question": "Does TRT cause testicular atrophy?",
      "answer": "Exogenous testosterone signals the body to reduce its own production, which can cause the testicles to shrink during therapy. Adding hCG or gonadorelin can preserve testicular function for men who want to maintain fertility or avoid this change."
    },
    {
      "question": "Can you stop TRT once you start?",
      "answer": "Yes. Most men's natural production recovers within 3–6 months of stopping. Some recover more slowly. A small number experience a meaningful low period during the transition that is worth planning for in advance with a physician."
    },
    {
      "question": "Is TRT safe for the heart?",
      "answer": "The TRAVERSE trial (2023) showed no significant increase in major cardiovascular events in men with hypogonadism at elevated risk. The FDA removed the cardiovascular black box warning in 2025. The cardiovascular safety story is better than the 2010s reputation suggested, with the caveat that monitoring still matters."
    },
    {
      "question": "Do I need an aromatase inhibitor?",
      "answer": "Not by default. Many men do well on TRT without one. An aromatase inhibitor should be reserved for situations where estradiol is clinically problematic — not handed out as part of a routine stack."
    }
  ],
  "hormone-therapy-options-when-estrogen-format-runs-short": [
    {
      "question": "What can I use if my estradiol patch is out of stock?",
      "answer": "There are several approved alternatives — a topical estradiol gel or spray (also transdermal, and often the closest substitute), oral estradiol tablets, and vaginal preparations for local symptoms. The right choice depends on your symptoms and risk profile, and the dose is not identical across formats, so the switch should be made with a clinician rather than improvised."
    },
    {
      "question": "Is an estradiol gel or spray as good as the patch?",
      "answer": "For delivering systemic estradiol, gels and sprays are also transdermal and share the patch's route-related advantages, including bypassing the liver's first-pass effect. They are often the most direct substitute when patches are short. Absorption depends on applying them correctly and letting the skin dry, and a clinician will re-match your dose to the new format."
    },
    {
      "question": "Is oral estrogen less safe than the patch?",
      "answer": "Not universally, but the route matters. In observational studies, oral estrogen was associated with a higher blood-clot risk than transdermal estrogen, likely because oral estrogen passes through the liver first and affects clotting factors. For many healthy women, oral estrogen is still a reasonable option; for those with clot risk factors, a transdermal route is often preferred. This is a decision to individualize with a physician."
    },
    {
      "question": "How long will the estrogen patch shortage last?",
      "answer": "It is expected to be intermittent into late 2026. Demand rose sharply after the FDA removed part of a longstanding boxed warning on hormone therapy in late 2025, and the patches are complex to manufacture. The situation varies by brand, dose, and pharmacy, which is why having an available alternative lined up with your clinician is more reliable than waiting for a specific product to return."
    },
    {
      "question": "Can I just switch my own estrogen to whatever the pharmacy has?",
      "answer": "It is not a safe do-it-yourself swap. Doses are not equivalent across formats, the route can change your risk profile, and if you have a uterus your plan still needs adequate progesterone for endometrial protection. A brief visit to have a clinician move you to an available, appropriate format keeps your therapy continuous and protected."
    },
    {
      "question": "If I have a uterus, does switching formats change my progesterone?",
      "answer": "Your need for endometrial protection does not change. Any woman with a uterus on systemic estrogen needs an adequate progestogen — usually micronized progesterone — regardless of which estrogen format she uses. When the estrogen route changes, the progesterone stays part of the plan; a clinician confirms the combination remains appropriate."
    }
  ],
  "recovery-peptides-evidence-vs-hype": [
    {
      "question": "Do recovery peptides actually work?",
      "answer": "For the most-marketed ones, the honest answer is that we do not yet know in humans. Compounds like BPC-157 and TB-500 have interesting mechanisms and encouraging animal data, but essentially no randomized human trials for tendon, muscle, or joint recovery. Encouraging biology is not the same as proven benefit, and testimonials are not evidence."
    },
    {
      "question": "Are recovery peptides FDA-approved?",
      "answer": "Most are not approved for any human use, and most are not on the FDA's 503A Bulks List that permits legal compounding. In 2026 the FDA began a formal review of several peptides, but that process concerns compounding eligibility — not approval, dosing, or proof that they work. \"Under review\" does not mean approved or proven."
    },
    {
      "question": "What is the FDA deciding about peptides in July 2026?",
      "answer": "The FDA's Pharmacy Compounding Advisory Committee is scheduled to meet on July 23–24, 2026 to consider whether several peptides, including BPC-157 and TB-500, should be added to the list that permits licensed compounding. For BPC-157, the FDA's own pre-meeting briefing documents recommended against adding it, and any change would take an estimated 12–24 months of rulemaking to implement."
    },
    {
      "question": "Are peptides banned in sport?",
      "answer": "Many are. The World Anti-Doping Agency prohibits BPC-157, TB-500, and essentially the entire class of growth-hormone-releasing peptides and secretagogues — at all times, in and out of competition. That includes sermorelin. If you are subject to testing, assume a peptide is prohibited until you have verified otherwise against the current list and checked with your clinician."
    },
    {
      "question": "Are recovery peptides safe?",
      "answer": "The biggest safety issue is usually not the molecule in the abstract but the source. Gray-market vials can carry inaccurate dosing, contaminants, and endotoxins, with no accountability. Physician oversight, verified sourcing from a licensed pharmacy, and lab monitoring change the risk profile substantially. For most recovery peptides, long-term human safety data are also limited — another reason honest oversight matters. These compounds are also not appropriate during pregnancy or breastfeeding, and because several act on tissue-growth and proliferation pathways, they warrant particular caution in anyone with a history of cancer — another reason physician oversight matters."
    },
    {
      "question": "Is sermorelin different from the other peptides?",
      "answer": "In one important way, yes: it can be handled inside a physician-supervised, licensed-pharmacy program, which is why it is the peptide we discuss publicly. It is a growth-hormone-releasing hormone analog with a coherent mechanism, but it is not a proven performance shortcut and it is prohibited in tested sport. The advantage is legitimacy and monitoring, not a guaranteed result."
    }
  ],
  "perimenopause-or-low-desire-reading-the-signals": [
    {
      "question": "Does perimenopause cause low libido?",
      "answer": "It can, but usually indirectly. The menopause transition more often lowers desire through its other effects — disrupted sleep, mood changes, hot flashes, and vaginal dryness that makes sex uncomfortable — than through hormones acting directly on desire. That is why treating the sleep, mood, or dryness often does more for desire than a desire-specific medication. An evaluation is what tells you which is which."
    },
    {
      "question": "How do I know if my low libido is hormonal or psychological?",
      "answer": "Usually it is some of both, and that is not a contradiction. Hormones, medications, and health conditions shape the biology; stress, mood, sleep, and the relationship shape the context. A good evaluation looks at both — labs read against your symptoms and history — rather than forcing a single explanation, because the mix is different for each person."
    },
    {
      "question": "Can a blood test tell me if perimenopause is affecting my sex drive?",
      "answer": "Labs help, but no single number decides it. Hormone levels swing week to week during the transition, so a physician reads sex hormones, thyroid, prolactin, and iron together and against the pattern of your symptoms — cycles, sleep, mood, and what specifically bothers you — rather than treating one value as the answer."
    },
    {
      "question": "Is low desire in women actually treatable?",
      "answer": "In most cases, yes. Low desire usually has one or more identifiable contributors — hormonal, medical, medication-related, or relational — and addressing the cause often improves it. \"Treatable\" does not always mean a pill; sometimes it means treating vaginal dryness, adjusting a medication, or fixing sleep. The first step is an evaluation, not acceptance."
    },
    {
      "question": "Is there an FDA-approved medication for low desire in women?",
      "answer": "Yes. Two medications are FDA-approved for premenopausal women with acquired, generalized low desire: bremelanotide (an as-needed injection) and flibanserin (a daily oral medication taken at bedtime that carries a boxed warning against combining it with alcohol, which can cause dangerously low blood pressure and fainting). Both have modest effects and specific side-effect profiles, so they suit some women and not others. Low-dose testosterone is used off-label for this indication under monitoring, with the strongest evidence in postmenopausal women. A physician can help judge fit."
    },
    {
      "question": "My antidepressant may be lowering my desire. What can I do?",
      "answer": "Antidepressant-related low desire is common and often reversible. Do not stop the medication on your own. Options a clinician may consider include adjusting the dose, switching to an antidepressant less likely to affect desire, or adding a second medication that can offset the effect — a conversation to have with whoever manages that prescription."
    }
  ],
  "semaglutide-vs-tirzepatide-comparison-guide": [
    {
      "question": "Is tirzepatide or semaglutide better for weight loss?",
      "answer": "On average, tirzepatide produced more weight loss in the first head-to-head trial — about 20% versus 14% of body weight over 72 weeks. But these are group averages; individual response and tolerability vary, and many people do very well on semaglutide. The better choice depends on your health history, side-effect experience, and goals, which is a clinical decision."
    },
    {
      "question": "What is the actual difference between the two?",
      "answer": "Semaglutide acts on one gut-hormone pathway (GLP-1). Tirzepatide acts on two (GIP and GLP-1). Engaging two complementary pathways appears to produce a somewhat stronger average effect on appetite and weight, which is consistent with the head-to-head data — but it is not a guarantee for any individual."
    },
    {
      "question": "Will I lose muscle on either medication?",
      "answer": "Some of the weight lost on any GLP-1 medication can be lean tissue — estimates range from about 25% to 40%. That is largely preventable with adequate protein (roughly 1.2 to 2.0 grams per kilogram per day for most people losing weight) and resistance training at least twice weekly. Muscle preservation is one of the strongest arguments for a monitored plan."
    },
    {
      "question": "Can I switch from semaglutide to tirzepatide?",
      "answer": "Many people do, usually when weight loss stalls or side effects are hard to tolerate. Switching is a clinical decision that involves re-starting titration at an appropriate dose, not simply swapping one for the other at an equivalent dose. A physician should guide the transition and monitoring."
    },
    {
      "question": "Now that Medicare covers a brand-name option, is brand better than what a telehealth clinic prescribes?",
      "answer": "\"Brand\" and \"telehealth\" are not opposites — the question is which specific medication and pathway fit you, and whether your care is monitored. Coverage and cost are real factors worth discussing with a clinician, but they are separate from the clinical choice of molecule, dose, and monitoring. There is no single answer that applies to everyone."
    },
    {
      "question": "How do I know which one is right for me?",
      "answer": "Start with an evaluation. Your weight-loss goal, medical history, contraindications (such as a personal or family history of medullary thyroid cancer or MEN 2), prior experience with these medications, and tolerance all feed the decision. A physician review — with baseline labs — turns \"which one is better\" into \"which one is better for you.\""
    }
  ],
  "recovery-peptides-anti-doping-sourcing-guide": [
    {
      "question": "Are recovery peptides banned in sports?",
      "answer": "For tested athletes, most are. BPC-157 (WADA S0), thymosin beta-4 / TB-500 (S2), and — also under S2 — both the growth-hormone-releasing hormone analogs (such as sermorelin and CJC-1295) and the growth-hormone secretagogues (such as ipamorelin and MK-677) are prohibited at all times under the WADA Prohibited List. If you are subject to testing by WADA, USADA, the NCAA, or a compliant body, treat the category as off-limits unless you have confirmed otherwise."
    },
    {
      "question": "Is BPC-157 approved or proven to work?",
      "answer": "No. BPC-157 is not an FDA-approved drug, and the evidence for tendon and tissue healing comes almost entirely from animal studies. There are no adequate human trials establishing safety and effectiveness in athletes. It is also prohibited in sport and is among the compounds the FDA has proposed keeping off its compounding list."
    },
    {
      "question": "Why does \"research use only\" matter if I can still buy it?",
      "answer": "Because that label means the product was never made or tested as a medicine for people. Grey-market vials have been found to contain inaccurate doses, impurities, and contaminants. You have no way to verify purity or sterility by looking, which is the risk a licensed pharmacy and physician oversight are designed to remove."
    },
    {
      "question": "Is sermorelin allowed in sport since a doctor can prescribe it?",
      "answer": "No. A prescription does not change anti-doping status. Sermorelin is a growth-hormone-releasing hormone analog and is on the WADA S2 list, prohibited at all times. If you compete in a tested sport, sermorelin is not a permitted option, and a responsible provider will tell you that before prescribing."
    },
    {
      "question": "What is the FDA deciding about peptides in July 2026?",
      "answer": "On July 23-24, 2026, the FDA's Pharmacy Compounding Advisory Committee is reviewing several peptides — including BPC-157 — for the list that authorizes their compounding. The FDA's briefing documents recommend against adding them. It is an advisory step, not a final rule, but it signals that legitimate access to many of these compounds is narrowing."
    },
    {
      "question": "If I don't compete, are these safe to use?",
      "answer": "Not competing removes the anti-doping issue, but not the safety and evidence issues. The human data are limited for most of these compounds, and grey-market sourcing adds real risk. If you are considering any peptide, the safer path is a physician evaluation with labs and a licensed pharmacy — not a vial from an unverified vendor."
    }
  ],
  "low-libido-in-women-causes-evaluation-guide": [
    {
      "question": "Is low libido in women actually treatable?",
      "answer": "In most cases, yes. Low desire usually has one or more identifiable contributors — hormonal, medical, medication-related, or relational — and addressing the cause often improves it. \"Treatable\" does not always mean a pill; sometimes it means adjusting a medication, treating pain, or improving sleep. The first step is an evaluation, not acceptance."
    },
    {
      "question": "Does low testosterone cause low libido in women?",
      "answer": "It can contribute, but it is rarely the whole story. Testosterone plays a role in women's desire, and low-dose testosterone has a moderate, evidence-supported effect on HSDD — mainly studied in postmenopausal women. But desire also depends on estrogen, thyroid function, medications, mood, sleep, and comfort, which is why testing comes before assuming hormones are the cause."
    },
    {
      "question": "Is there an FDA-approved medication for low desire in women?",
      "answer": "Yes. Two medications are FDA-approved for premenopausal women with acquired, generalized hypoactive sexual desire disorder: bremelanotide (an as-needed injection) and flibanserin (a daily oral medication). Both have modest effects and specific side-effect profiles, so they suit some women and not others. Where one is appropriate, it is used only inside a physician-supervised program after an evaluation — not sold off the shelf — and a physician can help judge fit."
    },
    {
      "question": "My antidepressant may be lowering my sex drive. What can I do?",
      "answer": "Antidepressant-related low desire is common and often reversible. Do not stop the medication on your own. Options a clinician may consider include adjusting the dose, switching to an antidepressant less likely to affect desire, or adding a second medication that can offset the effect. This is a conversation to have with whoever manages that prescription."
    },
    {
      "question": "Is low desire a medical problem or a psychological one?",
      "answer": "Usually both, in some proportion — and that is not a contradiction. Hormones, medications, and health conditions shape the biology; stress, mood, and the relationship shape the context. A good evaluation looks at both rather than forcing a single explanation, because the mix is different for each person."
    },
    {
      "question": "How is this evaluated if I do it through telehealth?",
      "answer": "A thorough remote evaluation combines a detailed history and symptom review with baseline lab work drawn locally, then a physician reviews the results with you before any therapy is considered. The privacy of an online visit is, for many women, easier than raising the topic in a rushed in-person appointment."
    }
  ],
  "when-the-scale-stops-moving-in-menopause-why-weight-and-hormones-belong-in-one-plan": [
    {
      "question": "I haven't changed how I eat — why am I gaining weight in menopause?",
      "answer": "Because the hormonal shift itself changes your physiology. Falling estrogen moves fat storage toward the abdomen and lowers energy expenditure, so the same habits produce more weight gain and more belly fat than they used to. It is a measurable biological change, not a discipline problem (Lovejoy 2008; Greendale 2019)."
    },
    {
      "question": "Does a GLP-1 medication interact with my hormone therapy?",
      "answer": "It can affect oral hormones. GLP-1 medications slow stomach emptying and can reduce absorption of oral estrogen — the Mounjaro/Zepbound prescribing information reports that a single 5-mg tirzepatide dose reduced peak levels of ethinyl estradiol, norgestimate, and norelgestromin by 59%, 66%, and 55% respectively (with total exposure down only 20–23%), which is why the label advises backup contraception for 4 weeks after starting and after each dose increase (Zepbound/Mounjaro USPI). Transdermal and vaginal estrogen bypass the gut and are not affected, which is one reason coordinating both with one physician matters."
    },
    {
      "question": "Will a GLP-1 change my face or make my hair shed?",
      "answer": "Both are linked to rapid weight loss rather than being unique drug effects. Facial-volume loss reflects loss of subcutaneous fat; hair shedding (usually temporary) is associated with very fast loss and low protein. A slower pace, adequate protein, and muscle preservation reduce both."
    },
    {
      "question": "Do GLP-1 medications work as well after menopause?",
      "answer": "Yes. These medications remain effective for women in midlife and after menopause — the pivotal weight-loss trials enrolled women across this age range (Wilding 2021; Jastreboff 2022). Some data even suggest pairing a GLP-1 with hormone therapy is associated with greater weight loss, though that finding is observational."
    },
    {
      "question": "Will I lose muscle or bone — and does menopause make that worse?",
      "answer": "Some of the weight lost on a GLP-1 can be lean tissue (estimates range about 25-40%), and menopause already accelerates bone loss, so the two can compound. Adequate protein, resistance training, and a slower rate of loss are the evidence-aligned ways to protect muscle and bone during treatment."
    },
    {
      "question": "Do I have to take a GLP-1 forever?",
      "answer": "Not necessarily, but stopping is a managed decision. These medications work while they are taken; most people regain a meaningful portion of lost weight after stopping abruptly. A monitored plan handles the maintenance phase deliberately — dose adjustment, a supervised taper if appropriate, and continued attention to protein and training."
    },
    {
      "question": "Is it safer to manage weight and hormones with one doctor?",
      "answer": "It is more coordinated, which matters here. One physician can choose a route of hormone therapy that avoids the absorption interaction, monitor metabolic and bone health together, and protect muscle while you lose fat — decisions a single-category service is not set up to make."
    }
  ],
  "sleep-testosterone-and-recovery-the-triad-most-men-optimizing-hormones-overlook": [
    {
      "question": "Does lack of sleep really lower testosterone?",
      "answer": "Probably, at severe levels. One controlled study found a 10–15% decline after a week of 5-hour nights (n = 10); later work has not consistently replicated that effect for milder restriction, but total sleep loss and sleep-apnea-level fragmentation clearly lower testosterone (Leproult & Van Cauter 2011)."
    },
    {
      "question": "Can sleep apnea cause low testosterone?",
      "answer": "It is strongly associated with it. A 2023 meta-analysis of 24 studies found men with obstructive sleep apnea had significantly lower total testosterone than men without it (Wang et al. 2023). The relationship is confounded by body weight and is not proof of direct cause, but undiagnosed sleep apnea is a common, treatable contributor that a proper workup should screen for before reaching for therapy."
    },
    {
      "question": "Will more training raise my testosterone?",
      "answer": "Not always — and past a point it can do the opposite. Resistance training supports healthy testosterone over time, but high endurance volume without enough recovery can lower it. In one 18-week study, progressively increased running volume coincided with about half the men dropping into an androgen-deficient range, and levels recovered when training was reduced (Hackney & Hooper 2019). More is not better; appropriately dosed and recovered is better."
    },
    {
      "question": "Does the testosterone spike after lifting build muscle?",
      "answer": "The brief rise in testosterone after a hard workout has not been shown to be necessary for gaining muscle or strength (Hooper et al. 2017). Real hypertrophy comes from progressive training and adequate protein and recovery, not from chasing a transient hormonal bump. Be skeptical of anything sold on the promise of amplifying your post-workout spike."
    },
    {
      "question": "Can fixing my sleep and training get me out of the low range without therapy?",
      "answer": "Sometimes. For men whose low number is driven by short sleep, undiagnosed apnea, overtraining, or under-fueling, correcting those inputs and re-testing can move the result meaningfully. For others, the cause is age-related or physiological and lifestyle alone will not be enough. The only way to know which is which is to optimize the inputs first, then re-check with a proper morning panel."
    },
    {
      "question": "Do testosterone-boosting supplements work?",
      "answer": "Most do not, and the claims are increasingly scrutinized — the FTC has taken enforcement action against companies making unsubstantiated health claims (FTC 2026). The narrow exception is correcting a genuine deficiency: zinc and vitamin D can help if your levels are low, because you are fixing a deficit. Beyond that, the evidence for over-the-counter \"boosters\" is thin."
    },
    {
      "question": "How much sleep do I actually need for healthy testosterone?",
      "answer": "There is no single magic number, but the research consistently shows that routinely sleeping well under what an adult needs — the short, five-hour weeks that lowered testosterone in controlled studies — works against you. Aiming for adequate, consistent, good-quality sleep most nights is the realistic target, and persistent unrefreshing sleep despite enough time in bed is worth investigating for apnea."
    }
  ],
  "biological-age-and-longevity-lab-tests-what-the-evidence-actually-supports": [
    {
      "question": "Are biological age tests accurate?",
      "answer": "It depends entirely on which test. Markers like ApoB, lipoprotein(a), HbA1c, VO2 max, and grip strength have large, replicated studies linking them to real outcomes. The single-number \"biological age\" products — epigenetic clocks and telomere kits — are built on real science but, in their consumer form, have been reported to return inconsistent results across commercial providers and are not yet validated to guide an individual's decisions."
    },
    {
      "question": "Which lab tests actually matter for longevity?",
      "answer": "For cardiovascular and metabolic risk, the highest-evidence measures are ApoB, lipoprotein(a) (once in a lifetime), HbA1c, and fasting insulin. For overall resilience, cardiorespiratory fitness (VO2 max) and grip strength are among the most predictive measures in the literature — and both can be improved with training."
    },
    {
      "question": "Are direct-to-consumer lab panels worth it?",
      "answer": "They can be a reasonable starting point, and the trend toward affordable testing is a good one. The limitation is interpretation: a large panel produces data, not a plan, and an out-of-range value with no clinical context can create more worry than insight. The value comes from someone reading the results against your symptoms, history, and goals — and tracking them over time."
    },
    {
      "question": "What's the difference between ApoB and a standard cholesterol test?",
      "answer": "A standard panel estimates the amount of cholesterol in your LDL particles. ApoB counts the particles themselves — the actual number capable of entering an artery wall. When those two numbers disagree, which is common in people with diabetes or high triglycerides, ApoB is often the more accurate read on risk, which is why the 2026 ACC/AHA guideline now recommends it in those situations."
    },
    {
      "question": "How often should I get these labs done?",
      "answer": "It varies by marker. Lipoprotein(a) is largely genetic and stable, so once is usually enough. ApoB, HbA1c, and fasting insulin are worth rechecking when you change something — a medication, your training, your diet — to see whether it worked, typically every few months to once a year. A physician can set the right cadence for your situation rather than testing everything on a fixed schedule."
    },
    {
      "question": "Can I actually lower my biological age?",
      "answer": "You can improve most of the markers that matter: fitness, strength, ApoB, HbA1c, and fasting insulin all respond to training, nutrition, and, where appropriate, medication. Whether moving those markers changes a single \"biological age\" number, or changes how long you live, is a separate and less settled question. The reasonable goal is to improve the measures with outcome evidence behind them, not to chase a clock reading."
    },
    {
      "question": "Do I need a doctor to interpret the results?",
      "answer": "For a single screening number, not always. But the value of testing comes from context — knowing which result matters for you, what to do about it, and how it is trending. That interpretation, not the raw data, is where physician-led care differs from a standalone panel."
    }
  ],
  "stopping-glp-1-maintenance-decision-guide": [
    {
      "question": "Do I have to be on a GLP-1 forever?",
      "answer": "Not necessarily, but you should plan as if the answer could be \"for a long time.\" These medications manage weight while they are taken; for most people, appetite and weight return after stopping. Some people maintain on a low dose, some taper off successfully with strong lifestyle support, and the right path is an individual decision made with a clinician."
    },
    {
      "question": "How much weight will I regain if I stop?",
      "answer": "In the STEP 1 trial extension, people regained about two-thirds of their lost weight in the year after stopping semaglutide (Wilding 2022). That is an average from abrupt discontinuation — individual results vary, and a planned, supported step-down is less studied. The honest expectation is that some regain is likely without an active maintenance plan."
    },
    {
      "question": "Is it bad to stop GLP-1 medication suddenly?",
      "answer": "For most people using GLP-1 therapy for weight management, stopping abruptly is not medically dangerous in the way missing a cardiac medication can be — but it is the version most associated with rapid regain and the return of cardiometabolic risk factors toward baseline. For anyone using a GLP-1 for type 2 diabetes, or in combination with insulin or a sulfonylurea, do not stop without coordinating with the prescribing clinician, because blood-sugar control can shift quickly."
    },
    {
      "question": "Can I take a break and restart later?",
      "answer": "Many people do pause and restart, often around cost, supply, or life events. The main thing to expect is that the appetite-suppressing effect fades during the break and weight may climb, then returns when you resume. Restarting usually means re-titrating from a lower dose to manage side effects, which is a conversation to have with your prescriber rather than a do-it-yourself decision. Restarting also means confirming with your clinician that you are receiving an FDA-approved product appropriate for your situation."
    },
    {
      "question": "Will I lose muscle when I stop?",
      "answer": "The bigger muscle risk is during active weight loss, when a meaningful share of what you lose is lean tissue. When you stop, the concern shifts to what regained weight is made of. Keeping protein high (roughly 1.2–1.6 g/kg per day) and resistance training at least twice a week is the best-supported way to protect muscle through the transition."
    },
    {
      "question": "What is a GLP-1 maintenance dose?",
      "answer": "It is the lowest dose that holds your result with the fewest side effects, used once you have reached your goal rather than to keep losing. There is no single correct number — it is set individually and adjusted over time, which is exactly the kind of decision that benefits from ongoing monitoring rather than a fixed prescription."
    },
    {
      "question": "I'm on hormone therapy — does that change how a GLP-1 works?",
      "answer": "There is no good randomized evidence that hormone therapy and GLP-1 medications interfere with each other, and in practice they are often managed together — particularly in perimenopause, when shifting hormones and metabolic changes overlap. What matters is that one clinician oversees both, so dosing, labs, and side effects are read as a single plan rather than in isolation."
    }
  ],
  "daily-tadalafil-sexual-health-cardiovascular-benefits": [
    {
      "question": "Can tadalafil be taken daily?",
      "answer": "Yes. Daily dosing at 2.5mg or 5mg is FDA-approved for both ED and BPH. It is the most common form of long-term tadalafil therapy in clinical practice."
    },
    {
      "question": "Does daily tadalafil protect the heart?",
      "answer": "A 2024 study of over one million men found PDE5 inhibitor use, including tadalafil, was associated with significant reductions in mortality, heart attack, and stroke. The association is strong and mechanistically plausible, but tadalafil is not currently FDA-approved as a cardiovascular medication."
    },
    {
      "question": "What is the difference between tadalafil and sildenafil?",
      "answer": "Both are PDE5 inhibitors. Sildenafil has a 4-hour half-life and is taken as needed; tadalafil's 17.5-hour half-life makes daily low-dose use practical and reduces timing anxiety. Tadalafil also has FDA approval for benign prostatic hyperplasia."
    },
    {
      "question": "Will I become dependent on tadalafil?",
      "answer": "Tadalafil does not cause physical dependence. Some men develop a psychological reliance — feeling like they need it to perform — which is worth discussing with a physician. It can usually be addressed alongside the medication, not by stopping it."
    },
    {
      "question": "Can I take tadalafil with blood pressure medication?",
      "answer": "Most antihypertensives are compatible with tadalafil at low doses, but the combination requires physician oversight to avoid dose stacking. The exception is nitrate medications, which are an absolute contraindication."
    },
    {
      "question": "Does ED always mean low testosterone?",
      "answer": "No, but low testosterone is a common contributor and is worth checking. The two often coexist and are best evaluated together rather than independently."
    }
  ],
  "sermorelin-peptide-therapy-guide": [
    {
      "question": "What does sermorelin do?",
      "answer": "Sermorelin stimulates your pituitary gland to produce and release more of your body's own growth hormone. It works through your natural regulatory system rather than bypassing it the way injected HGH does."
    },
    {
      "question": "Is sermorelin the same as HGH?",
      "answer": "No. HGH is the growth hormone itself. Sermorelin is a signal that tells your body to make more of its own growth hormone. The downstream hormone is the same; the regulatory pathway is different — and that difference matters for both safety and effect size."
    },
    {
      "question": "How long does sermorelin take to work?",
      "answer": "Sleep changes are often noticed in the first 2–4 weeks. Body composition changes typically develop over 2–4 months. Full benefit is usually established by month 4."
    },
    {
      "question": "Is sermorelin FDA-approved?",
      "answer": "Sermorelin was FDA-approved in 1997 (Geref) and voluntarily withdrawn in 2008 for business reasons — not for safety or efficacy concerns. It is currently available only through 503A compounding pharmacies with a physician's prescription."
    },
    {
      "question": "Can women take sermorelin?",
      "answer": "Yes. Sermorelin is not gender-specific. The same growth hormone decline happens in women with age, and sermorelin can be appropriate as part of an individualized plan."
    },
    {
      "question": "Will sermorelin help me lose belly fat?",
      "answer": "Modestly, over time. Sermorelin is not a weight loss medication, but the increase in growth hormone signaling supports lean mass and can contribute to gradual body composition improvements over months."
    }
  ],
  "pt-141-bremelanotide-sexual-health-guide": [
    {
      "question": "How is PT-141 different from PDE5 inhibitors?",
      "answer": "PT-141 works on brain pathways involved in sexual desire and arousal. PDE5 inhibitors work on blood flow. The two address different parts of the sexual response cycle and can be complementary in some patients."
    },
    {
      "question": "Is PT-141 FDA-approved?",
      "answer": "Yes, but only for one indication: hypoactive sexual desire disorder in premenopausal women, under the brand name Vyleesi. Use in men and in postmenopausal women is off-label, supported by clinical trial data but not formally approved."
    },
    {
      "question": "What does the nausea feel like and how bad is it?",
      "answer": "About 40% of users experience some nausea, usually peaking 30–60 minutes after injection. It can range from mild to significant, and it is dose-related. Lower starting doses, anti-nausea pre-treatment, and timing the dose appropriately can reduce its impact."
    },
    {
      "question": "Can men take PT-141?",
      "answer": "Yes, off-label. Clinical trials in men have shown meaningful response rates at doses above 7 mg, particularly in non-responders to PDE5 inhibitors. A physician evaluation is the standard before starting."
    },
    {
      "question": "Can PT-141 be combined with tadalafil?",
      "answer": "Yes, and the combination has been studied in men with partial response to PDE5 inhibitors alone. Combining the two works through complementary mechanisms (brain and vascular) and is a reasonable approach for some patients."
    },
    {
      "question": "How long do the effects last?",
      "answer": "Effects typically begin within 30–60 minutes and may persist anywhere from 6 to 24 hours depending on individual response. Duration varies more than with PDE5 inhibitors."
    }
  ],
  "nad-plus-injectable-oral-evidence-guide": [
    {
      "question": "What does NAD+ do in the body?",
      "answer": "NAD+ is a coenzyme essential for energy metabolism, DNA repair, and sirtuin function. Every cell uses it. Levels decline with age, which is the rationale behind supplementation."
    },
    {
      "question": "Is injectable NAD+ more effective than oral NMN or NR?",
      "answer": "Pharmacologically, injectable NAD+ bypasses first-pass metabolism and delivers the molecule in its active form. Patient-reported outcomes are often more consistent. Head-to-head randomized trials directly comparing the two for specific clinical outcomes do not exist at scale, so the honest answer is pharmacology-supported, RCT-pending."
    },
    {
      "question": "Can I take NAD+ with glutathione?",
      "answer": "Yes, and they are often used together. The mechanism is complementary — NAD+ supports energy production; glutathione supports the antioxidant defense that protects the cells doing that work. There is no formal trial of the combination, but the pairing is biologically coherent."
    },
    {
      "question": "How quickly should I expect to feel something from NAD+?",
      "answer": "Most people who notice changes notice them gradually over weeks. Some notice nothing at all. The lack of predictable, dramatic short-term effect is part of why NAD+ supplementation works best as part of a monitored wellness plan rather than as a standalone purchase."
    },
    {
      "question": "Is NAD+ proven to extend lifespan?",
      "answer": "No. Animal studies show NAD+ pathway activation can extend lifespan in model organisms. Human evidence for lifespan extension does not exist and probably cannot in the time horizon of a typical trial. We do not make lifespan claims; we describe what the mechanism plausibly supports."
    },
    {
      "question": "Are there people who should not take NAD+?",
      "answer": "NAD+ is generally well tolerated, but people with active cancer, severe kidney or liver disease, or significant cardiovascular instability should discuss it with a physician before starting. Pregnancy and lactation are also typical exclusions."
    }
  ],
  "injectable-l-glutathione-antioxidant-guide": [
    {
      "question": "Does oral glutathione actually work?",
      "answer": "Standard oral glutathione capsules are largely broken down in the gut before absorption, and studies show minimal increase in blood glutathione. Liposomal forms do better. NAC, the oral precursor, is what actually and reliably raises intracellular glutathione in humans."
    },
    {
      "question": "Why is injectable glutathione more effective than oral?",
      "answer": "It bypasses gut breakdown and delivers the molecule intact into circulation. Patient-reported outcomes in clinical practice are correspondingly more consistent."
    },
    {
      "question": "Does glutathione actually whiten skin?",
      "answer": "Glutathione inhibits the enzyme involved in melanin production, and skin lightening is a known side effect of injectable glutathione. We do not prescribe it for cosmetic skin lightening; we acknowledge the mechanism honestly when patients ask."
    },
    {
      "question": "How often would I need injections?",
      "answer": "A typical subcutaneous protocol is 2–3 times per week, often paired with NAD+ in the same session. Frequency is adjusted based on individual response, baseline labs, and the specific indication."
    },
    {
      "question": "Can I take glutathione with NAD+?",
      "answer": "Yes, and they are commonly prescribed together. The pairing supports energy production (NAD+) and antioxidant defense (glutathione) — two pathways that depend on each other."
    },
    {
      "question": "Is glutathione safe?",
      "answer": "Injectable glutathione has a strong safety record in physician-supervised use. The main considerations are individual sensitivities and the appropriate clinical indication for use — not a high-risk side effect profile."
    }
  ],
  "glp-1-medications-weight-management-guide": [
    {
      "question": "How do GLP-1 medications work for weight loss?",
      "answer": "They mimic a natural gut hormone (GLP-1) that signals fullness, slows gastric emptying, and reduces the appetite-drive in the brain. The net effect is meaningful caloric reduction without the constant willpower fight that defines most diets."
    },
    {
      "question": "Is compounded semaglutide still available in 2026?",
      "answer": "Only in specific medical-necessity circumstances — for example, a documented allergy to an inactive ingredient or a dose not commercially available. The shortage designation that allowed broad compounding has ended, and the FDA has actively enforced against marketing practices that implied compounded versions are equivalent to brand-name medications."
    },
    {
      "question": "Is tirzepatide better than semaglutide?",
      "answer": "Head-to-head data shows somewhat greater average weight reduction with tirzepatide over 72 weeks. Both produce meaningful results. The right starting medication depends on your individual picture, insurance coverage, and tolerance — not on a universal ranking."
    },
    {
      "question": "How do I prevent muscle loss on a GLP-1?",
      "answer": "Hit a higher protein intake than is typical (approximately 1.2–1.6 g/kg body weight per day), do resistance training at least twice weekly, and aim for sustainable rather than maximum weight loss rate. A program that does not actively address muscle preservation is leaving real risk on the table."
    },
    {
      "question": "What happens when you stop GLP-1 medications?",
      "answer": "Most people regain a substantial portion of the weight they lost over 12–18 months after stopping. The signaling the medication provided goes away when the medication does. Maintenance therapy is increasingly the clinical model for obesity, similar to chronic treatment of other metabolic conditions."
    },
    {
      "question": "How much weight do people lose on GLP-1 medications?",
      "answer": "In randomized trials, average weight reduction over 68–72 weeks has been approximately 14–15% with semaglutide and approximately 20% with tirzepatide. Individual results vary widely around those averages."
    }
  ]
};
