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
          // Reveal at ANY intersection: on phones a slide can be 3× the
          // viewport, so a high ratio never arrives and content would stay
          // hidden (opacity 0) forever.
          e.target.classList.add("in"); // scroll-reveal hook (one-way)
          // The counter label needs more commitment: a decent ratio, or (for
          // tall slides) the slide actually covering most of the screen.
          const covers = e.intersectionRect.height >= window.innerHeight * 0.55;
          if (e.intersectionRatio < 0.35 && !covers) continue;
          const i = slides.indexOf(e.target as HTMLElement);
          const name = (e.target as HTMLElement).dataset.slideName ?? "";
          setLabel(`${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}${name ? ` — ${name}` : ""}`);
        }
      },
      { threshold: [0.02, 0.35, 0.6] },
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
