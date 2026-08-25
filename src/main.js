import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initParticles } from "./particles.js";

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
const track = document.getElementById("marqueeTrack");
let marqueeX = 0;
gsap.ticker.add(() => {
  const vel = Math.min(Math.abs(lenis.velocity) * 0.06, 4);
  marqueeX -= 0.6 + vel;
  const half = track.scrollWidth / 2;
  if (-marqueeX >= half) marqueeX += half;
  track.style.transform = `translateX(${marqueeX}px)`;
});

/* ---------- About statement: word-by-word scrub ---------- */
const statement = document.getElementById("aboutStatement");
statement.innerHTML = statement.textContent
  .trim()
  .split(/\s+/)
  .map((w) => `<span class="word">${w}</span>`)
  .join(" ");
gsap.to("#aboutStatement .word", {
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
  .from(".org__stem", { scaleY: 0, transformOrigin: "top", duration: 0.5, ease: "power2.inOut" }, "-=0.3")
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
