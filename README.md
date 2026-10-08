# SpeakSmart Website — Owner's Manual

The official site for **SpeakSmart**, the student-led communication club at the
University of Ottawa. Live at https://uospeaksmart.vercel.app (and at uospeaksmart.com once the
domain is connected).

This guide is written for everyone on the team — **no coding experience needed**
for most changes.

---

## What's in this folder?

| File / folder | What it is | Touch it? |
|---|---|---|
| `index.html` | **All the words on the site** — every headline, paragraph, button | ✅ Yes — edit text freely |
| `public/assets/` | Images & files: logo, founder photo, constitution PDF | ✅ Yes — swap files here |
| `src/style.css` | Colors, fonts, spacing | ⚠️ small tweaks OK |
| `src/main.js`, `src/particles.js` | Animations and the 3D particle logo | 🛑 careful |
| `node_modules/`, `dist/`, `.claude/` | Machine-generated stuff | 🛑 dont touch |

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

**The sheet is already set up and connected** — adding a row is all you need to
do. The steps below are only for replacing it with a different sheet.

<details>
<summary>Setting up a new sheet from scratch</summary>

1. Make a new Google Sheet with this header row, spelled exactly like this:

   `Date | Time | Title | Title FR | Location | Description | Description FR | Link`

   Only **Date** and **Title** are required; leave the rest blank if you like.
   The FR columns are for the French version of the site. If you leave them
   blank, French visitors see the English text.
2. **File → Share → Publish to web**. Choose that sheet, pick
   **Comma-separated values (.csv)**, and press **Publish**. Copy the link.
3. Paste the link into `src/events.js`, between the quotes on the
   `SHEET_CSV_URL` line, and commit. The site picks it up on the next build.

</details>

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

**Editing a file on GitHub publishes it by itself.** Open the file here on
github.com, click the pencil icon, make the change, and commit. Vercel rebuilds
the site within a minute or two. Nothing else to run.

If you're working on your own computer instead:

```bash
cd ~/dev/speaksmart
git add -A
git commit -m "say what you changed"
git push
```

Same result: the push publishes it. Run `git pull` before you start, in case
someone edited a file on github.com in the meantime.

---

## When to ask for (AI or human) help

- Adding a whole new section or page
- Changing the layout, fonts, or color scheme
- Anything involving the animations or the particle logo
- Something looks broken after an edit — don't panic, nothing is lost:
  `git checkout -- .` in Terminal undoes all unsaved-to-git changes

## Accounts, hosting and the domain

Everything below should live on the **club's Google account**
(`speaksmart.uottawa@gmail.com`), so it passes to the next exec team with the
email rather than belonging to any one student.

| Thing | Where it lives | What it does |
|---|---|---|
| Code | GitHub: `uottawaspeaksmart/speaksmart` | The site's files and full history |
| Hosting | Vercel (free Hobby plan), project `speaksmart` | Builds and serves the site; redeploys on every push |
| Events | Google Sheet, published to the web as CSV | The event list the site reads (see "Adding an event") |
| Domain | GoDaddy: `uospeaksmart.com` | The public address |

**How a change reaches the public:** edit a file (on github.com or on your
computer) → GitHub → Vercel rebuilds → live. Vercel is connected to the repo, so
there is no separate "publish" step and no Vercel CLI needed.

### The domain renewal — important

The domain was registered in **October 2026 for three years**, so it is paid
until **October 2029**. Auto-renew is intentionally **off** and no card is kept
on file, so nobody gets charged automatically.

**Someone must renew it before October 2029**, or the site goes dark and the
name becomes available for anyone to buy. Put a reminder in the club calendar
for **August 2029**, and mention it in every exec handover.

### Connecting the domain in Vercel (one-time, already done or to redo)

1. Vercel → the `speaksmart` project → **Settings → Domains** → add
   `uospeaksmart.com`.
2. Vercel shows the exact DNS records to enter. Copy them into GoDaddy under
   **My Products → Domain → DNS**, or switch GoDaddy's nameservers to the ones
   Vercel gives you and let Vercel handle DNS.
3. HTTPS is issued automatically; nothing to buy from GoDaddy for that.

Use whatever values the Vercel screen shows at the time rather than any written
down here — they change.

### If you ever take over this site

1. Get the login for `speaksmart.uottawa@gmail.com`.
2. That email is the GitHub, Vercel and GoDaddy account — check you can sign in
   to all three.
3. Confirm the events sheet is in that account's Google Drive.
4. Check the domain's renewal date and who is responsible for paying it.

## Quick facts

- Built with [Vite](https://vitejs.dev), [GSAP](https://gsap.com) (animations),
  [Three.js](https://threejs.org) (particle logo), and
  [Lenis](https://lenis.darkroom.engineering) (smooth scroll)
- Fonts: Philosopher (headlines) + Mulish (body), loaded from Google Fonts
- Hosted on [Vercel](https://vercel.com) — free plan
- Contact: speaksmart.uottawa@gmail.com
