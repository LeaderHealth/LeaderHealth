"use client";

import Image from "next/image";
import { useState } from "react";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const [failed, setFailed] = useState(false);
  const letters = initials(name);
  if (!src || failed) {
    return (
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-rose text-sm font-medium text-ink" aria-hidden="true">
        {letters}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={44}
      height={44}
      unoptimized
      className="size-11 shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function EmailAddress({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at <= 0) return <>{email}</>;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}

export function ProfileCard({
  name,
  email,
  role,
  avatarUrl,
  signOut,
}: {
  name: string;
  email: string;
  role: "Admin" | "Affiliate";
  avatarUrl: string | null;
  signOut: () => Promise<void>;
}) {
  return (
    <section aria-label="Your account" className="rounded-[28px] bg-white p-4">
      <div className="flex items-center gap-3 xl:flex-col xl:items-start">
        <Avatar name={name} src={avatarUrl} />
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-5 text-ink">{name}</p>
          <p className="mt-1 break-words text-sm leading-5 text-brown">
            <EmailAddress email={email} />
          </p>
        </div>
      </div>
      <p className="mt-3">
        <span className="inline-flex rounded-full bg-rose px-3 py-1 text-xs font-medium text-ink">{role}</span>
      </p>
      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink/20 bg-white px-5 text-sm font-medium text-ink hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sign out
        </button>
      </form>
    </section>
  );
}
