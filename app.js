/*
 * Darts TV Guide — app logic.
 *
 * Primary view is a day-by-day TV listing built from two layers:
 *   1. curated tournament sessions (data.js) — the full 12 months ahead
 *   2. live broadcast data pulled on demand from Sky's public EPG (~8 days
 *      ahead, all UK channels) — the source of truth for which channel a
 *      session actually airs on, since Sky only locks that in near the day.
 * A second tab shows the same data grouped by tournament.
 */

'use strict';

const EPG_BASE = 'https://awk.epgsky.com/hawk/linear';
const EPG_REGION = '4101/1'; // London bouquet — channel line-up is national for sport
const EPG_DAYS = 8;
const CACHE_KEY = 'dartsEpgCache.v1';
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // auto-refresh if older than 6h

// Channels we always scan (sid → display name). The services list is also
// searched at refresh time for pop-up channels (e.g. "Sky Sports Darts") and S4C.
const BASE_CHANNELS = {
  '4002': 'Sky Sports Main Event',
  '4022': 'Sky Sports Action',
  '4090': 'Sky Sports Mix',
  '3940': 'Sky Sports+',
  '6534': 'ITV4',
};

const CATEGORIES = {
  'major': { label: 'Major', cls: 'cat-major' },
  'premier-league': { label: 'Premier League', cls: 'cat-pl' },
  'world-series': { label: 'World Series', cls: 'cat-ws' },
  'wdf-modus': { label: 'WDF', cls: 'cat-wdf' },
};

const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
const fmtDayShort = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short' });
const fmtDayLong = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long' });
const fmtIsoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD

let epg = null;          // { fetchedAt, channels: {sid:name}, programmes: [...] }
let activeFilter = 'all';
let activeView = 'guide';

// ---------------------------------------------------------------------------
// EPG fetching
// ---------------------------------------------------------------------------

function prettifyChannelName(raw) {
  return raw
    .replace(/\bHD\b/g, '')
    .replace(/SkySp(orts)?/, 'Sky Sports ')
    .replace('MainEv', 'Main Event')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`EPG request failed (${res.status})`);
  return res.json();
}

async function discoverChannels() {
  const channels = { ...BASE_CHANNELS };
  try {
    const data = await fetchJson(`${EPG_BASE}/services/${EPG_REGION}`);
    for (const svc of data.services || []) {
      const name = svc.t || '';
      // Pop-up darts channel (appears during the Worlds) and S4C for Lakeside.
      if (/darts/i.test(name)) channels[svc.sid] = prettifyChannelName(name);
      if (/^S4C/i.test(name) && !Object.values(channels).includes('S4C')) channels[svc.sid] = 'S4C';
    }
  } catch (err) {
    console.warn('Channel discovery failed, using base channel list', err);
  }
  return channels;
}

function epgDateParam(offsetDays) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return fmtIsoDate.format(d).replace(/-/g, '');
}

async function fetchEpg() {
  const channels = await discoverChannels();
  const sids = Object.keys(channels);
  const programmes = [];

  const dayFetches = [];
  for (let day = 0; day < EPG_DAYS; day++) {
    dayFetches.push(
      fetchJson(`${EPG_BASE}/schedule/${epgDateParam(day)}/${sids.join(',')}`)
        .then((data) => {
          for (const sch of data.schedule || []) {
            for (const ev of sch.events || []) {
              const title = ev.t || '';
              if (!/dart/i.test(title)) continue;
              programmes.push({
                sid: sch.sid,
                channel: channels[sch.sid] || sch.sid,
                title,
                synopsis: ev.sy || '',
                start: ev.st * 1000,
                end: (ev.st + ev.d) * 1000,
                live: /^live\b/i.test(title),
              });
            }
          }
        })
        .catch((err) => console.warn(`EPG day ${day} failed`, err))
    );
  }
  await Promise.all(dayFetches);

  // Dedupe identical entries (same channel, start, title) across day boundaries.
  const seen = new Set();
  const unique = programmes.filter((p) => {
    const key = `${p.sid}|${p.start}|${p.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.start - b.start);

  return { fetchedAt: Date.now(), channels, programmes: unique };
}

async function refresh(manual) {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  btn.disabled = true;
  setStatus('Checking TV listings…');
  try {
    epg = await fetchEpg();
    localStorage.setItem(CACHE_KEY, JSON.stringify(epg));
    renderAll();
  } catch (err) {
    console.error(err);
    setStatus(manual ? 'Couldn’t reach the TV guide — check your connection.' : '');
    renderAll();
  } finally {
    btn.classList.remove('spinning');
    btn.disabled = false;
  }
}

function setStatus(text) {
  document.getElementById('statusLine').textContent = text;
}

function updatedLabel() {
  if (!epg) return 'TV listings not loaded yet — tap Refresh.';
  const mins = Math.round((Date.now() - epg.fetchedAt) / 60000);
  const when = mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
  return `TV listings updated ${when}`;
}

// ---------------------------------------------------------------------------
// Matching EPG programmes to tournament sessions
// ---------------------------------------------------------------------------

function programmesForTournament(t) {
  if (!epg || !t.epgKeywords || !t.epgKeywords.length) return [];
  return epg.programmes.filter((p) => {
    const title = p.title.toLowerCase();
    return t.epgKeywords.some((k) => title.includes(k));
  });
}

function liveProgrammesOnDate(tournamentProgrammes, sessionDate) {
  return tournamentProgrammes.filter(
    (p) => p.live && fmtIsoDate.format(new Date(p.start)) === sessionDate
  );
}

// Pick the airing(s) closest to the session start time; simulcasts share a start.
function airingsNearTime(dayProgrammes, sessionDate, sessionTime) {
  if (!dayProgrammes.length) return [];
  const target = new Date(`${sessionDate}T${sessionTime || '12:00'}:00`).getTime();
  let best = Infinity;
  for (const p of dayProgrammes) best = Math.min(best, Math.abs(p.start - target));
  // Keep airings starting within 90 min of the closest one (captures simulcasts
  // and build-up programmes that start slightly before the session).
  const bestStart = dayProgrammes.find((p) => Math.abs(p.start - target) === best).start;
  return dayProgrammes.filter((p) => Math.abs(p.start - bestStart) <= 90 * 60000);
}

const epgKey = (p) => `${p.sid}|${p.start}|${p.title}`;

// ---------------------------------------------------------------------------
// Guide entries: curated sessions + EPG merged into one TV-style schedule
// ---------------------------------------------------------------------------

function buildGuideEntries() {
  const todayIso = fmtIsoDate.format(new Date());
  const entries = [];
  const usedEpg = new Set();

  for (const t of TOURNAMENTS) {
    if (!t.sessions || !t.sessions.length) continue;
    const tProgs = programmesForTournament(t);

    for (const s of t.sessions) {
      if (s.date < todayIso) continue;
      const airings = airingsNearTime(liveProgrammesOnDate(tProgs, s.date), s.date, s.time);

      if (airings.length) {
        airings.forEach((p) => usedEpg.add(epgKey(p)));
        entries.push({
          date: s.date,
          ts: airings[0].start,
          end: Math.max(...airings.map((p) => p.end)),
          time: fmtTime.format(new Date(airings[0].start)),
          channels: [...new Set(airings.map((p) => p.channel))],
          title: t.name,
          sub: s.label,
          category: t.category,
          status: 'epg',
        });
      } else {
        entries.push({
          date: s.date,
          ts: new Date(`${s.date}T${s.time || '23:59'}:00`).getTime(),
          end: null,
          time: s.time || 'TBC',
          channels: [t.tv.uk],
          title: t.name,
          sub: s.label,
          category: t.category,
          status: s.status, // confirmed | expected
        });
      }
    }
  }

  // EPG programmes not tied to a curated session (extra airings, highlights,
  // repeats, anything we didn't predict). Only shown under the "All" filter.
  if (epg) {
    const now = Date.now();
    const groups = new Map(); // simulcasts: same start + title
    for (const p of epg.programmes) {
      if (usedEpg.has(epgKey(p)) || p.end < now) continue;
      const key = `${p.start}|${p.title}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    for (const airings of groups.values()) {
      const p = airings[0];
      entries.push({
        date: fmtIsoDate.format(new Date(p.start)),
        ts: p.start,
        end: Math.max(...airings.map((a) => a.end)),
        time: fmtTime.format(new Date(p.start)),
        channels: [...new Set(airings.map((a) => a.channel))],
        title: p.title.replace(/^Live\s*/i, ''),
        sub: p.live ? '' : 'Highlights / repeat',
        category: null,
        status: p.live ? 'epg' : 'rerun',
      });
    }
  }

  entries.sort((a, b) => a.ts - b.ts || a.title.localeCompare(b.title));
  return entries;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function channelChip(name, live) {
  const isSky = /sky/i.test(name);
  const isItv = /itv/i.test(name);
  const chip = el('span', 'chip ' + (isSky ? 'chip-sky' : isItv ? 'chip-itv' : 'chip-other'), name);
  if (live) chip.classList.add('chip-live');
  return chip;
}

function statusBadge(status) {
  if (status === 'epg') return el('span', 'badge badge-confirmed', '✓ TV guide');
  if (status === 'expected') return el('span', 'badge badge-expected', 'expected time');
  return null;
}

function renderOnAir() {
  const box = document.getElementById('onAir');
  box.innerHTML = '';
  if (!epg) { box.hidden = true; return; }
  const now = Date.now();
  const current = epg.programmes.filter((p) => p.live && p.start <= now && now < p.end);
  if (!current.length) { box.hidden = true; return; }

  box.hidden = false;
  const byTitle = new Map();
  for (const p of current) {
    if (!byTitle.has(p.title)) byTitle.set(p.title, []);
    byTitle.get(p.title).push(p);
  }
  for (const [title, airings] of byTitle) {
    const row = el('div', 'onair-row');
    row.append(el('span', 'live-dot'));
    const info = el('div', 'onair-info');
    info.append(el('div', 'onair-title', title.replace(/^Live\s*/i, '')));
    const chips = el('div', 'chips');
    for (const a of airings) {
      const chip = channelChip(a.channel, true);
      chip.textContent += ` · until ${fmtTime.format(new Date(a.end))}`;
      chips.append(chip);
    }
    info.append(chips);
    row.append(info);
    box.append(row);
  }
}

function renderGuide() {
  const box = document.getElementById('guide');
  const nav = document.getElementById('dayNav');
  box.innerHTML = '';
  nav.innerHTML = '';

  const todayIso = fmtIsoDate.format(new Date());
  const tomorrowIso = fmtIsoDate.format(new Date(Date.now() + 86400000));
  const now = Date.now();

  // Hide programmes that have finished. Where the EPG hasn't told us the end
  // time, assume a session lasts ~5.5 hours.
  const FALLBACK_SESSION_MS = 5.5 * 3600000;
  const entries = buildGuideEntries()
    .filter((e) => (e.end ? e.end > now : e.ts + FALLBACK_SESSION_MS > now))
    .filter((e) => (activeFilter === 'all' ? true : e.category === activeFilter));

  if (!entries.length) {
    box.append(el('p', 'muted', 'No televised darts found for this filter.'));
    return;
  }

  // Month quick-jump chips.
  const months = [];
  for (const e of entries) {
    const m = e.date.slice(0, 7);
    if (!months.includes(m)) months.push(m);
  }
  const todayBtn = el('button', 'daynav-chip', 'Today');
  todayBtn.addEventListener('click', () => window.scrollTo(0, 0));
  nav.append(todayBtn);
  for (const m of months) {
    const label = new Date(m + '-15T12:00:00')
      .toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'Europe/London' });
    const btn = el('button', 'daynav-chip', label);
    btn.addEventListener('click', () => {
      const target = document.getElementById('month-' + m);
      if (target) target.scrollIntoView({ block: 'start' });
    });
    nav.append(btn);
  }

  let currentDay = '';
  let currentMonth = '';
  let dayBlock = null;

  for (const e of entries) {
    if (e.date !== currentDay) {
      currentDay = e.date;
      const month = e.date.slice(0, 7);

      const head = el('div', 'guide-day-head');
      if (month !== currentMonth) {
        currentMonth = month;
        head.id = 'month-' + month;
      }
      const d = new Date(e.date + 'T12:00:00');
      const dayName = e.date === todayIso ? 'Today' : e.date === tomorrowIso ? 'Tomorrow' : null;
      head.append(el('span', 'guide-day-name', dayName || fmtDayLong.format(d).split(' ')[0]));
      head.append(el('span', 'guide-day-date', fmtDayLong.format(d).replace(/^\S+\s/, '')));
      if (e.date === todayIso) head.classList.add('guide-day-today');
      box.append(head);

      dayBlock = el('div', 'guide-day');
      box.append(dayBlock);
    }

    const row = el('div', 'guide-row');
    if (e.status === 'rerun') row.classList.add('guide-rerun');
    const onAirNow = e.status === 'epg' && e.ts <= now && e.end && now < e.end;

    const timeCol = el('div', 'guide-time');
    timeCol.append(el('div', null, e.time));
    if (onAirNow) timeCol.append(el('span', 'live-dot'));
    row.append(timeCol);

    const info = el('div', 'guide-info');
    const titleLine = el('div', 'guide-title', e.title);
    if (e.category) {
      const cat = CATEGORIES[e.category];
      titleLine.append(el('span', 'tag ' + cat.cls, cat.label));
    }
    info.append(titleLine);
    if (e.sub) info.append(el('div', 'guide-sub', e.sub));

    const chips = el('div', 'chips');
    for (const c of e.channels) chips.append(channelChip(c, e.status === 'epg'));
    const badge = statusBadge(e.status);
    if (badge) chips.append(badge);
    info.append(chips);

    row.append(info);
    dayBlock.append(row);
  }
}

// ---------------------------------------------------------------------------
// Tournaments view
// ---------------------------------------------------------------------------

function sessionRow(session, tournamentProgrammes) {
  const row = el('div', 'session-row');
  const d = new Date(session.date + 'T12:00:00');
  row.append(el('div', 'session-date', fmtDayShort.format(d)));

  const info = el('div', 'session-info');
  const top = el('div', 'session-label');
  top.textContent = `${session.time !== 'TBC' ? session.time + ' — ' : ''}${session.label}`;
  info.append(top);

  const dayProgs = liveProgrammesOnDate(tournamentProgrammes, session.date);
  const airings = airingsNearTime(dayProgs, session.date, session.time);

  const chips = el('div', 'chips');
  if (airings.length) {
    chips.append(el('span', 'badge badge-confirmed', '✓ TV guide'));
    for (const a of airings) {
      const chip = channelChip(a.channel, true);
      chip.textContent += ` ${fmtTime.format(new Date(a.start))}`;
      chips.append(chip);
    }
  } else if (session.status === 'expected') {
    chips.append(el('span', 'badge badge-expected', 'expected time'));
  }
  if (chips.childNodes.length) info.append(chips);

  row.append(info);
  if (session.date < fmtIsoDate.format(new Date())) row.classList.add('session-past');
  return row;
}

function tournamentCard(t) {
  const card = el('article', 'card');
  const todayIso = fmtIsoDate.format(new Date());
  if (t.start <= todayIso && todayIso <= t.end && !t.ongoing) card.classList.add('card-active');

  const head = el('div', 'card-head');
  const titleWrap = el('div', 'card-titlewrap');
  titleWrap.append(el('h2', 'card-title', t.name));

  const meta = el('div', 'card-meta');
  const startD = new Date(t.start + 'T12:00:00');
  const endD = new Date(t.end + 'T12:00:00');
  const dateRange = t.ongoing ? 'Most weeks, year-round'
    : t.start === t.end ? fmtDayShort.format(startD)
    : `${fmtDayShort.format(startD)} – ${fmtDayShort.format(endD)}`;
  const place = [t.venue, t.city].filter((s) => s && s !== 'TBC' && s !== 'Various').join(', ') || t.city;
  meta.textContent = `${dateRange} · ${place}`;
  titleWrap.append(meta);
  head.append(titleWrap);

  const tags = el('div', 'card-tags');
  const cat = CATEGORIES[t.category];
  tags.append(el('span', 'tag ' + cat.cls, cat.label));
  if (t.status === 'provisional') tags.append(el('span', 'badge badge-provisional', 'dates TBC'));
  head.append(tags);
  card.append(head);

  const tvLine = el('div', 'tv-line');
  tvLine.append(channelChip(t.tv.uk, false));
  tvLine.append(el('span', 'tv-detail', t.tv.detail));
  card.append(tvLine);

  if (t.notes) card.append(el('p', 'card-notes', t.notes));

  const tournamentProgrammes = programmesForTournament(t);

  if (t.sessions && t.sessions.length) {
    const details = document.createElement('details');
    const upcoming = t.sessions.filter((s) => s.date >= todayIso).length;
    const summary = el('summary', null,
      `Sessions (${upcoming ? upcoming + ' upcoming' : t.sessions.length})`);
    details.append(summary);
    const wrap = el('div', 'sessions');
    for (const s of t.sessions) wrap.append(sessionRow(s, tournamentProgrammes));
    details.append(wrap);
    const active = t.start <= todayIso && todayIso <= t.end;
    if (active) details.open = true;
    card.append(details);
  }

  return card;
}

function renderTournaments() {
  const box = document.getElementById('tournaments');
  box.innerHTML = '';
  const todayIso = fmtIsoDate.format(new Date());

  const visible = TOURNAMENTS
    .filter((t) => t.end >= todayIso)
    .filter((t) => activeFilter === 'all' || t.category === activeFilter)
    .sort((a, b) => (a.ongoing ? 1 : b.ongoing ? -1 : a.start.localeCompare(b.start)));

  if (!visible.length) {
    box.append(el('p', 'muted', 'Nothing in this category over the next 12 months.'));
    return;
  }

  let currentMonth = '';
  for (const t of visible) {
    if (!t.ongoing) {
      const month = new Date(t.start + 'T12:00:00')
        .toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' });
      if (month !== currentMonth) {
        currentMonth = month;
        box.append(el('h2', 'month-head', month));
      }
    } else if (currentMonth !== 'ongoing') {
      currentMonth = 'ongoing';
      box.append(el('h2', 'month-head', 'Ongoing'));
    }
    box.append(tournamentCard(t));
  }
}

function renderAll() {
  // Each section renders independently so one failure can't blank the page.
  const sections = [
    () => setStatus(updatedLabel()),
    renderOnAir,
    renderGuide,
    renderTournaments,
    () => {
      document.getElementById('reviewedLine').textContent =
        `Tournament data last reviewed ${new Date(DATA_REVIEWED + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    },
  ];
  for (const render of sections) {
    try { render(); } catch (err) { console.error(err); }
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function setView(view) {
  activeView = view;
  document.getElementById('guideView').hidden = view !== 'guide';
  document.getElementById('tournamentsView').hidden = view !== 'tournaments';
  document.querySelectorAll('.tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.view === view));
}

function initTabs() {
  document.querySelectorAll('.tab').forEach((btn) =>
    btn.addEventListener('click', () => setView(btn.dataset.view)));
}

function initTodayButton() {
  const btn = document.getElementById('todayBtn');
  btn.addEventListener('click', () => window.scrollTo(0, 0));
  const update = () => { btn.hidden = window.scrollY < 600; };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initPullToRefresh() {
  const ptr = document.getElementById('ptr');
  if (!ptr) return;
  const THRESHOLD = 80; // pull distance (after damping) that arms a refresh
  let startY = null;
  let dist = 0;
  let pulling = false;

  const drag = (d) => {
    ptr.style.transition = 'none';
    ptr.style.opacity = d > 8 ? '1' : '0';
    ptr.style.transform = `translateY(${d}px)`;
    ptr.classList.toggle('armed', d >= THRESHOLD);
  };
  const settle = (d, keepVisible) => {
    ptr.style.transition = 'transform 0.2s, opacity 0.2s';
    ptr.style.transform = `translateY(${d}px)`;
    if (!keepVisible) ptr.style.opacity = '0';
  };

  window.addEventListener('touchstart', (e) => {
    startY = window.scrollY <= 0 ? e.touches[0].clientY : null;
    dist = 0;
    pulling = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    dist = (e.touches[0].clientY - startY) * 0.5; // damping
    if (dist > 0 && window.scrollY <= 0) {
      pulling = true;
      if (e.cancelable) e.preventDefault(); // suppress rubber-band/native pull
      drag(Math.min(dist, 130));
    } else if (pulling) {
      pulling = false;
      drag(0);
    }
  }, { passive: false });

  window.addEventListener('touchend', async () => {
    if (startY === null) return;
    const fire = pulling && dist >= THRESHOLD;
    startY = null;
    pulling = false;
    if (fire) {
      ptr.classList.remove('armed');
      ptr.classList.add('refreshing');
      settle(THRESHOLD, true);
      await refresh(true);
      ptr.classList.remove('refreshing');
    }
    ptr.classList.remove('armed');
    settle(0, false);
  });
}

function initFilters() {
  const bar = document.getElementById('filters');
  const filters = [['all', 'All'], ['major', 'Majors'], ['premier-league', 'Premier League'],
    ['world-series', 'World Series'], ['wdf-modus', 'WDF']];
  for (const [key, label] of filters) {
    const btn = el('button', 'filter' + (key === 'all' ? ' active' : ''), label);
    btn.addEventListener('click', () => {
      activeFilter = key;
      bar.querySelectorAll('.filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGuide();
      renderTournaments();
    });
    bar.append(btn);
  }
}

function init() {
  initTabs();
  initFilters();
  initTodayButton();
  initPullToRefresh();
  document.getElementById('refreshBtn').addEventListener('click', () => refresh(true));

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && cached.programmes) epg = cached;
  } catch { /* ignore corrupt cache */ }

  renderAll();

  if (!epg || Date.now() - epg.fetchedAt > CACHE_MAX_AGE_MS) {
    refresh(false);
  }

  // Keep "on air now" and live row markers fresh while the page is open.
  setInterval(() => { renderOnAir(); if (activeView === 'guide') renderGuide(); }, 60000);
}

init();
