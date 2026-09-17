import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initParticles } from "./particles.js";
import { initI18n, getLang } from "./i18n.js";
import { loadEvents } from "./events.js";

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Smooth scroll ---------- */
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// Anchor links route through Lenis
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  });
});

/* ---------- Custom scrollbar ---------- */
// A rail on the right showing how far through the page you are. The thumb
// stretches with scroll speed, ticks mark each section, and the whole thing can
// be dragged or clicked to move through the page.
const scrollbar = document.getElementById("scrollbar");
const scrollbarRail = document.getElementById("scrollbarRail");
const scrollbarThumb = document.getElementById("scrollbarThumb");
const scrollbarFill = document.getElementById("scrollbarFill");
const scrollbarPercent = document.getElementById("scrollbarPercent");

if (scrollbar && window.matchMedia("(min-width: 861px)").matches) {
  // Sections that get a tick, in page order. The dark ones flip the rail's
  // colours while they're on screen.
  const SECTIONS = [
    { id: "hero", dark: false },
    { id: "about", dark: false },
    { id: "pillars", dark: true },
    { id: "events", dark: true },
    { id: "calendar", dark: false },
    { id: "founder", dark: false },
    { id: "constitution", dark: false },
    { id: "team", dark: false },
    { id: "join", dark: true },
  ].filter((s) => document.getElementById(s.id));

  const ticks = SECTIONS.map((section) => {
    const tick = document.createElement("div");
    tick.className = "scrollbar__tick";
    scrollbarRail.appendChild(tick);
    return { ...section, el: tick, start: 0 };
  });

  // Where each section sits as a fraction of the page, so ticks line up with
  // the thumb. Recalculated whenever the layout changes.
  function placeTicks() {
    const max = ScrollTrigger.maxScroll(window) || 1;
    ticks.forEach((t) => {
      const el = document.getElementById(t.id);
      t.start = Math.min(el.getBoundingClientRect().top + window.scrollY, max) / max;
      t.el.style.top = `${t.start * 100}%`;
    });
  }
  placeTicks();
  ScrollTrigger.addEventListener("refresh", placeTicks);

  const railHeight = () => scrollbarRail.clientHeight;

  // The thumb doesn't sit exactly where the page is. It chases that position on
  // a spring, so it lags while you scroll (resistance) and overshoots slightly
  // before settling (bounce). SPRING pulls it towards the target, DAMPING bleeds
  // off the momentum; lower damping = more wobble.
  const SPRING = 0.14;
  const DAMPING = 0.76;
  // Near a tick the spring gains a second, stronger pull towards it, so the
  // thumb noticeably clicks into section marks instead of drifting past.
  const MAGNET_RANGE = 0.035;
  const MAGNET_FORCE = 0.2;

  let progress = 0; // where the page actually is
  let pos = 0; // where the thumb is drawn
  let vel = 0;
  let rendered = -1;
  let stretch = 1;
  let activeTick = -1;
  let dragging = false;

  function paint() {
    const travel = railHeight() - scrollbarThumb.offsetHeight;
    scrollbarThumb.style.transform = `translateY(${pos * travel}px) scaleY(${stretch}) scaleX(${
      1 / (1 + (stretch - 1) * 0.55)
    })`;
    scrollbarFill.style.height = `${Math.min(Math.max(pos, 0), 1) * 100}%`;

    const pct = Math.round(progress * 100);
    if (pct !== rendered) {
      rendered = pct;
      scrollbarPercent.textContent = String(pct).padStart(2, "0");
    }

    // Each tick lengthens as the thumb nears it, strongest at a direct hit.
    // They scale from their right edge, away from the thumb, so a grown tick
    // still can't touch it. That's the visual half of the magnetism.
    let current = 0;
    for (let i = 0; i < ticks.length; i++) {
      const t = ticks[i];
      const pull = Math.max(0, 1 - Math.abs(pos - t.start) / (MAGNET_RANGE * 2.4));
      t.el.style.transform = `scaleX(${1 + pull * 1.7})`;
      t.el.style.opacity = String(0.55 + pull * 0.45);
      if (progress + 0.02 >= t.start) current = i;
    }

    if (current !== activeTick) {
      ticks[activeTick]?.el.classList.remove("scrollbar__tick--active");
      ticks[current].el.classList.add("scrollbar__tick--active");
      scrollbar.classList.toggle("scrollbar--dark", ticks[current].dark);
      activeTick = current;
    }
  }

  gsap.ticker.add(() => {
    const max = ScrollTrigger.maxScroll(window) || 1;
    if (!dragging) progress = Math.min(Math.max(window.scrollY / max, 0), 1);

    if (reduceMotion) {
      pos = progress;
      stretch = 1;
      paint();
      return;
    }

    // Spring towards the page position.
    vel += (progress - pos) * SPRING;

    // Magnetic snap: only once the page itself has nearly stopped, so it
    // never fights an active scroll.
    if (Math.abs(lenis.velocity) < 12) {
      let nearest = null;
      let best = MAGNET_RANGE;
      for (const t of ticks) {
        const d = t.start - pos;
        if (Math.abs(d) < best) {
          best = Math.abs(d);
          nearest = d;
        }
      }
      if (nearest !== null) {
        vel += nearest * MAGNET_FORCE * (1 - best / MAGNET_RANGE);
      }
    }

    vel *= DAMPING;
    pos += vel;

    // Speed stretches the thumb along its length. Driven by the spring's own
    // velocity, so the stretch eases off with the bounce.
    const target = 1 + Math.min(Math.abs(vel) * 26, 1.2);
    stretch += (target - stretch) * 0.2;
    paint();
  });

  // Dragging the rail scrubs the page; a plain click jumps to that point.
  const scrollToRatio = (clientY, smooth) => {
    const rect = scrollbarRail.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
    progress = ratio;
    const max = ScrollTrigger.maxScroll(window) || 1;
    lenis.scrollTo(ratio * max, { immediate: smooth === false, duration: 0.8 });
  };

  scrollbarRail.addEventListener("pointerdown", (e) => {
    dragging = true;
    vel = 0;
    scrollbarRail.setPointerCapture(e.pointerId);
    scrollToRatio(e.clientY, false);
  });
  scrollbarRail.addEventListener("pointermove", (e) => {
    if (dragging) scrollToRatio(e.clientY, false);
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    scrollbarRail.releasePointerCapture?.(e.pointerId);
  };
  scrollbarRail.addEventListener("pointerup", endDrag);
  scrollbarRail.addEventListener("pointercancel", endDrag);

  // Fades in with the rest of the page once the preloader is done.
  gsap.delayedCall(reduceMotion ? 0 : 2.2, () => scrollbar.classList.add("scrollbar--ready"));
}

/* ---------- Custom cursor ---------- */
const cursor = document.getElementById("cursor");
const cursorDot = document.getElementById("cursorDot");
if (window.matchMedia("(hover: hover)").matches) {
  const pos = { x: -100, y: -100 };
  const target = { x: -100, y: -100 };
  window.addEventListener("pointermove", (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
  });
  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.16;
    pos.y += (target.y - pos.y) * 0.16;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
  });
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    const mode = el.dataset.cursor;
    el.addEventListener("pointerenter", () => cursor.classList.add(`cursor--${mode}`));
    el.addEventListener("pointerleave", () => cursor.classList.remove(`cursor--${mode}`));
  });
}

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll(".magnetic").forEach((el) => {
  const inner = el.querySelector("span");
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: "power3.out" });
    if (inner) gsap.to(inner, { x: x * 0.12, y: y * 0.12, duration: 0.4, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => {
    gsap.to([el, inner], { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  });
});

/* ---------- Particles (hero) ---------- */
let particleAPI = null;
initParticles(document.getElementById("particleCanvas"))
  .then((api) => {
    particleAPI = api;
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => particleAPI.setScroll(self.progress),
    });
  })
  .catch((err) => console.warn("Particles disabled:", err));

/* ---------- Preloader ---------- */
const preloader = document.getElementById("preloader");
const countEl = document.getElementById("preloaderCount");
gsap.set(".hero__line-inner", { y: "110%" });
const loadTl = gsap.timeline();

loadTl
  .to(".preloader__word span", {
    y: 0,
    duration: 0.9,
    stagger: 0.045,
    ease: "power4.out",
  })
  .to(
    { n: 0 },
    {
      n: 100,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate() {
        countEl.textContent = Math.round(this.targets()[0].n);
      },
    },
    "<0.2"
  )
  .to(".preloader__word span", { y: "-120%", duration: 0.6, stagger: 0.03, ease: "power3.in" })
  .to(countEl, { opacity: 0, duration: 0.3 }, "<")
  .to(preloader, {
    yPercent: -100,
    duration: 0.9,
    ease: "power4.inOut",
    onComplete: () => preloader.remove(),
  })
  // Hero entrance
  .to(".hero__line-inner", { y: 0, duration: 1.1, stagger: 0.12, ease: "power4.out" }, "-=0.45")
  .from("#heroSub", { opacity: 0, y: 24, duration: 0.8, ease: "power3.out" }, "-=0.7")
  .from(".hero__actions .btn", { opacity: 0, y: 20, stagger: 0.1, duration: 0.7, ease: "power3.out" }, "-=0.6")
  .from(".hero__eyebrow", { opacity: 0, duration: 0.6 }, "-=0.8")
  .from("#scrollHint", { opacity: 0, duration: 0.8 }, "-=0.4")
  .from(".nav", { y: -30, opacity: 0, duration: 0.7, ease: "power3.out", clearProps: "all" }, "-=0.9");

if (reduceMotion) {
  loadTl.progress(1);
}

/* ---------- Nav hide/show on scroll ---------- */
let lastScroll = 0;
const nav = document.getElementById("nav");
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate(self) {
    const scroll = self.scroll();
    if (scroll > 120 && scroll > lastScroll + 4) nav.classList.add("nav--hidden");
    else if (scroll < lastScroll - 4) nav.classList.remove("nav--hidden");
    nav.classList.toggle("nav--solid", scroll > window.innerHeight * 0.7);
    lastScroll = scroll;
  },
});

/* ---------- Marquee: velocity-reactive ---------- */
// The track scrolls left by one copy's width, then jumps back by that width.
// For the jump to be invisible there must always be enough copies to fill the
// screen twice over, so the number of copies is derived from the viewport
// rather than fixed. Rebuilt on resize and on a language swap, since both
// change how wide a single copy is.
const track = document.getElementById("marqueeTrack");
const marqueeSource = track.firstElementChild;
let marqueeX = 0;
let marqueeSegment = 0;

function buildMarquee() {
  while (track.children.length > 1) track.lastElementChild.remove();
  marqueeSegment = marqueeSource.getBoundingClientRect().width;
  if (!marqueeSegment) return;
  const copies = Math.ceil((window.innerWidth * 2) / marqueeSegment) + 1;
  for (let i = 1; i < copies; i++) {
    track.appendChild(marqueeSource.cloneNode(true));
  }
  marqueeX = marqueeX % marqueeSegment;
}

buildMarquee();
// Web fonts land after first paint and change the text's width.
document.fonts?.ready.then(buildMarquee);
window.addEventListener("resize", buildMarquee);

gsap.ticker.add(() => {
  if (!marqueeSegment) return;
  const vel = Math.min(Math.abs(lenis.velocity) * 0.06, 4);
  marqueeX -= 0.6 + vel;
  if (-marqueeX >= marqueeSegment) marqueeX += marqueeSegment;
  track.style.transform = `translateX(${marqueeX}px)`;
});

/* ---------- About statement: word-by-word scrub ---------- */
// Rebuilt whenever the language changes, since the split depends on the copy.
const statement = document.getElementById("aboutStatement");
let statementTween;
function setupStatement() {
  statementTween?.scrollTrigger?.kill();
  statementTween?.kill();
  statement.innerHTML = statement.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="word">${w}</span>`)
    .join(" ");
  statementTween = gsap.to("#aboutStatement .word", {
    opacity: 1,
    stagger: 0.06,
    ease: "none",
    scrollTrigger: {
      trigger: "#aboutStatement",
      start: "top 80%",
      end: "bottom 45%",
      scrub: 0.6,
    },
  });
}

/* ---------- Generic reveals ---------- */
document.querySelectorAll(".reveal").forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 85%" },
  });
});

/* ---------- Stats counters ---------- */
document.querySelectorAll(".stat__num").forEach((el) => {
  const end = +el.dataset.count;
  ScrollTrigger.create({
    trigger: el,
    start: "top 85%",
    once: true,
    onEnter: () =>
      gsap.to(
        { n: 0 },
        {
          n: end,
          duration: 1.6,
          ease: "power2.out",
          onUpdate() {
            el.textContent = Math.round(this.targets()[0].n);
          },
        }
      ),
  });
});

/* ---------- Pillars entrance ---------- */
gsap.from(".pillar", {
  opacity: 0,
  y: 60,
  stagger: 0.12,
  duration: 0.9,
  ease: "power3.out",
  scrollTrigger: { trigger: ".pillars__list", start: "top 78%" },
});

/* ---------- Events: pinned horizontal scroll (desktop only) ---------- */
ScrollTrigger.matchMedia({
  "(min-width: 821px)": () => {
    const track = document.getElementById("eventsTrack");
    const getDistance = () => track.scrollWidth - document.documentElement.clientWidth;
    gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".events",
        start: "top top",
        end: () => `+=${getDistance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
  },
});

/* ---------- Founder image: clip reveal + parallax ---------- */
gsap.from("#founderImg", {
  clipPath: "inset(100% 0% 0% 0%)",
  duration: 1.3,
  ease: "power4.inOut",
  scrollTrigger: { trigger: ".founder__media", start: "top 75%" },
});
gsap.from(".founder__frame", {
  opacity: 0,
  x: 0,
  y: 0,
  duration: 1,
  delay: 0.4,
  ease: "power3.out",
  scrollTrigger: { trigger: ".founder__media", start: "top 75%" },
});
gsap.to("#founderImg", {
  yPercent: -6,
  ease: "none",
  scrollTrigger: { trigger: ".founder", start: "top bottom", end: "bottom top", scrub: true },
});

/* ---------- Constitution: values stagger + animated accordion ---------- */
gsap.from(".value", {
  opacity: 0,
  y: 50,
  stagger: 0.1,
  duration: 0.9,
  ease: "power3.out",
  scrollTrigger: { trigger: ".values", start: "top 80%" },
});

document.querySelectorAll(".article-item").forEach((item) => {
  const summary = item.querySelector("summary");
  const body = item.querySelector("p");
  summary.addEventListener("click", (e) => {
    e.preventDefault();
    if (item.open) {
      gsap.to(body, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power3.inOut",
        onComplete: () => {
          item.open = false;
          gsap.set(body, { clearProps: "all" });
        },
      });
      item.classList.remove("is-open");
    } else {
      item.open = true;
      item.classList.add("is-open");
      gsap.from(body, { height: 0, opacity: 0, duration: 0.5, ease: "power3.out" });
    }
  });
});

/* ---------- Team: president → stem → grid sequence ---------- */
gsap
  .timeline({ scrollTrigger: { trigger: ".org", start: "top 78%" } })
  .from(".role--president", { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" })
  .from(
    ".org__grid .role",
    { opacity: 0, y: 40, stagger: 0.07, duration: 0.7, ease: "power3.out" },
    "-=0.15"
  );

/* ---------- Join title: split-line reveal ---------- */
const joinTitle = document.getElementById("joinTitle");
gsap.from(joinTitle, {
  opacity: 0,
  y: 80,
  scale: 0.96,
  duration: 1.2,
  ease: "power4.out",
  scrollTrigger: { trigger: "#join", start: "top 65%" },
});

/* ---------- Calendar: upcoming events and past timeline ---------- */
// The event copy comes from the sheet rather than the page, so it's rendered
// here and re-rendered when the language changes.
const upcomingEl = document.getElementById("calendarUpcoming");
const pastEl = document.getElementById("calendarPast");
const emptyEl = document.getElementById("calendarEmpty");
const timelineWrap = document.getElementById("calendarTimelineWrap");
let eventData = null;

const escapeHTML = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function renderEvents() {
  if (!eventData || !upcomingEl) return;
  const fr = getLang() === "fr";
  const locale = fr ? "fr-CA" : "en-CA";
  const pick = (e, key) => (fr && e[`${key}Fr`] ? e[`${key}Fr`] : e[key]) || "";
  const day = (d) => d.toLocaleDateString(locale, { day: "numeric" });
  const month = (d) => d.toLocaleDateString(locale, { month: "short" }).replace(".", "");

  upcomingEl.innerHTML = eventData.upcoming
    .map((e, i) => {
      const meta = [e.time, e.location].filter(Boolean).map(escapeHTML).join(" &nbsp;·&nbsp; ");
      const desc = pick(e, "description");
      const link = e.link
        ? `<a class="event__link" href="${escapeHTML(e.link)}" target="_blank" rel="noopener" data-cursor="hover">${
            fr ? "S’inscrire" : "Sign up"
          }</a>`
        : "";
      return `<article class="event${i === 0 ? " event--next" : ""}">
        <div class="event__date">
          <span class="event__day">${day(e.when)}</span>
          <span class="event__month">${escapeHTML(month(e.when))}</span>
        </div>
        <div class="event__body">
          <h3 class="event__name">${escapeHTML(pick(e, "title"))}</h3>
          ${meta ? `<p class="event__meta">${meta}</p>` : ""}
          ${desc ? `<p class="event__desc">${escapeHTML(desc)}</p>` : ""}
        </div>
        ${link}
      </article>`;
    })
    .join("");

  const hasUpcoming = eventData.upcoming.length > 0;
  emptyEl.hidden = hasUpcoming;
  upcomingEl.hidden = !hasUpcoming;

  pastEl.innerHTML = eventData.past
    .map((e) => {
      const desc = pick(e, "description");
      return `<li class="timeline__item">
        <span class="timeline__date">${escapeHTML(
          e.when.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
        )}</span>
        <h4 class="timeline__name">${escapeHTML(pick(e, "title"))}</h4>
        ${desc ? `<p class="timeline__desc">${escapeHTML(desc)}</p>` : ""}
      </li>`;
    })
    .join("");
  timelineWrap.hidden = eventData.past.length === 0;
}

if (upcomingEl) {
  loadEvents()
    .then((data) => {
      eventData = data;
      renderEvents();
      // Cards change the page height, so anything measured from the layout
      // (pinned sections, scrollbar ticks) has to be recalculated.
      ScrollTrigger.refresh();
      const cards = document.querySelectorAll(".event, .timeline__item");
      if (!reduceMotion && cards.length) {
        gsap.from(cards, {
          opacity: 0,
          y: 30,
          stagger: 0.07,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: "#calendar", start: "top 75%" },
        });
      }
    })
    .catch((err) => console.warn("Events unavailable:", err));
}

/* ---------- Language toggle ---------- */
// Runs last so every animation above exists before the copy can change.
initI18n({
  onSwap: () => {
    setupStatement();
    buildMarquee();
    renderEvents();
    // Line lengths change with the language, so anything measured from the
    // layout (pinned horizontal events track, scroll distances) is stale.
    ScrollTrigger.refresh();
  },
});
