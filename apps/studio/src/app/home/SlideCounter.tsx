"use client";

import { useEffect, useState } from "react";

// The fixed "01 / 06 — Cover"-style counter that makes the landing read as a
// presentation. Watches the .lp-slide sections with an IntersectionObserver;
// aria-hidden because it duplicates the section headings for sighted users.
export function SlideCounter() {
  const [label, setLabel] = useState("01 / 06");
  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(".lp-slide"));
    if (!slides.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("in"); // scroll-reveal hook (one-way)
          const i = slides.indexOf(e.target as HTMLElement);
          const name = (e.target as HTMLElement).dataset.slideName ?? "";
          setLabel(`${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}${name ? ` — ${name}` : ""}`);
        }
      },
      { threshold: 0.35 },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <div className="lp-counter" aria-hidden="true">
      {label}
    </div>
  );
}
