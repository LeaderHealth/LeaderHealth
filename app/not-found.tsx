import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-40 text-center">
      <p className="text-sm uppercase tracking-wider text-accent">404</p>
      <h1 className="mt-4 text-5xl">Page not found</h1>
      <p className="mt-4 text-taupe">That link does not match a treatment, article, or legal page.</p>
      <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-white">
        Back home
      </Link>
    </div>
  );
}
