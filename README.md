# SpeakSmart Website — Owner's Manual

The official site for **SpeakSmart**, the student-led communication club at the
University of Ottawa. Live at the Vercel URL (see "Publishing changes" below).

This guide is written for everyone on the team — **no coding experience needed**
for most changes.

---

## What's in this folder?

| File / folder | What it is | Touch it? |
|---|---|---|
| `index.html` | **All the words on the site** — every headline, paragraph, button | ✅ Yes — edit text freely |
| `public/assets/` | Images & files: logo, founder photo, constitution PDF | ✅ Yes — swap files here |
| `src/style.css` | Colors, fonts, spacing | ⚠️ Careful — small tweaks OK |
| `src/main.js`, `src/particles.js` | Animations and the 3D particle logo | 🛑 Ask for help |
| `node_modules/`, `dist/`, `.claude/` | Machine-generated stuff | 🛑 Never edit, never delete |

---

## How to change the words on the site

1. Open `index.html` in any text editor (TextEdit works; [VS Code](https://code.visualstudio.com) is nicer).
2. Press `Cmd+F` and search for the sentence you want to change — the text
   reads like normal English in there.
3. Change it, save the file.
4. Publish (see below).

**Examples of things you can safely change this way:** event names and
descriptions, the mission text, stats, the founder quote, the email address,
the Instagram link, section titles.

## How to swap an image or the constitution PDF

Drop the new file into `public/assets/` **using the exact same filename** as
the old one:

- Logo: `speaksmart_logo.svg`
- Founder photo: `founder-headshot.jpg`
- Constitution: `speaksmart-constitution.pdf`

Same name = nothing else needs to change.

## How to preview your changes before publishing

In Terminal:

```bash
cd ~/dev/speaksmart
npm run dev
```

Then open **http://localhost:5173** in your browser. It live-updates as you
save files. Press `Ctrl+C` in Terminal to stop.

## Publishing changes to the live site

```bash
cd ~/dev/speaksmart
npx vercel --prod
```

That's it — live in about a minute.

*(If the project gets connected to GitHub later, publishing becomes automatic:
every `git push` updates the live site.)*

---

## When to ask for (AI or human) help

- Adding a whole new section or page
- Changing the layout, fonts, or color scheme
- Anything involving the animations or the particle logo
- Something looks broken after an edit — don't panic, nothing is lost:
  `git checkout -- .` in Terminal undoes all unsaved-to-git changes

## Quick facts

- Built with [Vite](https://vitejs.dev), [GSAP](https://gsap.com) (animations),
  [Three.js](https://threejs.org) (particle logo), and
  [Lenis](https://lenis.darkroom.engineering) (smooth scroll)
- Fonts: Philosopher (headlines) + Mulish (body), loaded from Google Fonts
- Hosted on [Vercel](https://vercel.com) — free plan
- Contact: speaksmart.uottawa@gmail.com
