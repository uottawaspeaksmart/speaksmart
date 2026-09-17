/*
  Events come from a Google Sheet so the exec team can add one without touching
  code. See README "Adding an event" for the sheet setup and column names.

  Paste the published CSV link between the quotes below. Until then the site
  falls back to /events.json, which is also the fallback if the sheet is ever
  unreachable, so the page never shows an empty schedule.
*/
export const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT-NIaDNQ3SAs-iuUQgiBTWTqdV9mBSF7Kpzgy_Aok0H_GXthBgUuu0a7wXU-f24boymwtJp99v70Mc/pub?output=csv";

const FALLBACK_URL = "/events.json";

/* A tiny CSV reader: handles quoted fields, commas inside quotes and "" escapes,
   which is what Google Sheets emits. */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  return rows;
}

/* Column headings are matched loosely, so "Date", "date " and "DATE" all work
   and the team can reorder columns without breaking the site. */
const KEYS = {
  date: ["date"],
  time: ["time"],
  title: ["title", "event", "name"],
  titleFr: ["title fr", "titre", "title (fr)"],
  location: ["location", "where", "place"],
  description: ["description", "details", "about"],
  descriptionFr: ["description fr", "description (fr)"],
  link: ["link", "url", "rsvp", "signup"],
};

function toObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const indexOf = (names) => headers.findIndex((h) => names.includes(h));
  const cols = Object.fromEntries(
    Object.entries(KEYS).map(([key, names]) => [key, indexOf(names)])
  );

  return rows.slice(1).map((r) => {
    const get = (key) => (cols[key] >= 0 ? (r[cols[key]] ?? "").trim() : "");
    return {
      date: get("date"),
      // Sheets exports a time cell as "9:00:00 AM"; drop the seconds.
      time: get("time").replace(/^(\d{1,2}:\d{2}):\d{2}\s*/, "$1 ").trim(),
      title: get("title"),
      titleFr: get("titleFr"),
      location: get("location"),
      description: get("description"),
      descriptionFr: get("descriptionFr"),
      link: get("link"),
    };
  });
}

/* Dates are read as local calendar days. A plain "2026-10-02" would otherwise be
   parsed as UTC midnight and could show as the day before in Ottawa. */
function parseDate(value) {
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  const parsed = new Date(`${value} ${new Date().getFullYear()}`);
  if (!Number.isNaN(parsed.valueOf()) && /[a-z]/i.test(value)) return parsed;
  const loose = new Date(value);
  return Number.isNaN(loose.valueOf()) ? null : loose;
}

export async function loadEvents() {
  let list = [];

  if (SHEET_CSV_URL) {
    try {
      const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`sheet responded ${res.status}`);
      list = toObjects(parseCSV(await res.text()));
    } catch (err) {
      console.warn("Events: falling back to events.json –", err.message);
    }
  }

  if (!list.length) {
    try {
      const res = await fetch(FALLBACK_URL, { cache: "no-store" });
      if (res.ok) list = await res.json();
    } catch {
      /* Nothing to show: the section hides itself. */
    }
  }

  // Split on today's date, so an event moves to the timeline by itself the day
  // after it happens.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dated = list
    .filter((e) => e.title)
    .map((e) => ({ ...e, when: parseDate(e.date || "") }))
    .filter((e) => e.when);

  return {
    upcoming: dated.filter((e) => e.when >= today).sort((a, b) => a.when - b.when),
    past: dated.filter((e) => e.when < today).sort((a, b) => b.when - a.when),
  };
}
