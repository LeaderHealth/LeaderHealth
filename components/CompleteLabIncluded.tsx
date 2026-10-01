import type { ReactNode } from "react";

const items: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Licensed Clinician Visit",
    body: "Real doctors, real answers. Ongoing care from physicians who actually know your history.",
    icon: <StethoscopeIcon />,
  },
  {
    title: "Testosterone & Supplies Delivered",
    body: "Everything you need, shipped straight to your door. No pharmacy runs, no hassle.",
    icon: <PillIcon />,
  },
  {
    title: "Quarterly Lab Tests",
    body: "Track what’s actually happening inside. Regular labs keep your treatment dialed in and working.",
    icon: <FolderIcon />,
  },
  {
    title: "1:1 Personalized Support",
    body: "A dedicated care team in your corner — built around your goals, not a generic protocol.",
    icon: <LaptopIcon />,
  },
  {
    title: "Direct Clinician Messaging",
    body: "Questions don’t wait for office hours. Reach your care team whenever you need them.",
    icon: <ChatIcon />,
  },
  {
    title: "Follow-Up Clinician Visits",
    body: "Your health evolves — so does your care. Scheduled check-ins to adjust, optimize, and keep you on track.",
    icon: <ClinicIcon />,
  },
];

export function CompleteLabIncluded() {
  return (
    <section className="bg-[#32120E] px-5 py-16 min-[700px]:px-8 min-[700px]:py-20">
      <div className="mx-auto w-full max-w-[1080px]">
        <h2 className="text-center font-sans text-[36px] font-semibold leading-none tracking-normal text-white min-[700px]:text-[44px]">
          What&apos;s included
        </h2>
        <ul className="mt-12 grid grid-cols-1 gap-10 min-[700px]:mt-14 min-[700px]:grid-cols-3 min-[700px]:gap-x-12 min-[700px]:gap-y-14">
          {items.map((item) => (
            <li key={item.title}>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#DC3A4F] text-[#2C1210]">
                {item.icon}
              </span>
              <h3 className="mt-4 font-sans text-[17px] font-semibold leading-snug tracking-normal text-white min-[700px]:text-[18px]">
                {item.title}
              </h3>
              <p className="mt-2 font-sans text-[14px] font-normal leading-[1.45] text-[#E4D2CE]">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function StethoscopeIcon() {
  return (
    <Icon>
      <path d="M6 3.5v1" />
      <path d="M11 3.5v1" />
      <path d="M6 4.5H5a2 2 0 0 0-2 2v3.2a5 5 0 0 0 10 0V6.5a2 2 0 0 0-2-2h-1" />
      <path d="M8 14.2v.6a5 5 0 0 0 5 5h.8" />
      <circle cx="17.2" cy="15.2" r="2.1" />
    </Icon>
  );
}

function PillIcon() {
  return (
    <Icon>
      <path d="M10.2 19.2 19.2 10.2a4.2 4.2 0 0 0-6-6L4.2 13.2a4.2 4.2 0 0 0 6 6Z" />
      <path d="m8.2 8.2 7.6 7.6" />
    </Icon>
  );
}

function FolderIcon() {
  return (
    <Icon>
      <path d="M3.5 7.2A1.7 1.7 0 0 1 5.2 5.5h3.1l1.6 1.7h8.9A1.7 1.7 0 0 1 20.5 8.9v8.4a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7V7.2Z" />
      <path d="M12 11.2v4" />
      <path d="M10 13.2h4" />
    </Icon>
  );
}

function LaptopIcon() {
  return (
    <Icon>
      <rect x="5" y="4.5" width="14" height="10" rx="1.4" />
      <path d="M3.5 18.5h17" />
      <path d="M7 14.5h10" />
    </Icon>
  );
}

function ChatIcon() {
  return (
    <Icon>
      <path d="M5.5 6h13a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3V16H5.5A1.5 1.5 0 0 1 4 14.5v-7A1.5 1.5 0 0 1 5.5 6Z" />
      <path d="M8 11.2h8" />
      <path d="M8 13.6h5" />
    </Icon>
  );
}

function ClinicIcon() {
  return (
    <Icon>
      <path d="M4 20.5V10.2L12 4.5l8 5.7v10.3" />
      <path d="M4 20.5h16" />
      <path d="M10 20.5v-4.2h4v4.2" />
      <path d="M12 8.8v3.2" />
      <path d="M10.4 10.4h3.2" />
    </Icon>
  );
}
