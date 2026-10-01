import { FaqDropdownItems } from "@/components/PeptidesFaq";

const labFaqs = [
  {
    q: "What's included in my lab panels?",
    a: "Your Annual Lab Panel covers 100 biomarkers; your 6-Month Recheck Panel covers 44 markers chosen to track the systems most likely to change between annual draws. Your clinician may order additional, targeted labs when a specific therapy requires closer monitoring.",
  },
  {
    q: "Where do I get my blood drawn?",
    a: "At any Quest Diagnostics or LabCorp location near you, coordinated through our platform. It's typically a 15-minute in-person appointment; we send the order ahead so you can simply check in.",
  },
  {
    q: "Do I need to fast before my labs?",
    a: "For most panels, yes — generally an 8–12 hour fast (water is fine). We'll send specific prep instructions before your draw, including timing of any medications.",
  },
  {
    q: "How are my results reviewed?",
    a: "A clinician reviews your results, flags anything outside expected ranges, and discusses them with you. Anything clinically urgent triggers prompt outreach from our team rather than waiting for your next scheduled check-in.",
  },
  {
    q: "Can I use labs I already have from another clinic or my doctor?",
    a: "Sometimes. If you have recent, complete results — generally drawn within the last 90 days and before starting therapy — your clinician may be able to use them. If they're incomplete or out of date, we'll order what's needed. Your clinician will tell you which applies.",
  },
  {
    q: "I feel healthy — why test?",
    a: "Because many meaningful changes in hormones, metabolism, and inflammation show up in bloodwork before you feel them. Testing gives you and your clinician a baseline to act on early and a way to measure whether a therapy is actually working — rather than relying on how you happen to feel that week.",
  },
  {
    q: "What if I have trouble with the blood draw?",
    a: "Tell the phlebotomist if you tend to feel faint — they'll have you lie down and take it slowly. If a draw comes up short, the lab will let us know and we'll arrange a re-draw at no additional cost.",
  },
];

export function CompleteLabFaq() {
  return (
    <section className="bg-[#F7F3F5] px-5 py-10 md:px-10 md:py-12">
      <div className="mx-auto w-full max-w-[920px]">
        <h2 className="text-center font-sans text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[#331110] sm:text-[38px] md:text-[42px] lg:text-[46px]">
          Have questions? We&apos;re here to{" "}
          <span className="font-serif-italic text-[#e43d4e]">help</span>
        </h2>
        <div className="mt-8 md:mt-10">
          <FaqDropdownItems items={labFaqs} />
        </div>
      </div>
    </section>
  );
}
