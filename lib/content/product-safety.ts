import type { SafetySection } from "@/components/SafetyInformationModal";

const CLOSING_LINE =
  "This is not a complete list of risks. Read the information that comes with your medicine and talk with your prescriber or pharmacist about your health conditions and other medicines. Call your prescriber about any side effect. You can also report side effects to FDA at 1-800-FDA-1088 or www.fda.gov/medwatch. For a medical emergency, call 911.";

function safetyBox(
  sections: { heading: string; paragraphs?: string[]; items?: string[] }[],
): SafetySection[] {
  return [
    ...sections.map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs ?? [],
      ...(section.items ? { items: section.items } : {}),
    })),
    { heading: "", paragraphs: [CLOSING_LINE] },
  ];
}

const semaglutideInjection = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "In rodents, semaglutide caused thyroid tumors, including medullary thyroid carcinoma. It is not known whether this happens in people. Do not use if you or a family member has had medullary thyroid carcinoma, or if you have Multiple Endocrine Neoplasia syndrome type 2. Tell your prescriber right away about a neck lump, trouble swallowing, or lasting hoarseness. This warning comes from the FDA approved semaglutide products.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You or a family member has had medullary thyroid carcinoma, or you have Multiple Endocrine Neoplasia syndrome type 2.",
      "You have had a serious allergic reaction to semaglutide, vitamin B12, or cobalt.",
      "You are pregnant. Stop at least 2 months before trying to conceive.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have had pancreatitis, gallbladder disease, or kidney disease.",
      "You take insulin or a sulfonylurea. Low blood sugar is more likely.",
      "You have gastroparesis or diabetic eye disease.",
      "You are planning surgery or a procedure with anesthesia. This medicine slows stomach emptying, which matters for anesthesia.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Nausea, diarrhea, vomiting, constipation, stomach pain, headache, tiredness, indigestion, bloating, reflux, and injection site reactions. In trials of approved semaglutide, about 4 in 10 people had nausea.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Severe or constant stomach pain that may spread to your back (possible pancreatitis).",
      "Pain in the upper right belly, yellow skin or eyes, fever, or clay colored stools.",
      "Vomiting or diarrhea you cannot keep up with, or very little urine.",
      "Trouble breathing, swelling of the face, lips, or tongue, hives, or faintness.",
      "Low blood sugar with sweating, shaking, or confusion, or a racing heartbeat at rest.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood sugar if you have diabetes. Heart rate at visits. Kidney function after any bout of vomiting or diarrhea. Pregnancy status.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this for you. It is not FDA approved and is not a generic of any approved semaglutide. No approved product combines semaglutide with vitamin B12, and FDA has said the safety of that combination has not been established. Your dose is measured in milligrams. Do not measure it in insulin units.",
    ],
  },
]);

const tirzepatideInjection = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "In rats, tirzepatide caused thyroid tumors, including medullary thyroid carcinoma. It is not known whether this happens in people. Do not use if you or a family member has had medullary thyroid carcinoma, or if you have Multiple Endocrine Neoplasia syndrome type 2. Tell your prescriber right away about a neck lump, trouble swallowing, or lasting hoarseness. This warning comes from the FDA approved tirzepatide products.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You or a family member has had medullary thyroid carcinoma, or you have Multiple Endocrine Neoplasia syndrome type 2.",
      "You have had a serious allergic reaction to tirzepatide, vitamin B12, or cobalt.",
      "You are pregnant.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have had pancreatitis, gallbladder disease, or kidney disease.",
      "You take insulin or a sulfonylurea.",
      "You have gastroparesis or diabetic eye disease.",
      "You take birth control pills. This medicine can lower how much of the pill you absorb; use a non oral or barrier method for 4 weeks after starting and after each dose increase.",
      "You are planning surgery or a procedure with anesthesia.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Nausea, diarrhea, constipation, vomiting, stomach pain, indigestion, injection site reactions, tiredness, hair loss, reflux, dizziness, and low blood pressure. In trials of approved tirzepatide, about 1 in 4 people had nausea.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Severe or constant stomach pain that may spread to your back.",
      "Pain in the upper right belly, yellow skin or eyes, fever, or clay colored stools.",
      "Vomiting or diarrhea you cannot keep up with, or very little urine.",
      "Trouble breathing, swelling of the face, lips, or tongue, hives, or faintness.",
      "Low blood sugar with sweating, shaking, or confusion, or fainting when you stand.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood sugar if you have diabetes. Kidney function after vomiting or diarrhea. Blood pressure and dizziness on standing. Pregnancy status and contraception.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this for you. It is not FDA approved and is not a generic of any approved tirzepatide. No approved product combines tirzepatide with vitamin B12. FDA has reported dosing errors with compounded GLP-1 medicines of five to twenty times the intended dose, usually from confusing insulin syringe units with milligrams. Your dose is measured in milligrams.",
    ],
  },
]);

const tadalafil = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You take any nitrate medicine, regularly or once in a while, including nitroglycerin, isosorbide, and amyl nitrite (poppers).",
      "You take riociguat or another guanylate cyclase stimulator.",
      "You have had a serious allergic reaction to tadalafil.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "Your heart condition makes sex inadvisable, or you have had a heart attack in the last 90 days, a stroke or heart failure in the last 6 months, an uncontrolled irregular heartbeat, or blood pressure that is very low or uncontrolled.",
      "You take an alpha blocker such as tamsulosin, or other blood pressure medicines.",
      "You have sickle cell anemia, multiple myeloma, leukemia, or a bent or scarred penis.",
      "You have had sudden vision loss in one eye, or you have kidney or liver problems. Your maximum dose may be lower.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Headache, indigestion, back pain, muscle aches, stuffy nose, and flushing. Back pain or muscle ache usually starts 12 to 24 hours after a dose and clears within 48 hours. Headache affected about 1 in 7 people in trials.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "An erection lasting longer than 4 hours, painful or not.",
      "Chest pain during or after sex, or fainting.",
      "Sudden loss of vision in one or both eyes.",
      "Sudden decrease or loss of hearing, with or without ringing or dizziness.",
      "Rash with blistering or peeling, or swelling of the face, lips, or tongue.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "No routine lab monitoring. Your prescriber assesses your heart status before you start and checks kidney and liver function, which set your maximum dose. Nitrates and riociguat must never be combined with this medicine. Ritonavir, ketoconazole, itraconazole, erythromycin, and grapefruit juice raise tadalafil levels. Do not combine with other erectile dysfunction medicines.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "This medicine is dispensed as an FDA approved product, so FDA has reviewed its safety, quality, and labeling. It is not compounded. Take the whole tablet; do not split it.",
    ],
  },
]);

const mensComboTroches = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You take any nitrate medicine, in any form, regularly or occasionally, including nitroglycerin and amyl nitrite (poppers).",
      "You take riociguat or another guanylate cyclase stimulator.",
      "You have uncontrolled high blood pressure or known cardiovascular disease (the blend containing PT-141).",
      "You have had a serious allergic reaction to sildenafil, tadalafil, oxytocin, cobalt, vitamin B12, or any ingredient in the troche.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "Your heart condition makes sex inadvisable, or you have had a heart attack, stroke, or serious irregular heartbeat in the past 6 months.",
      "You take an alpha blocker or other blood pressure medicine, or you drink heavily.",
      "You have sickle cell disease, multiple myeloma, leukemia, or a bent or scarred penis.",
      "You have had sudden vision loss in one eye, or you have kidney or liver problems.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No side effect rates exist for these troches. From the approved forms of the ingredients: headache, flushing, indigestion, a color tinge to vision, stuffy nose, back pain, dizziness, and nausea. In trials of approved bremelanotide injection, about 4 in 10 people had nausea.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "An erection lasting longer than 4 hours.",
      "Chest pain, fainting, or severe dizziness.",
      "Sudden loss of vision in one or both eyes, or sudden hearing loss.",
      "Severe headache, confusion, or vision changes, which can signal a large rise in blood pressure from PT-141.",
      "Headache with confusion, drowsiness, severe vomiting, or a seizure, which can signal water intoxication from oxytocin.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood pressure and heart status before starting and whenever a blood pressure medicine changes. PT-141 raises blood pressure for a few hours after each dose. Alpha blockers, other blood pressure medicines, and alcohol add to blood pressure lowering. PT-141 slows stomach emptying and should be avoided with oral naltrexone.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes these troches for you. They are not FDA approved, and how much of each ingredient is absorbed from a troche has not been established. They are not generics of Viagra, Cialis, Vyleesi, or any approved product. Approved bremelanotide is labeled for premenopausal women only and states it is not indicated for men or to enhance sexual performance.",
    ],
  },
]);

const womensComboTroches = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have uncontrolled high blood pressure or known cardiovascular disease.",
      "You take any nitrate medicine, or riociguat.",
      "You have had a serious allergic reaction to tadalafil, oxytocin, or bremelanotide.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You are at high cardiovascular risk. Bremelanotide raises blood pressure after each dose.",
      "You take an alpha blocker or other blood pressure medicine, or you drink heavily.",
      "You have kidney disease with eGFR under 30, or severe liver disease.",
      "You take naltrexone by mouth, or oral antibiotics or other medicines that need to work quickly.",
      "You are pregnant or could become pregnant.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No side effect rates exist for this troche. With approved bremelanotide injection: nausea (about 4 in 10), flushing, headache, vomiting, hot flush, tingling, and dizziness. About 1 in 5 people stopped because of side effects.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Severe headache, chest pain, vision changes, or confusion, which can signal a large rise in blood pressure.",
      "Fainting, severe dizziness, or vomiting that will not stop.",
      "Yellow eyes or skin, dark urine, or upper right belly pain.",
      "New dark patches on the face, gums, or breasts. These may not fully fade.",
      "Cramping or bleeding if you are or could be pregnant.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood pressure before starting and periodically. Follow the approved product's limits: no more than one dose in 24 hours, no more than 8 doses a month, and a review after 8 weeks. Skin and gum checks for new pigment changes.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this troche for you. It is not FDA approved, and how much of each ingredient is absorbed from the mouth has not been established. It is not a generic of Vyleesi, Cialis, or any approved product. Tadalafil has no FDA approved use in women. Approved bremelanotide is an injection, and its label states it is not indicated for postmenopausal women.",
    ],
  },
]);

const pt141Nasal = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have uncontrolled high blood pressure or known cardiovascular disease.",
      "You are pregnant or think you might be. Use effective contraception and stop if pregnancy is suspected.",
      "You have had a serious allergic reaction to bremelanotide or any ingredient in the spray.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You are at high cardiovascular risk, or your blood pressure is not well controlled.",
      "You have kidney disease with eGFR under 30, or severe liver disease.",
      "You take naltrexone by mouth, or oral antibiotics or other medicines that need to work quickly.",
      "You have darker skin or a history of skin pigment changes.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No side effect rates exist for a nasal spray. With the approved injection: nausea (about 4 in 10), flushing, headache, vomiting, cough, tiredness, hot flush, tingling, dizziness, and nasal congestion.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Severe headache, chest pain, shortness of breath, vision changes, or confusion, which can signal a large rise in blood pressure.",
      "Fainting, or vomiting with signs of dehydration.",
      "Yellow eyes or skin, dark urine, or upper right belly pain.",
      "Dark patches spreading on the face, gums, or breasts.",
      "A heavy nosebleed or severe nose pain after a dose.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood pressure before starting and periodically. The approved product's limits apply: no more than one dose in 24 hours, no more than 8 doses a month, and a review after 8 weeks. Avoid oral naltrexone; bremelanotide can reduce how much is absorbed. Bremelanotide raises blood pressure while PDE5 inhibitors and alcohol lower it; the net effect has not been established.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this spray for you. It is not FDA approved and is not a generic of Vyleesi. The only approved bremelanotide is an injection for premenopausal women with a specific diagnosis; its label states it is not indicated for men, not for postmenopausal women, and not to enhance sexual performance. A nasal milligram number and an injected milligram number are not comparable.",
    ],
  },
]);

const trimix = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have sickle cell anemia or trait, multiple myeloma, or leukemia. These make a prolonged erection more likely.",
      "Your penis is bent or scarred, including Peyronie's disease, or you have a penile implant.",
      "You have had an allergic reaction to alprostadil, papaverine, or phentolamine.",
      "Sex is inadvisable for you because of a heart condition.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You take warfarin, heparin, or another blood thinner. You may bleed more at the injection site.",
      "You take blood pressure medicines, alpha blockers, or nitrates, or you drink alcohol.",
      "You have liver disease. Papaverine has caused liver inflammation.",
      "You have glaucoma.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Rates come from approved alprostadil alone, not this combination: penile pain (about 4 in 10), prolonged erection, scarring or curving of the penis, and bruising at the injection site. Papaverine can cause flushing, sweating, headache, nausea, dizziness, and a faster heartbeat.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Any erection lasting longer than 4 hours, painful or not. Untreated, it can permanently damage the penis.",
      "New or worsening penile pain, a lump or hard tissue, curving of the erect penis, redness, or swelling. Stop and call your prescriber.",
      "Bleeding that will not stop, or a needle that breaks off.",
      "Fainting, severe dizziness, chest pain, or a racing or irregular heartbeat.",
      "Yellow eyes or skin, dark urine, or belly pain with nausea.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "First doses are adjusted in a clinician's office, and you stay until the erection resolves. Examination of the penis at the start and about every three months for scarring, plaques, or curving; treatment stops if these develop. Do not mix this medicine with any other solution.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this injection for you. It is not FDA approved, and FDA has not reviewed its quality, sterility, or strength. The approved alprostadil label states there is no approved injectable treatment that combines multiple drugs for erectile dysfunction and no data on the safety of such combinations. Papaverine has no FDA approved product in the United States, and its own labeling warns against this use. Contamination or the wrong strength in a sterile injectable can cause serious injury.",
    ],
  },
]);

const oxytocinNasal = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You are pregnant. Oxytocin's known action is to contract the uterus.",
      "You have had an allergic reaction to oxytocin.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You could become pregnant. Use effective contraception and stop if you think you are pregnant.",
      "You drink large amounts of fluid, or take a medicine that can lower blood sodium, such as a thiazide diuretic, an SSRI, or desmopressin.",
      "You have heart disease, high blood pressure, or a history of irregular heartbeat.",
      "You use decongestants, stimulants, or migraine medicines. Severe high blood pressure has been reported when oxytocin followed a medicine that narrows blood vessels.",
      "You have nasal problems or frequent nosebleeds, or use other nasal sprays.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No side effect rates exist for a compounded nasal spray. Reported with the approved injection: nausea and vomiting, high blood pressure episodes, and irregular heartbeat.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Headache with confusion, drowsiness, severe nausea or vomiting, or a seizure. These can signal low blood sodium.",
      "Symptoms of very high blood pressure, chest pain, or a pounding or irregular heartbeat.",
      "The worst headache of your life.",
      "Belly or pelvic cramping, or any bleeding, if you are or may be pregnant.",
      "Rash, swelling of the face or throat, or trouble breathing.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Pregnancy status before and during use. Blood pressure. A blood sodium test if you develop headache, confusion, drowsiness, or persistent nausea.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this spray for you. It is not FDA approved. The only approved oxytocin product is a hospital injection for obstetric care, and there is no approved oxytocin product for any sexual health, mood, or bonding use. Published studies estimate that only about 11% of a nasal oxytocin dose reaches the bloodstream, with wide variation between people. Do not share this spray with anyone.",
    ],
  },
]);

const testosteroneCypionate = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have breast cancer, or known or suspected prostate cancer.",
      "You are pregnant. Testosterone can harm a female fetus.",
      "You have serious heart, liver, or kidney disease.",
      "You are allergic to testosterone cypionate or any ingredient, including benzyl alcohol or benzyl benzoate.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have high blood pressure. Testosterone can raise it, and this medicine is not recommended if yours is uncontrolled.",
      "You have an enlarged prostate or urinary symptoms, or you have had a blood clot.",
      "You want to father a child. Testosterone lowers sperm production, and infertility can last.",
      "You have sleep apnea, heart failure, or swelling in your legs.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Injection site pain, acne, oily skin, mood changes, higher or lower sex drive, breast enlargement or tenderness, headache, a higher red blood cell count, fluid retention, and more body or facial hair.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain, trouble breathing, coughing up blood, one sided weakness or numbness, trouble speaking, a sudden severe headache, or sudden vision loss.",
      "Swelling, pain, warmth, or redness in one leg (possible blood clot).",
      "An erection lasting more than 4 hours, or inability to urinate.",
      "Yellow skin or eyes, dark urine, or severe belly pain.",
      "A sudden severe mood change or thoughts of suicide.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Hemoglobin and hematocrit before starting, at about 3 to 6 months, then at least yearly. Testosterone level periodically. PSA and a prostate assessment before starting and periodically if you are at risk. Blood pressure at each visit. Lipids and liver tests periodically. If you take warfarin, your INR must be watched; insulin and other diabetes medicines may need adjusting.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "This medicine is dispensed as an FDA approved product, so FDA has reviewed its safety, quality, and labeling. It is not compounded. Testosterone is a Schedule III controlled substance. Check the container label when your order arrives: it must name testosterone cypionate, the strength, and the pharmacy that filled it. If the label does not match what you were prescribed, do not use it and call us.",
    ],
  },
]);

const mensTestosteroneCream = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Children have become virilized after contact with testosterone applied to someone else's skin. Reported effects include enlargement of the penis or clitoris, early pubic hair, aggressive behavior, and advanced bone age; some children did not fully recover. Wash your hands right after applying, let the site dry, cover it with clothing, and wash the site before skin to skin contact.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You have breast cancer, or known or suspected prostate cancer.",
      "You are a woman, and especially if you are pregnant. This product is for men.",
      "You are allergic to testosterone or any ingredient in the cream.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You live with children or have frequent skin contact with a partner.",
      "You have high blood pressure, heart failure, or swelling in your legs.",
      "You have an enlarged prostate or urinary symptoms, or you have had a blood clot.",
      "You want to father a child. Testosterone lowers sperm production.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Redness, itching, or dryness where you apply the cream, a rise in PSA, mood swings, higher blood pressure, and a higher red blood cell count.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain, trouble breathing, coughing blood, one sided weakness or numbness, trouble speaking, sudden vision loss, or a painful swollen leg.",
      "An erection lasting more than 4 hours, or inability to urinate.",
      "Yellow eyes or skin, or a severe mood change or thoughts of suicide.",
      "New or worsening loud snoring with daytime sleepiness.",
      "Any sign of testosterone exposure in a child or partner: unexpected pubic hair, genital enlargement, a deepening voice, acne, or aggressive behavior.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Hematocrit and hemoglobin before starting, at 3 to 6 months, then yearly. Testosterone level after several weeks of steady use, drawn at the time your prescriber specifies. PSA and prostate assessment if you are at risk. Lipids and liver tests periodically. Do not apply sunscreen, lotion, or other products to the application site unless told to.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this cream for you. It is not FDA approved and is not a generic of AndroGel, Fortesta, or Testim; approved topical testosterone products are gels and solutions, not creams. One published study of ten compounding pharmacies found significant variation in the measured testosterone content of finished creams. Testosterone is a Schedule III controlled substance no matter who prepares it.",
    ],
  },
]);

const enclomiphene = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You are allergic to clomiphene citrate or any ingredient in the capsule.",
      "You have liver disease or a history of liver problems.",
      "You have an untreated thyroid or adrenal condition, or a tumor of the pituitary gland.",
      "You are pregnant.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have high triglycerides. High triglycerides and pancreatitis have been reported with clomiphene citrate.",
      "You have had a blood clot or a stroke.",
      "You have a history of depression, anxiety, or another mental health condition.",
      "You have any eye condition, or your work depends on sharp vision or night driving.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No side effect rates exist for enclomiphene, and none exist in men. With clomiphene citrate in women: hot flashes, bloating, nausea, breast discomfort, visual symptoms such as blurring or spots, and headache.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Any blurred vision, flashes, spots, floaters, double vision, light sensitivity, or loss of vision. Stop the medicine and get an eye exam promptly.",
      "Chest pain, shortness of breath, coughing blood, a painful swollen leg, one sided weakness, trouble speaking, a seizure, fainting, or a sudden severe headache.",
      "Severe belly pain, or severe or lasting vomiting.",
      "Yellow skin or eyes, or dark urine.",
      "Severe depression, thoughts of suicide, or a break from reality.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Vision review at every contact; stop the medicine and get a full eye exam if any visual symptom appears. Liver enzymes at baseline and periodically. Interaction studies have not been done; alcohol and other medicines that affect the liver add liver risk.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this capsule for you. It is not FDA approved, and there is no FDA approved enclomiphene product in the United States. FDA is still evaluating enclomiphene citrate as an ingredient for compounding and has not concluded that it is appropriate; FDA's advisory committee voted against adding it in 2022, and FDA can change that status at any time.",
    ],
  },
]);

const womensTestosteroneCream = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Children have become virilized after contact with testosterone applied to someone else's skin. Reported effects include genital enlargement, early pubic hair, aggressive behavior, and advanced bone age; some did not fully reverse. Wash your hands right after applying, let the site dry, cover it with clothing, and wash the site before skin to skin contact.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You are pregnant, trying to become pregnant, or breastfeeding. Testosterone can harm a female fetus.",
      "You have known or suspected breast cancer or another hormone sensitive cancer.",
      "You have an untreated high testosterone level or a tumor that produces androgens.",
      "You are allergic to testosterone or any ingredient in the cream.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You live with children or have frequent skin contact with a partner.",
      "You also take estrogen. The combined clot risk has not been fully studied.",
      "You have had a blood clot, high blood pressure, liver problems, or high cholesterol.",
      "You already have acne, unwanted hair growth, or hair loss.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No rates exist, because no approved product for women exists. At doses that keep testosterone in the normal female range, trials reported mild acne and increased body or facial hair in some women.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "A deepening or hoarse voice, an enlarged clitoris, rapid scalp hair loss, heavy new facial hair, severe acne, or a marked mood change. Stop the cream and contact your clinician; some of these may not reverse.",
      "Chest pain, shortness of breath, one sided weakness, trouble speaking, or a painful swollen leg. Call 911.",
      "Any sign of testosterone exposure in a child or partner: unexpected pubic hair, genital enlargement, or acne.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Total testosterone before starting, again 3 to 6 weeks after starting, then every 6 months, with a check for signs of excess at every visit. Ask for an LC MS/MS test where available; ordinary assays are unreliable at female levels. If you take warfarin, your INR must be watched.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this cream for you, for a use that has no approved product anywhere in the United States. It is not FDA approved and is not a generic of any approved testosterone product. The 2019 global consensus statement on testosterone therapy for women, endorsed by the International Menopause Society, the Endocrine Society, the North American Menopause Society, and ACOG, states that compounded testosterone cannot be recommended unless an approved equivalent is unavailable. Testosterone is a Schedule III controlled substance.",
    ],
  },
]);

const womensTestosteroneInjection = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You are pregnant, planning pregnancy, or breastfeeding.",
      "You have known or suspected breast cancer or another hormone sensitive cancer.",
      "You are allergic to testosterone, to the oil it is mixed in (such as sesame or cottonseed oil), or to benzyl alcohol or benzyl benzoate.",
      "You have serious heart, liver, or kidney disease.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have had a blood clot, or you also take estrogen.",
      "You have high blood pressure, high cholesterol, or liver problems.",
      "You already have acne, unwanted hair growth, or scalp hair loss.",
      "You could become pregnant. You need effective contraception; the medicine stays in your body for weeks after an injection.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No rates exist, because no approved female injectable exists. Commonly reported: injection site pain or bruising, acne, oily skin, more facial or body hair, mood or sex drive changes, fluid retention, and a rising red blood cell count.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain, shortness of breath, coughing blood, a sudden cough or lightheadedness right after an injection, one sided weakness, trouble speaking, sudden vision change, or a painful swollen leg. Call 911.",
      "A deepening or hoarse voice, enlargement of the clitoris, rapid hair loss or heavy new facial hair, or severe acne. Stop and contact a clinician; voice change and clitoral enlargement may not reverse.",
      "A severe mood change or thoughts of suicide, yellow eyes or skin, or fever, spreading redness, or pus at an injection site.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Total testosterone at baseline, 3 to 6 weeks after starting, then every 6 months, drawn at a consistent time relative to your injection because levels peak and then fall. Hemoglobin and hematocrit at baseline and periodically. If you take warfarin, your INR must be watched.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes or dilutes this injection for you, for a use that has no approved product in the United States. It is not FDA approved and is not a generic of Depo Testosterone. The 2019 global consensus statement on testosterone therapy for women states that preparations which produce levels above the normal female range, including injections, are not recommended. Testosterone is a Schedule III controlled substance.",
    ],
  },
]);

const vaginalEstriolCream = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Estrogens increase the risk of cancer of the lining of the uterus in a woman with a uterus who uses estrogen without a progestin. Any unexpected vaginal bleeding must be evaluated promptly. Estrogen should not be used to prevent heart disease or dementia. This warning is carried by FDA approved vaginal estradiol products; no estriol product has been reviewed by FDA, and the risks of estrogen absorbed from the vagina should be assumed to apply.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You have unexplained vaginal bleeding.",
      "You have, are suspected to have, or have had breast cancer or another estrogen dependent cancer.",
      "You have or have had a blood clot in a leg or lung, or a stroke or heart attack in the past year.",
      "You have liver disease, a known clotting disorder, or you are or may be pregnant.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have a uterus. You may need protection for the uterine lining or monitoring, because estrogen is absorbed from the vagina.",
      "You have high blood pressure, high triglycerides, gallbladder disease, migraine, asthma, epilepsy, endometriosis, or fibroids.",
      "You take thyroid hormone. Estrogen can change how much you need.",
      "You use condoms or a diaphragm. Some cream bases can weaken them; ask the pharmacy.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No data exist for compounded estriol cream. With approved vaginal estrogens: vaginal irritation or discharge, spotting, breast tenderness, and headache slightly above placebo.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Any unexpected vaginal bleeding. This always needs evaluation.",
      "A new breast lump, or severe pelvic pain.",
      "Chest pain, sudden shortness of breath, one sided weakness or numbness, trouble speaking, a sudden severe headache, sudden vision loss, or a painful swollen leg. Call 911.",
      "Rash, swelling of the face or throat, or trouble breathing.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Prompt evaluation of any unexpected bleeding. Annual pelvic and breast exam, and mammography on your usual schedule. Blood pressure at each visit. St. John's wort, rifampin, and some seizure medicines can lower estrogen levels; some antibiotics, antifungals, ritonavir, and grapefruit juice can raise them.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      'A pharmacy makes this cream for you. It is not FDA approved, and FDA has not reviewed its strength, purity, or absorption. FDA has stated that no product containing estriol has been approved and that the safety and effectiveness of estriol is unknown. This preparation is not a generic of, and has not been shown to be equivalent to, any approved vaginal estrogen. It is not "bio identical" in any regulatory sense.',
    ],
  },
]);

const vaginalEstrogenSuppository = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Estrogens increase the risk of cancer of the lining of the uterus in a woman with a uterus who uses estrogen without a progestin. Any unexpected vaginal bleeding must be evaluated promptly. Estrogen therapy should not be used to prevent heart disease or dementia. This warning is carried by the FDA approved vaginal estradiol inserts that this preparation resembles.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You have unexplained vaginal bleeding.",
      "You have, are suspected to have, or have had breast cancer or another estrogen dependent cancer.",
      "You have or have had a blood clot in a leg or lung, or a stroke or heart attack in the past year.",
      "You have liver disease, a known clotting disorder, or you are or may be pregnant.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have a uterus. Estrogen is absorbed from the vagina, so you may need monitoring or a progestin.",
      "You have high blood pressure, high triglycerides, gallbladder disease, migraine, asthma, epilepsy, endometriosis, or fibroids.",
      "You take thyroid hormone.",
      "You have a vaginal sore, lesion, or infection. This should be checked before you start.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No data exist for compounded suppositories. Commonly reported with vaginal estrogen products: vaginal itching, burning, or discharge, headache, breast tenderness, spotting, and yeast infection.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Any unexpected vaginal bleeding, or a new breast lump.",
      "Severe pelvic pain, or foul smelling discharge with fever.",
      "Chest pain, sudden shortness of breath, coughing blood, one sided weakness, trouble speaking, a sudden severe headache, sudden vision loss, or a painful swollen leg. Call 911.",
      "Rash, swelling of the face or throat, or trouble breathing.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Prompt evaluation of any unexpected bleeding. Annual pelvic and breast exam, and mammography on your usual schedule. Blood pressure at each visit. A yearly review of whether to continue. Other estrogen products you use add to your total exposure.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this suppository for you. It is not FDA approved, and FDA has not reviewed its strength, purity, or how evenly the hormone is distributed. It is not a generic of, and has not been shown to be equivalent to, Imvexxy, Vagifem, or any approved vaginal estrogen. The base a suppository is made from changes how fast the hormone is released, and that has not been measured for this preparation. It does not come with the FDA required Medication Guide that accompanies approved products.",
    ],
  },
]);

const estradiolPatch = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Estrogens increase the risk of cancer of the lining of the uterus in a woman with a uterus who uses estrogen without a progestin. Adding a progestin lowers that risk. Any unexpected or ongoing vaginal bleeding must be evaluated promptly, including sampling of the uterine lining when indicated. Estrogen therapy should not be used to prevent heart disease or dementia.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You have unexplained vaginal bleeding.",
      "You have, are suspected to have, or have had breast cancer or another estrogen dependent cancer.",
      "You have or have had a blood clot in a leg or lung, or a stroke or heart attack in the past year.",
      "You have liver disease or a known clotting disorder.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have a uterus. You need a progestin along with systemic estrogen.",
      "You have high blood pressure, high triglycerides, or gallbladder disease.",
      "You have migraine, asthma, epilepsy, endometriosis, fibroids, or porphyria.",
      "You have heart or kidney problems that fluid retention could worsen.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Redness or irritation where the patch is applied, breast tenderness, headache, nausea, cramps or bloating, fluid retention, spotting, and mood changes. Exact rates vary by product and strength; check the leaflet for the patch you receive.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain or pressure, sudden shortness of breath, coughing up blood, a sudden severe headache, one sided weakness or numbness, vision loss, trouble speaking, or a painful swollen leg. Call 911.",
      "Unexpected vaginal bleeding, a new breast lump, yellow skin or eyes, severe belly pain, severe depression, or facial swelling or trouble breathing.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood pressure at baseline and each visit. Breast exam and mammography on the usual schedule. Prompt evaluation of any abnormal bleeding. Lipids, and triglycerides if already high. St. John's wort, rifampin, and some seizure medicines can lower estradiol levels and cause breakthrough bleeding; some antibiotics, antifungals, ritonavir, and grapefruit juice can raise them.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "This medicine is dispensed as an FDA approved product, so FDA has reviewed its safety, quality, and labeling. It is not compounded. Patches can loosen with heat, swimming, or sweating; follow the application instructions in your package leaflet.",
    ],
  },
]);

const estradiolPill = safetyBox([
  {
    heading: "Boxed Warning",
    paragraphs: [
      "Estrogens increase the risk of cancer of the lining of the uterus. Any unexplained, ongoing, or recurring abnormal vaginal bleeding must be evaluated, including sampling of the uterine lining when indicated. Estrogens, with or without a progestin, should not be used to prevent heart disease or dementia.",
    ],
  },
  {
    heading: "Do not use if",
    items: [
      "You have unexplained vaginal bleeding.",
      "You have, are suspected to have, or have had breast cancer or another estrogen dependent cancer.",
      "You have or have had a blood clot in a leg or lung, or a stroke or heart attack in the past year.",
      "You have liver disease or a known clotting disorder.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have a uterus. You need a progestin along with systemic estrogen.",
      "You have extra clot risk: obesity, a prior clot, a clotting disorder, or long periods of immobility.",
      "You have high blood pressure, high triglycerides, gallbladder disease, migraine, asthma, epilepsy, endometriosis, or fibroids.",
      "You take thyroid hormone, or you smoke.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Headache, breast pain or tenderness, spotting, nausea, cramps or bloating, fluid retention, hair loss, vaginal discharge or yeast infection, and mood changes.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain, sudden shortness of breath, coughing blood, one sided weakness or numbness, trouble speaking, a sudden severe headache, sudden vision loss, or a painful swollen leg. Call 911.",
      "Unexpected vaginal bleeding, a new breast lump, yellow skin or eyes, severe belly pain, severe depression, or facial swelling or trouble breathing.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Blood pressure at baseline and each visit. Breast exam and mammography on the usual schedule. Prompt evaluation of any abnormal bleeding. Lipids periodically. Thyroid function if you take thyroid hormone. St. John's wort, rifampin, and some seizure medicines lower estradiol levels; some antibiotics, antifungals, ritonavir, and grapefruit juice raise them. Smoking increases clot risk.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "This medicine is dispensed as an FDA approved product, so FDA has reviewed its safety, quality, and labeling. It is not compounded. Compounded oral estrogen mixtures, sometimes called Bi Est or Tri Est, are not FDA approved, are not generics of estradiol tablets, and lack human absorption data.",
    ],
  },
]);

const progesterone = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You are allergic to peanuts. These capsules contain peanut oil.",
      "You are allergic to progesterone or any ingredient in the capsule.",
      "You have vaginal bleeding that has not been explained.",
      "You have, are suspected to have, or have had breast cancer.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have a history of depression.",
      "You have asthma, epilepsy, migraine, heart disease, or kidney problems, which fluid retention can worsen.",
      "You drive at night or operate machinery. This medicine can cause severe dizziness and drowsiness.",
      "You take a medicine that makes you sleepy, or you drink alcohol.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "Headache, breast tenderness, dizziness, drowsiness, bloating, low mood, hot flashes, vaginal discharge, and nausea. In the main trial, about 1 in 4 women had breast tenderness.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pain, sudden shortness of breath, coughing blood, one sided weakness or numbness, trouble speaking, a sudden severe headache, sudden vision loss, a painful swollen leg, or throat tightness, facial swelling, or hives. Call 911.",
      "Severe or lasting dizziness or drowsiness, yellow skin or eyes, unexpected vaginal bleeding, a new breast lump, severe depression, or thoughts of suicide.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Prompt evaluation of any unexpected bleeding. Blood pressure and weight at each visit. Breast exam and mammography on the usual schedule. Food increases absorption, so take it the same way each time, usually at bedtime. Ketoconazole can raise progesterone levels; rifampin, carbamazepine, phenytoin, and St. John's wort can lower them.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "This medicine is dispensed as an FDA approved product at a standard strength, so FDA has reviewed its safety, quality, and labeling. It is not compounded. If your prescriber orders a strength that is not commercially available, that capsule is a compounded preparation with its own product page; ask which one you are receiving. Compounded progesterone creams and troches have not been shown to deliver enough progesterone to protect the lining of the uterus.",
    ],
  },
]);

const sermorelin = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have active cancer of any kind.",
      "You are allergic to sermorelin or any ingredient, including the diluent.",
      "You are pregnant or breastfeeding.",
      "Your pituitary system has been disrupted by surgery, head radiation, head injury, or a pituitary tumor.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have had cancer in the past, or you have an undiagnosed lump, a changing mole, or unexplained weight loss.",
      "You have diabetes or high blood sugar. Growth hormone lowers your body's response to insulin.",
      "You have epilepsy or another seizure disorder.",
      "You take steroid medicines such as prednisone, or a steroid inhaler.",
      "You are about to have major surgery, or you are seriously ill.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "There is no side effect table for compounded sermorelin. The historical product labeling listed facial warmth, flushing, and injection site pain, usually passing within minutes.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Trouble breathing, throat tightness, swelling of the face, lips, or tongue, or widespread hives.",
      "A new lump, a mole that changes, unexplained weight loss, or a new cancer diagnosis. Stop and contact your prescriber.",
      "Heavy thirst, frequent urination, blurred vision, or confusion, which can signal very high blood sugar.",
      "Rapid swelling of the hands, feet, or face, sudden weight gain, or shortness of breath.",
      "Numbness, tingling, or weakness in the hands or wrists that does not go away.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Fasting glucose and HbA1c before starting and periodically. IGF 1 periodically. Weight, swelling, blood pressure, and joint or hand symptoms at each check in. Age appropriate cancer screening kept up to date. Insulin and other diabetes medicines may need adjusting; steroids blunt the growth hormone response.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this injection for you. It is not FDA approved, and FDA has not reviewed its safety, quality, purity, or strength. It is not a generic of the discontinued Geref product. Sermorelin's only approved uses were a pituitary diagnostic test and growth failure in children, both withdrawn in 2009; nightly adult use was never part of an approved label.",
    ],
  },
]);

const nad = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have had an allergic reaction to NAD+ or any ingredient, including flavorings, sweeteners, preservatives, or the troche or spray base.",
      "You are pregnant or breastfeeding. There are no human safety data.",
      "You have active cancer. FDA's own review flagged laboratory findings that raising NAD may increase tumor growth.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have had cancer in the past.",
      "You have Gilbert's syndrome or another liver condition.",
      "You take blood pressure medicine, or you have low blood pressure or fainting spells.",
      "You take other NAD boosting supplements, such as nicotinamide riboside, NMN, or high dose niacin.",
      "You have nose problems or mouth sores, if you are using a nasal or troche form.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: [
      "No verified rates exist for any compounded NAD+ product. In one clinic report of six people given NAD+ intravenously, all six had cramping, diarrhea, nausea, a faster heart rate, and chest pressure during the infusion, which stopped when it ended.",
    ],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Chest pressure or pain, trouble breathing, or a pounding or racing heartbeat that does not settle after a dose.",
      "Fever, chills, uncontrollable shaking, body aches, or feeling faint in the hours after a dose. FDA has linked these to contaminated compounded NAD+.",
      "Lightheadedness, fainting, or very low blood pressure.",
      "Swelling of the face, lips, or tongue, widespread hives, or throat tightness.",
      "Severe vomiting or diarrhea that keeps you from holding down fluids.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "A symptom check after the first dose and after any dose increase. Blood pressure and pulse before and after early doses. Liver enzymes if treatment continues. No interaction studies exist; tell your prescriber about other supplements, cancer treatment, blood pressure medicine, and other nasal sprays.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this preparation for you. It is not FDA approved, and FDA has not reviewed its safety, quality, strength, or sterility. FDA is still evaluating NAD as an ingredient for compounding and has not concluded that it is appropriate; its advisory committee recommended against it in 2017, and that status can change at any time. Published human dosing data exist only for slow intravenous infusion; there are no absorption studies for NAD+ under the tongue or in the nose. Do not share a nasal spray with anyone.",
    ],
  },
]);

const glutathione = safetyBox([
  {
    heading: "Do not use if",
    items: [
      "You have had an allergic reaction to glutathione or any ingredient in the solution. Anaphylaxis has been reported.",
      "The pharmacy cannot confirm the glutathione is pharmaceutical grade. FDA has told compounders not to use dietary supplement grade glutathione in injectables.",
      "You are pregnant or breastfeeding. There are no human safety data.",
    ],
  },
  {
    heading: "Talk to your provider first if",
    items: [
      "You have liver disease, you drink heavily, or you take acetaminophen regularly.",
      "You have asthma triggered by sulfur containing compounds.",
      "You are receiving cancer treatment.",
      "You take blood pressure medicine, or you have fainting spells.",
    ],
  },
  {
    heading: "Common side effects",
    paragraphs: ["No verified side effect rates exist for injectable glutathione."],
  },
  {
    heading: "Get medical help right away if you have",
    items: [
      "Fever, chills, shaking, or suddenly feeling very unwell, especially within minutes to hours of a dose. This can signal an endotoxin reaction or bloodstream infection.",
      "Trouble breathing, throat tightness, swelling of the face, lips, or tongue, or widespread hives.",
      "Lightheadedness, fainting, cold clammy skin, or a racing heart.",
      "Yellow skin or eyes, dark urine, upper right belly pain, or severe fatigue.",
      "Severe vomiting, muscle aches, or a severe headache after a dose.",
    ],
  },
  {
    heading: "Monitoring and interactions",
    paragraphs: [
      "Liver function tests before starting and periodically. Temperature, blood pressure, and pulse before and after the first several doses, with any fever reported the same day. An observation period after each dose, because reported reactions began within minutes. Tell your prescriber about anything that stresses the liver, any chemotherapy, and any other infusions given in the same session.",
    ],
  },
  {
    heading: "About this medicine",
    paragraphs: [
      "A pharmacy makes this injection for you. It is not FDA approved, and FDA has not reviewed its safety, quality, strength, or sterility. FDA is still evaluating glutathione as an ingredient for compounding and has not concluded that it is appropriate. FDA warned compounders in 2019 and again in August 2026 not to use dietary supplement grade glutathione to make injectables, after patients were harmed both times. Ask your pharmacy to confirm in writing that the glutathione in your preparation is pharmaceutical grade with a valid certificate of analysis.",
    ],
  },
]);

const productSafety: Record<string, SafetySection[]> = {
  "weight-loss-semaglutide": semaglutideInjection,
  "weight-loss-tirzepatide": tirzepatideInjection,
  "men-sexual-health-tadalafil": tadalafil,
  "men-sexual-health-combo-troches": mensComboTroches,
  "women-sexual-health-combo-troches": womensComboTroches,
  "sexual-health-pt-141-nasal": pt141Nasal,
  "men-sexual-health-trimix-injectable": trimix,
  "oxytocin-nasal-spray": oxytocinNasal,
  "men-trt-testosterone-cypionate": testosteroneCypionate,
  "men-trt-testosterone-cream": mensTestosteroneCream,
  "men-trt-enclomiphene": enclomiphene,
  "women-hrt-testosterone-cream": womensTestosteroneCream,
  "women-hrt-testosterone-injection-low-dose": womensTestosteroneInjection,
  "women-hormone-therapy-vaginal-estrogen-cream": vaginalEstriolCream,
  "women-hrt-vaginal-estrogen-suppository": vaginalEstrogenSuppository,
  "women-hormone-therapy-estradiol-patch": estradiolPatch,
  "women-hormone-therapy-estradiol-pill": estradiolPill,
  "women-hormone-therapy-progesterone-(oral)": progesterone,
  "longevity-sermorelin": sermorelin,
  "longevity-nad": nad,
  "nad-injectable": nad,
  "longevity-nad-nasal-spray": nad,
  "longevity-glutathione": glutathione,
};

export function getProductSafety(slug: string) {
  return productSafety[slug];
}
