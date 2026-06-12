# 🎯 Darts TV Guide

A mobile-first, single-page guide to every darts tournament on UK broadcast TV
over the next 12 months — PDC majors, Premier League, World Series and WDF
Lakeside — with session times and, crucially, the **exact channel** each
session airs on. Online-only content (PDC TV European Tour streams, MODUS
Super Series) is deliberately excluded: if it's listed, it's on telly.

## How it stays accurate

Sky frequently shuffles darts between Main Event, Action, Mix and Sky Sports+
(and launches a pop-up *Sky Sports Darts* channel for the Worlds), and only
finalises this close to the day. The site handles that honestly, in two layers:

1. **Curated calendar** (`data.js`) — official tournament dates, venues and
   broadcasters. Sessions are marked `confirmed` (officially published) or
   `expected` (the event's usual pattern, shown with an amber badge).
2. **Live TV-guide lookup** — the **Refresh** button queries Sky's public EPG
   (`awk.epgsky.com`, which lists all UK channels including ITV4 and S4C) for
   the next 8 days, finds every darts programme, and stamps a green
   **✓ TV guide** badge with the actual channel(s) and start time onto matching
   sessions. It also auto-detects the Sky Sports Darts pop-up channel when it
   appears in the EPG. Results are cached in the browser (localStorage) and
   auto-refreshed when older than 6 hours.

No backend, no build step — the EPG API sends `Access-Control-Allow-Origin: *`,
so the browser calls it directly.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell |
| `style.css` | Mobile-first dark theme |
| `data.js` | Curated tournament/session data (edit this to update the calendar) |
| `app.js` | Rendering + live EPG refresh logic |

## Deploying to GitHub Pages (free)

```bash
cd new-darts-schedule
git init && git add index.html style.css app.js data.js README.md
git commit -m "Darts TV guide"
gh repo create darts-tv-guide --public --source=. --push
gh api repos/{owner}/darts-tv-guide/pages -X POST \
  -f "source[branch]=main" -f "source[path]=/"
```

Or via the web UI: create a repo, upload the four site files, then
**Settings → Pages → Deploy from branch → main /(root)**. The site appears at
`https://<your-username>.github.io/darts-tv-guide/`. Add it to your phone's
home screen for an app-like experience.

It also works opened straight from the file system (double-click
`index.html`) or on Netlify/Cloudflare Pages — it's just static files.

## Updating the calendar

`data.js` was last reviewed **12 June 2026**. Things that will need a manual
update as the PDC/WDF announce them:

- 2027 provisional entries (Bahrain/Saudi Masters, World Masters, Premier
  League nights & venues, UK Open, World Cup)
- World Championship session-by-session schedule (published ~November 2026)
- WDF Lakeside 2026 broadcaster confirmation

Ask Claude to "re-research and update data.js in the darts schedule project"
periodically — each entry carries a `status` flag so provisional data is always
visibly badged in the UI rather than silently wrong.
