import Link from "next/link";

export function AgreementRequired({ waiting, className = "mt-6" }: { waiting: boolean; className?: string }) {
  return (
    <div className={`${className} rounded-[20px] bg-background px-4 py-4 sm:px-5`}>
      <h3 className="text-lg">Accept your agreement first</h3>
      <p className="mt-2 max-w-2xl text-sm text-brown">
        {waiting
          ? "This page opens once you accept the agreement Leader Health sent you."
          : "This page opens once you accept an agreement. Leader Health will send one to you in My agreement."}
      </p>
      <Link
        href="/affiliates/contracts#agreements"
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {waiting ? "Review agreement" : "Go to My agreement"}
      </Link>
    </div>
  );
}
