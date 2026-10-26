function navClearance() {
  const gap = 16;
  const header = document.querySelector("header");
  if (header && getComputedStyle(header).display !== "none") {
    const top = Number.parseFloat(getComputedStyle(header).top) || 0;
    return top + header.offsetHeight + gap;
  }
  return 12 + 50 + gap;
}

export function scrollToOurTop3() {
  const grid = document.getElementById("our-top-3");
  const target = grid?.querySelector("a") ?? grid;
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearance = navClearance();
  const rect = target.getBoundingClientRect();
  const absTop = rect.top + window.scrollY;
  const absBottom = rect.bottom + window.scrollY;
  const bottomPad = 16;
  const lift = 72;
  let top = absTop - clearance;

  if (absBottom - top > window.innerHeight - bottomPad) {
    top = absBottom - (window.innerHeight - bottomPad);
  }

  top += lift;

  const vial = target.querySelector("img");
  const label = target.querySelector("p") ?? target.querySelector("h3");
  if (vial) {
    const vialTop = vial.getBoundingClientRect().top + window.scrollY;
    top = Math.min(top, vialTop - clearance);
  }
  if (label) {
    const labelBottom = label.getBoundingClientRect().bottom + window.scrollY;
    top = Math.max(top, labelBottom - (window.innerHeight - bottomPad));
  }

  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
}
