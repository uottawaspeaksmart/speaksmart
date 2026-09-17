/* ---------------------------------------------------------------
   Bilingual EN / FR switching.

   The French text lives right next to the English in index.html, as
   a data-fr="..." attribute on the same tag. To change a French
   phrase, edit that attribute — nothing in here needs touching.

       <h3 data-fr="Ateliers">Workshops</h3>

   data-fr-alt="..." does the same job for an image's alt text.
----------------------------------------------------------------*/

const STORAGE_KEY = "speaksmart-lang";

const META = {
  en: {
    title: "SpeakSmart: Find Your Voice | University of Ottawa",
    description:
      "SpeakSmart is a student-led club at the University of Ottawa empowering students through public speaking, debate, and communication skills training. All students welcome.",
  },
  fr: {
    title: "SpeakSmart : trouvez votre voix | Université d'Ottawa",
    description:
      "SpeakSmart est un club étudiant de l'Université d'Ottawa qui outille les étudiants par l'art oratoire, le débat et la communication. Tous les étudiants sont les bienvenus.",
  },
};

// The English copy as authored, captured before anything swaps it.
const englishHTML = new Map();
const englishAlt = new Map();

let current = "en";
let onSwap = null;

function cacheEnglish() {
  document.querySelectorAll("[data-fr]").forEach((el) => {
    // data-en wins when present: some elements (the about statement) get
    // rebuilt by GSAP, so their live innerHTML is no longer the source text.
    englishHTML.set(el, el.dataset.en ?? el.innerHTML);
  });
  document.querySelectorAll("[data-fr-alt]").forEach((el) => {
    englishAlt.set(el, el.getAttribute("alt") ?? "");
  });
}

function apply(lang) {
  const fr = lang === "fr";

  englishHTML.forEach((en, el) => {
    el.innerHTML = fr ? el.dataset.fr : en;
  });
  englishAlt.forEach((en, el) => {
    el.setAttribute("alt", fr ? el.dataset.frAlt : en);
  });

  document.documentElement.lang = lang;
  document.title = META[lang].title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", META[lang].description);

  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.querySelectorAll(".lang__opt").forEach((opt) => {
      opt.classList.toggle("lang__opt--active", opt.dataset.lang === lang);
    });
    // Describes what pressing the button will do, not the current state.
    toggle.setAttribute(
      "aria-label",
      fr ? "Switch to English" : "Passer au français"
    );
  }

  current = lang;
}

function remember(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private browsing or blocked storage — the toggle still works,
    // the choice just won't survive a reload.
  }
}

function preferredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "fr") return saved;
  } catch {
    /* fall through to the browser's own preference */
  }
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
}

/* The language in use, for code that renders its own copy (the events list). */
export function getLang() {
  return current;
}

export function setLang(lang, { persist = true } = {}) {
  if (lang !== "en" && lang !== "fr") return;
  apply(lang);
  if (persist) remember(lang);
  onSwap?.(lang);
}

export function initI18n(options = {}) {
  onSwap = options.onSwap ?? null;
  cacheEnglish();

  const toggle = document.getElementById("langToggle");
  toggle?.addEventListener("click", () => {
    setLang(current === "fr" ? "en" : "fr");
  });

  // Don't re-persist on load — this is a read of an existing choice.
  const initial = preferredLang();
  apply(initial);
  // Always fire: apply() rewrites innerHTML, so anything built on top of
  // the copy (the word-split statement) has to be rebuilt either way.
  onSwap?.(initial);
}
