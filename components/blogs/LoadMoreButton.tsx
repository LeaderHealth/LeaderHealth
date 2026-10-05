"use client";

export function LoadMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[47px] items-center justify-center rounded-full bg-[#321110] px-7 font-sans text-[15px] font-medium tracking-[-0.02em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
    >
      Load More
    </button>
  );
}
