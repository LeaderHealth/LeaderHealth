const storefrontOrigin = (
  process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN ??
  (process.env.NODE_ENV === "development" ? "http://localhost:5176" : "")
).replace(/\/$/, "");

export function storefrontPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${storefrontOrigin}${normalized}`;
}

export const GET_STARTED_URL = "https://products.leaderhealth.clinic/?quizOpen=true";
export const PORTAL_URL = "https://myportal.leaderhealth.clinic/login";

export function checkoutUrl(product?: string, variant?: string) {
  const params = new URLSearchParams();
  if (product) params.set("product", product);
  if (variant) params.set("variant", variant);
  const query = params.toString();
  return query ? `/checkout?${query}` : "/checkout";
}

export const site = {
  name: "Leader Health",
  tagline: "Become the strongest version of yourself.",
  description:
    "Personalized, clinician-led protocols that help you lose weight, build strength, and live with more energy—no guesswork.",
  email: "help@myleaderhealth.com",
  privacyEmail: "privacy@myleaderhealth.com",
  phone: "(254) 244-0104",
  phoneHref: "tel:+12542440104",
  address: "321 S Persimmon Tomball, TX 77375",
  addressHref: "https://maps.google.com/?q=321+S+Persimmon+St+Tomball+Texas",
  hours: ["Tue-Sat, 9am-5pm CT", "Sun-Mon, Closed"],
  legalNote:
    "Leader Health provides the technology platform and administrative services for your care. Medical services are provided by independent, licensed clinicians through affiliated medical practices; the clinician and practice responsible for your care are identified in your visit record and patient portal. Leader Health is not a pharmacy and does not compound, manufacture, or dispense medications. Prescriptions are filled by licensed U.S. pharmacies. Whether a medicine is FDA approved or compounded is stated on that medicine's own page. This site does not provide medical advice and is not a substitute for care from your own clinician. For a medical emergency, call 911.",
};

export const tickerItems = [
  "Free consultation, fast approval",
  "No insurance required",
  "Free expedited delivery",
  "Doctor-led treatment plans",
];

export const assets = {
  logo: "https://framerusercontent.com/images/GA0eD4KXUgXgbydQx3suqxgv20.png?width=8103&height=554",
  heroVideo:
    "https://framerusercontent.com/assets/SEvBMYJ1Odd8btsq47nUoKvLX8M.mp4",
  heroVideoAlt:
    "https://framerusercontent.com/assets/WUBCjjcACmE3AuGZNdJF8vWz5M.mp4",
  stepForm:
    "https://framerusercontent.com/images/qSdCfHumvKwkc6C9U1PjDcnOyw.png?width=911&height=1138",
  stepLabs:
    "https://framerusercontent.com/images/fE2Seoawj6DwRCP00iesU8HZAn4.png?width=1536&height=1024",
  stepShip:
    "https://framerusercontent.com/images/2fozdgMOVtWz2BYQ8xh2aoTKLjA.png?width=1402&height=1122",
  showUp:
    "https://framerusercontent.com/images/Kk8SP5SfgWW6Umc19CpB5vUA7m0.png?width=2720&height=1536",
  pills:
    "https://framerusercontent.com/images/au9n9RNuyjpJnXD4hpJpuUARaE.png?width=2286&height=1287",
  stretching:
    "https://framerusercontent.com/images/GMDs0BF7J9LSEZf6TeYNopUk.png?width=2308&height=836",
  weightlifting:
    "https://framerusercontent.com/images/PS4PKDWojZUohQPzaBkf9lNbaiE.png?width=2496&height=1664",
  check: "https://framerusercontent.com/images/Zz5GFutU23kAn0d5PdrUADwJpYY.png?width=60&height=60",
  stars: "https://framerusercontent.com/images/S0Np3lr6bYbdZZk8QAgf3GXn2U.png?width=48&height=48",
  completeLab:
    "https://framerusercontent.com/images/F7x0JTDFEFbHV8R25qS1PWofP6g.png?width=1620&height=2880",
  advancedLab:
    "https://framerusercontent.com/images/X7bsiY1oJsGU4I96M8TqKDKmvY.png?width=1620&height=2880",
  shopHero:
    "https://framerusercontent.com/images/cCfn27Xv7UDHhfu2ClpobxLqv0.png?width=2496&height=1664",
  contactHero: "/images/contact-hero.jpg",
  energyHero: "/images/energy-longevity-hero.jpg",
  energyMeasurement: "/images/energy-longevity-measurement.jpg",
  energyWalkthrough: "/images/walkthrough-hiking.jpg",
  nadVial: "/images/walkthrough-nad.jpg",
  glutathioneVial: "/images/walkthrough-glutathione.jpg",
  mattersEnergy: "/images/matters-energy.jpg",
  mattersAging: "/images/matters-aging.jpg",
  mattersSleep: "/images/matters-sleep.jpg",
  mattersRecovery: "/images/matters-recovery.jpg",
};

export const careSteps = [
  {
    step: "Step 1",
    title: "Complete form",
    body: "Tell us about your goals and health history",
    image: assets.stepForm,
    alt: "Patient filling out the LeaderHealth online health intake form on a phone",
  },
  {
    step: "Step 2",
    title: "Labs + Clinician Review",
    body: "Licensed providers review your history and labs before any prescription.",
    image: assets.stepLabs,
    alt: "LeaderHealth clinician reviewing a patient's lab results on screen",
  },
  {
    step: "Step 3",
    title: "Receive Meds Fast",
    body: "Medication ships to your door after your clinician approves a plan.",
    image: assets.stepShip,
    alt: "Man opening a LeaderHealth medication shipment at home",
  },
];

export const designedFor = [
  "Protocols tuned to your labs, goals, and lifestyle",
  "Ongoing adjustments from your clinical team",
  "Pharmaceutical-grade ingredients, transparently sourced",
];

export const testimonials = [
  {
    quote:
      "Since starting treatment with LeaderHealth, I have experienced significant improvements in my mental health, confidence, and overall quality of life. My focus and productivity at work have improved, I have more consistent energy throughout the day, and I feel more comfortable in my own skin. It has also positively changed my body composition by increasing muscle development and strength, helping my physical appearance better align with my goals.",
    name: "Nikki Schik",
    treatment: "HRT and Peptides",
    image:
      "https://framerusercontent.com/images/pw1rU7ewpbHbnqfqjIlJbKczm8.jpeg?width=1158&height=1544",
  },
  {
    quote:
      "The treatment I've received at Leader Health has improved my energy levels, benefited strength and mood, and has improved my overall quality of life. Steven dedicated months of his time to help me maximize my exercise routine by providing structure, consistency, technique, and accountability. One of the biggest impacts Leader Health has had on me is making me realize I can do things I thought I could not do anymore. Life-changing.",
    name: "Marco Kimassi",
    treatment: "Testosterone & Enclomiphene Therapy",
    image:
      "https://framerusercontent.com/images/l7ePDuNDD8nwj6DkHwik7D4M8.jpeg?width=4284&height=5712",
  },
  {
    quote:
      "Glutathione from Leader Health is my weekly wellness essential. It detoxifies, protects cells, and boosts immunity beautifully.",
    name: "Brett Wilkin",
    treatment: "Glutathione",
    image:
      "https://framerusercontent.com/images/GAzPl3G5bDrn2C5E6SF7YJR7Fk.jpeg?width=1599&height=2000",
  },
];

export const founders = [
  { name: "Stephen Ratcliff, MD, MBA", role: "CMO · Co-Founder" },
  { name: "Steven Fowler, NP", role: "COO · Co-founder" },
  { name: "Patrick Anderson", role: "CEO · Co-founder" },
];
