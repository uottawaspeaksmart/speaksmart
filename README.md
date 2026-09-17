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

**Examples of things you can safely change this way:** the mission text, stats,
the founder quote, the email address, the Linktree link, section titles.

(Events are **not** edited here — see the next section.)

## Adding an event (no code, no publishing)

Events live in a Google Sheet. Add a row and the site picks it up on its own,
usually within about five minutes. **Upcoming and past are worked out from the
date**, so an event moves into the "Already happened" timeline by itself the day
after it runs. Nothing to move by hand, nothing to delete.

**One-time setup** (do this once, on the club's Google account):

1. Make a new Google Sheet with this header row, spelled exactly like this:

   `Date | Time | Title | Title FR | Location | Description | Description FR | Link`

   Only **Date** and **Title** are required; leave the rest blank if you like.
   The FR columns are for the French version of the site. If you leave them
   blank, French visitors see the English text.
2. **File → Share → Publish to web**. Choose that sheet, pick
   **Comma-separated values (.csv)**, and press **Publish**. Copy the link.
3. Paste the link into `src/events.js`, between the quotes on the
   `SHEET_CSV_URL` line, then publish the site once (see below). After that,
   nobody needs to touch the code again.

**Writing a row:**

- **Date**: `2026-10-02` works best. `Oct 2, 2026` also works.
- **Time**: free text, e.g. `5:30 PM`.
- **Link**: an RSVP or sign-up link. Leave it blank and no button shows.

The next event coming up is highlighted in red automatically. If there are no
upcoming events, the section shows a short "nothing scheduled" note instead of
looking broken.

**If the sheet is unreachable**, the site falls back to `public/events.json`, so
the page never breaks. That file also holds the sample events shown before the
sheet is connected.

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
