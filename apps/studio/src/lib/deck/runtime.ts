// ============================================================
//  SP Deck Engine — Inline client runtime
//  apps/studio/src/lib/deck/runtime.ts
//
//  Vanilla JS inlined into every deck. No user data flows into
//  this string — all dynamic content lives in the markup, so
//  there is no injection surface here.
//
//  Behavior contract:
//   - everything works without JS (anchors, visible content);
//     the runtime only adds polish (reveals, count-ups, keys)
//   - prefers-reduced-motion skips every animation
// ============================================================

export const RUNTIME_JS = /* js */ `
(function () {
  "use strict";
  // ?motion=off forces the reduced-motion path (useful for PDF capture and automation).
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    /[?&]motion=off\\b/.test(window.location.search);
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var railLinks = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  var counter = document.getElementById("deck-counter");
  var prevBtn = document.getElementById("deck-prev");
  var nextBtn = document.getElementById("deck-next");
  var activeIndex = 0;

  // Stagger reveal delays per slide.
  slides.forEach(function (slide) {
    Array.prototype.forEach.call(slide.querySelectorAll("[data-reveal]"), function (el, i) {
      el.style.transitionDelay = Math.min(i * 90, 540) + "ms";
    });
  });

  function setActive(index) {
    if (index === activeIndex && slides[index].classList.contains("in")) return;
    activeIndex = index;
    railLinks.forEach(function (link, i) {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (counter) {
      counter.textContent = (index + 1) + " / " + slides.length + " — " + (slides[index].dataset.title || "");
    }
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;
  }

  function enter(slide) {
    if (slide.classList.contains("in")) return;
    slide.classList.add("in");
    // Count-ups
    Array.prototype.forEach.call(slide.querySelectorAll("[data-count]"), function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (isNaN(target) || reduceMotion) return;
      var start = null;
      var duration = 900;
      function tick(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      el.textContent = "0";
      requestAnimationFrame(tick);
    });
    // Score rings
    Array.prototype.forEach.call(slide.querySelectorAll("[data-ring]"), function (ring) {
      var circumference = parseFloat(ring.getAttribute("data-circumference"));
      var finalOffset = parseFloat(ring.getAttribute("data-final-offset"));
      if (reduceMotion || isNaN(circumference) || isNaN(finalOffset)) return;
      ring.style.transition = "none";
      ring.style.strokeDashoffset = String(circumference);
      void ring.getBoundingClientRect();
      ring.style.transition = "";
      ring.style.strokeDashoffset = String(finalOffset);
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var index = slides.indexOf(entry.target);
        enter(entry.target);
        // "Active" = the slide covers most of the viewport. intersectionRatio
        // is useless for slides taller than the viewport (it can never reach
        // 0.5), so measure against the viewport instead.
        var viewportCovered = entry.intersectionRect.height /
          Math.max(1, Math.min(entry.boundingClientRect.height, window.innerHeight));
        if (viewportCovered >= 0.5) setActive(index);
      });
    }, { threshold: [0.6, 0.5, 0.3, 0.15, 0.05] });
    slides.forEach(function (slide) { observer.observe(slide); });
  } else {
    slides.forEach(enter);
  }

  function goTo(index) {
    var clamped = Math.max(0, Math.min(slides.length - 1, index));
    // window.scrollTo rather than scrollIntoView: identical result, but
    // reliable across embedded/automated browser contexts.
    var top = slides[clamped].getBoundingClientRect().top + window.pageYOffset;
    // "instant", not "auto": auto defers to the CSS scroll-behavior (smooth),
    // which must not animate under reduced motion.
    window.scrollTo({ top: top, behavior: reduceMotion ? "instant" : "smooth" });
  }

  if (prevBtn) prevBtn.addEventListener("click", function () { goTo(activeIndex - 1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { goTo(activeIndex + 1); });

  document.addEventListener("keydown", function (event) {
    var tag = (event.target && event.target.tagName) || "";
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag)) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "ArrowDown": case "ArrowRight": case "PageDown":
        event.preventDefault(); goTo(activeIndex + 1); break;
      case "ArrowUp": case "ArrowLeft": case "PageUp":
        event.preventDefault(); goTo(activeIndex - 1); break;
      case "Home": event.preventDefault(); goTo(0); break;
      case "End": event.preventDefault(); goTo(slides.length - 1); break;
    }
  });

  // ── Build sheet ──
  var sheet = document.getElementById("build-sheet-form");
  if (sheet) {
    var totalEl = document.getElementById("bs-total-amount");
    var noteEl = document.getElementById("bs-total-note");
    var cta = document.getElementById("bs-cta");
    var target = parseInt(sheet.getAttribute("data-target-total"), 10) || 0;
    var baseHref = cta ? cta.getAttribute("data-base-href") : null;

    function money(n) { return "$" + n.toLocaleString("en-US"); }

    function recalc() {
      var boxes = sheet.querySelectorAll("input[type=checkbox]");
      var total = 0;
      var ids = [];
      Array.prototype.forEach.call(boxes, function (box) {
        if (box.checked) {
          total += parseInt(box.getAttribute("data-price"), 10) || 0;
          ids.push(box.value);
        }
      });
      if (totalEl) totalEl.textContent = money(total);
      if (noteEl) {
        noteEl.textContent = total >= target
          ? "Covers the full " + money(target) + " engagement"
          : money(target - total) + " below the " + money(target) + " engagement scope";
      }
      if (cta && baseHref) {
        cta.href = baseHref + (baseHref.indexOf("?") === -1 ? "?" : "&") + "addons=" + ids.join(",");
      }
    }
    sheet.addEventListener("change", recalc);
    recalc();
  }

  // ── Auto-play presentation mode (?autoplay=1) ──────────────
  // Turns the deck into a hands-free, fast-paced "video": each slide
  // dwells for a few seconds while a top progress bar fills, then
  // advances. Disabled entirely under reduced motion. Any manual
  // navigation pauses it so it never fights the viewer.
  var progressBar = document.getElementById("deck-progress");
  var playToggle = document.getElementById("deck-playpause");
  (function () {
    if (reduceMotion) {
      if (progressBar) progressBar.style.display = "none";
      if (playToggle) playToggle.style.display = "none";
      return;
    }
    var autoplayOn = /[?&]autoplay=1\\b/.test(window.location.search);
    var rafId = null, slideStart = 0, dwell = 6000, playing = false, apIndex = 0;

    function dwellFor(i) {
      var id = (slides[i] && slides[i].id) || "";
      if (/next-step/.test(id)) return 7000;              // let the CTA land
      if (/cover/.test(id)) return 5000;
      if (/build-sheet|investment|scorecard|roadmap|risks/.test(id)) return 8500; // dense slides
      return 6000;
    }
    function paint(ts) {
      if (!playing) return;
      var t = Math.min(1, (ts - slideStart) / dwell);
      if (progressBar) progressBar.style.transform = "scaleX(" + t + ")";
      if (t >= 1) { advance(); return; }
      rafId = requestAnimationFrame(paint);
    }
    function advance() {
      if (apIndex >= slides.length - 1) { stop(true); return; }
      apIndex += 1;
      goTo(apIndex);
      startSlide();
    }
    function startSlide() {
      slideStart = performance.now();
      dwell = dwellFor(apIndex);
      if (progressBar) progressBar.style.transform = "scaleX(0)";
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(paint);
    }
    function play() {
      playing = true;
      apIndex = activeIndex;
      document.documentElement.classList.add("autoplaying");
      if (playToggle) { playToggle.setAttribute("aria-pressed", "true"); playToggle.setAttribute("aria-label", "Pause auto-play"); playToggle.textContent = "❚❚"; }
      startSlide();
    }
    function stop(ended) {
      playing = false;
      if (rafId) cancelAnimationFrame(rafId);
      document.documentElement.classList.remove("autoplaying");
      if (progressBar) progressBar.style.transform = "scaleX(" + (ended ? 1 : 0) + ")";
      if (playToggle) { playToggle.setAttribute("aria-pressed", "false"); playToggle.setAttribute("aria-label", "Play auto-play"); playToggle.textContent = "▶"; }
    }
    if (playToggle) playToggle.addEventListener("click", function () { playing ? stop(false) : play(); });
    // Any manual navigation pauses autoplay.
    document.addEventListener("keydown", function (e) {
      if (playing && (/^(Arrow|Page|Home|End)/.test(e.key) || e.key === " ")) stop(false);
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { if (playing) stop(false); });
    if (nextBtn) nextBtn.addEventListener("click", function () { if (playing) stop(false); });
    railLinks.forEach(function (a) { a.addEventListener("click", function () { if (playing) stop(false); }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && playing) stop(false); });
    if (autoplayOn) setTimeout(play, 900);
  })();

  setActive(0);
  enter(slides[0]);
})();
`;
