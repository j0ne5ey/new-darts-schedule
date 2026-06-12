/*
 * Curated darts tournament data: June 2026 – June 2027.
 * Last manual review: 12 June 2026.
 *
 * status (tournament): 'confirmed' = dates officially announced
 *                      'provisional' = expected based on the usual calendar slot
 * status (session):    'confirmed' = officially published session
 *                      'expected'  = typical pattern for this event, not yet published
 * All times are UK (Europe/London).
 *
 * Live channel confirmation for the next ~8 days is layered on top from the
 * Sky EPG at refresh time — see app.js.
 */

const DATA_REVIEWED = '2026-06-12';

// ---- helpers used to build session lists ----------------------------------

// Daily sessions between two dates inclusive (ISO strings), optional excluded dates.
function dailySessions(from, to, sessions, except = []) {
  const out = [];
  const d = new Date(from + 'T12:00:00Z');
  const end = new Date(to + 'T12:00:00Z');
  while (d <= end) {
    const iso = d.toISOString().slice(0, 10);
    if (!except.includes(iso)) {
      for (const s of sessions) {
        out.push({ date: iso, time: s.time, label: s.label, status: s.status || 'expected' });
      }
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

// ---- the tournaments -------------------------------------------------------

const TOURNAMENTS = [

  // ======================= JUNE 2026 =======================
  {
    id: 'world-cup-2026',
    name: 'World Cup of Darts 2026',
    category: 'major',
    start: '2026-06-11', end: '2026-06-14',
    venue: 'Eissporthalle', city: 'Frankfurt', country: 'Germany',
    tv: { uk: 'Sky Sports', detail: 'Sky Sports Main Event / Action — exact channel varies by session. Also DAZN & Viaplay internationally.' },
    status: 'confirmed',
    epgKeywords: ['world cup of darts'],
    notes: '40 nations, pairs format. Sessions are an hour earlier than UK events (German local time).',
    sessions: [
      { date: '2026-06-11', time: '18:00', label: 'First Round — Evening Session', status: 'confirmed' },
      { date: '2026-06-12', time: '11:00', label: 'First Round — Afternoon Session', status: 'confirmed' },
      { date: '2026-06-12', time: '18:00', label: 'First Round — Evening Session', status: 'confirmed' },
      { date: '2026-06-13', time: '12:00', label: 'Second Round — Afternoon Session', status: 'confirmed' },
      { date: '2026-06-13', time: '18:00', label: 'Second Round — Evening Session', status: 'confirmed' },
      { date: '2026-06-14', time: '12:00', label: 'Quarter-Finals — Afternoon Session', status: 'confirmed' },
      { date: '2026-06-14', time: '18:00', label: 'Semi-Finals & Final — Evening Session', status: 'confirmed' },
    ],
  },
  {
    id: 'us-masters-2026',
    name: 'US Darts Masters (World Series)',
    category: 'world-series',
    start: '2026-06-25', end: '2026-06-26',
    venue: 'Theatre at Madison Square Garden', city: 'New York', country: 'USA',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX. Sessions are overnight UK time (19:00 New York). North American Championship also staged Fri 26th.' },
    status: 'confirmed',
    epgKeywords: ['us darts masters', 'us masters'],
    notes: 'Eight PDC stars v eight North American qualifiers.',
    sessions: [
      { date: '2026-06-26', time: '00:00', label: 'Night 1 — First Round (overnight Thu→Fri UK)', status: 'expected' },
      { date: '2026-06-27', time: '00:00', label: 'Night 2 — Semi-Finals & Final (overnight Fri→Sat UK)', status: 'expected' },
    ],
  },

  // ======================= JULY 2026 =======================
  {
    id: 'world-matchplay-2026',
    name: 'World Matchplay 2026',
    category: 'major',
    start: '2026-07-18', end: '2026-07-26',
    venue: 'Winter Gardens', city: 'Blackpool', country: 'England',
    tv: { uk: 'Sky Sports', detail: 'Every session live on Sky Sports — typically Main Event and/or Action. Use Refresh in the final week for the exact channel.' },
    status: 'confirmed',
    epgKeywords: ['world matchplay'],
    notes: 'The Women\'s World Matchplay is staged in the Sunday 26th afternoon session.',
    sessions: [
      { date: '2026-07-18', time: '19:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-07-19', time: '13:00', label: 'First Round — Afternoon Session', status: 'expected' },
      { date: '2026-07-19', time: '19:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-07-20', time: '19:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-07-21', time: '19:00', label: 'Second Round — Evening Session', status: 'expected' },
      { date: '2026-07-22', time: '19:00', label: 'Second Round — Evening Session', status: 'expected' },
      { date: '2026-07-23', time: '19:00', label: 'Quarter-Finals — Evening Session', status: 'expected' },
      { date: '2026-07-24', time: '19:00', label: 'Quarter-Finals — Evening Session', status: 'expected' },
      { date: '2026-07-25', time: '19:00', label: 'Semi-Finals — Evening Session', status: 'expected' },
      { date: '2026-07-26', time: '13:00', label: 'Women\'s World Matchplay — Afternoon Session', status: 'expected' },
      { date: '2026-07-26', time: '18:00', label: 'Final — Evening Session', status: 'expected' },
    ],
  },

  // ======================= AUGUST 2026 =======================
  {
    id: 'nz-masters-2026',
    name: 'New Zealand Darts Masters (World Series)',
    category: 'world-series',
    start: '2026-08-14', end: '2026-08-15',
    venue: 'Spark Arena', city: 'Auckland', country: 'New Zealand',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX. Sessions are early morning UK time (19:00 Auckland).' },
    status: 'confirmed',
    epgKeywords: ['new zealand darts masters', 'nz darts masters'],
    sessions: [
      { date: '2026-08-14', time: '08:00', label: 'Night 1 — First Round (morning UK)', status: 'expected' },
      { date: '2026-08-15', time: '08:00', label: 'Night 2 — Semi-Finals & Final (morning UK)', status: 'expected' },
    ],
  },
  {
    id: 'aus-masters-2026',
    name: 'Australian Darts Masters (World Series)',
    category: 'world-series',
    start: '2026-08-21', end: '2026-08-22',
    venue: 'WIN Entertainment Centre', city: 'Wollongong', country: 'Australia',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX. Sessions are morning UK time (19:00 local).' },
    status: 'confirmed',
    epgKeywords: ['australian darts masters'],
    sessions: [
      { date: '2026-08-21', time: '10:00', label: 'Night 1 — First Round (morning UK)', status: 'expected' },
      { date: '2026-08-22', time: '10:00', label: 'Night 2 — Semi-Finals & Final (morning UK)', status: 'expected' },
    ],
  },
  // ======================= SEPTEMBER 2026 =======================
  {
    id: 'ws-finals-2026',
    name: 'World Series of Darts Finals 2026',
    category: 'world-series',
    start: '2026-09-17', end: '2026-09-20',
    venue: 'AFAS Live', city: 'Amsterdam', country: 'Netherlands',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX.' },
    status: 'confirmed',
    epgKeywords: ['world series'],
    sessions: [
      { date: '2026-09-17', time: '18:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-09-18', time: '18:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-09-19', time: '12:00', label: 'Second Round — Afternoon Session', status: 'expected' },
      { date: '2026-09-19', time: '18:00', label: 'Second Round — Evening Session', status: 'expected' },
      { date: '2026-09-20', time: '12:00', label: 'Quarter-Finals — Afternoon Session', status: 'expected' },
      { date: '2026-09-20', time: '18:00', label: 'Semi-Finals & Final — Evening Session', status: 'expected' },
    ],
  },
  {
    id: 'world-grand-prix-2026',
    name: 'World Grand Prix 2026',
    category: 'major',
    start: '2026-09-28', end: '2026-10-04',
    venue: 'Mattioli Arena', city: 'Leicester', country: 'England',
    tv: { uk: 'Sky Sports', detail: 'Every session live on Sky Sports — typically Main Event and/or Action. Double-start format.' },
    status: 'confirmed',
    epgKeywords: ['world grand prix'],
    sessions: dailySessions('2026-09-28', '2026-10-04', [
      { time: '19:00', label: 'Evening Session' },
    ]),
  },

  // ======================= OCTOBER 2026 =======================
  {
    id: 'european-championship-2026',
    name: 'European Championship 2026',
    category: 'major',
    start: '2026-10-22', end: '2026-10-25',
    venue: 'Westfalenhallen', city: 'Dortmund', country: 'Germany',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX.' },
    status: 'confirmed',
    epgKeywords: ['european championship'],
    sessions: [
      { date: '2026-10-22', time: '18:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-10-23', time: '18:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-10-24', time: '12:00', label: 'Second Round — Afternoon Session', status: 'expected' },
      { date: '2026-10-24', time: '18:00', label: 'Second Round — Evening Session', status: 'expected' },
      { date: '2026-10-25', time: '12:00', label: 'Quarter-Finals — Afternoon Session', status: 'expected' },
      { date: '2026-10-25', time: '18:00', label: 'Semi-Finals & Final — Evening Session', status: 'expected' },
    ],
  },

  // ======================= NOVEMBER 2026 =======================
  {
    id: 'grand-slam-2026',
    name: 'Grand Slam of Darts 2026',
    category: 'major',
    start: '2026-11-14', end: '2026-11-22',
    venue: 'WV Active Arena Aldersley', city: 'Wolverhampton', country: 'England',
    tv: { uk: 'Sky Sports', detail: 'Every session live on Sky Sports — typically Main Event and/or Action.' },
    status: 'confirmed',
    epgKeywords: ['grand slam'],
    notes: 'Group stage runs across the opening days with afternoon and evening sessions, then straight knockout.',
    sessions: [
      ...dailySessions('2026-11-14', '2026-11-17', [
        { time: '13:00', label: 'Group Stage — Afternoon Session' },
        { time: '19:00', label: 'Group Stage — Evening Session' },
      ]),
      { date: '2026-11-18', time: '19:00', label: 'Last 16 — Evening Session', status: 'expected' },
      { date: '2026-11-19', time: '19:00', label: 'Last 16 — Evening Session', status: 'expected' },
      { date: '2026-11-20', time: '19:00', label: 'Quarter-Finals — Evening Session', status: 'expected' },
      { date: '2026-11-21', time: '19:00', label: 'Semi-Finals — Evening Session', status: 'expected' },
      { date: '2026-11-22', time: '19:00', label: 'Final — Evening Session', status: 'expected' },
    ],
  },
  {
    id: 'pc-finals-2026',
    name: 'Players Championship Finals 2026',
    category: 'major',
    start: '2026-11-27', end: '2026-11-29',
    venue: 'Butlin\'s Resort', city: 'Minehead', country: 'England',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX.' },
    status: 'confirmed',
    epgKeywords: ['players championship'],
    sessions: [
      { date: '2026-11-27', time: '12:45', label: 'First Round — Afternoon Session', status: 'expected' },
      { date: '2026-11-27', time: '19:00', label: 'First Round — Evening Session', status: 'expected' },
      { date: '2026-11-28', time: '12:45', label: 'Second Round — Afternoon Session', status: 'expected' },
      { date: '2026-11-28', time: '19:00', label: 'Second Round — Evening Session', status: 'expected' },
      { date: '2026-11-29', time: '12:45', label: 'Quarter-Finals — Afternoon Session', status: 'expected' },
      { date: '2026-11-29', time: '19:00', label: 'Semi-Finals & Final — Evening Session', status: 'expected' },
    ],
  },
  {
    id: 'wdf-lakeside-2026',
    name: 'WDF World Championships (Lakeside)',
    category: 'wdf-modus',
    start: '2026-11-27', end: '2026-12-06',
    venue: 'Lakeside', city: 'Frimley Green', country: 'England',
    tv: { uk: 'S4C / WDF YouTube', detail: '2025 coverage was on S4C (TV + online) with early rounds free on the WDF YouTube channel. 2026 broadcaster to be confirmed.' },
    status: 'confirmed',
    epgKeywords: ['lakeside', 'wdf'],
    notes: 'Men\'s and Women\'s WDF World Championships. Note: now staged in Nov–Dec, overlapping the PDC Players Championship Finals weekend.',
    sessions: dailySessions('2026-11-27', '2026-12-06', [
      { time: '13:00', label: 'Afternoon Session' },
      { time: '19:00', label: 'Evening Session' },
    ]),
  },

  // ======================= DECEMBER 2026 → JANUARY 2027 =======================
  {
    id: 'pdc-worlds-2027',
    name: 'PDC World Darts Championship 2026/27',
    category: 'major',
    start: '2026-12-11', end: '2027-01-03',
    venue: 'Alexandra Palace (Great Hall)', city: 'London', country: 'England',
    tv: { uk: 'Sky Sports', detail: 'Every session live on Sky Sports. A dedicated Sky Sports Darts pop-up channel normally runs for the duration — Refresh will detect it automatically once it appears in the EPG.' },
    status: 'confirmed',
    epgKeywords: ['world darts championship', 'world championship'],
    notes: '96 players; first edition staged in Ally Pally\'s larger Great Hall. Tickets on sale 3 Aug 2026. Session-by-session schedule is published in November — afternoon/evening pattern below is the usual one, with a break over Christmas Eve/Day/Boxing Day.',
    sessions: [
      { date: '2026-12-11', time: '19:00', label: 'Opening Night — Evening Session', status: 'expected' },
      ...dailySessions('2026-12-12', '2026-12-23', [
        { time: '12:30', label: 'Afternoon Session' },
        { time: '19:00', label: 'Evening Session' },
      ]),
      ...dailySessions('2026-12-27', '2026-12-30', [
        { time: '12:30', label: 'Afternoon Session' },
        { time: '19:00', label: 'Evening Session' },
      ]),
      { date: '2027-01-01', time: '13:00', label: 'Quarter-Finals — Afternoon Session', status: 'expected' },
      { date: '2027-01-01', time: '19:00', label: 'Quarter-Finals — Evening Session', status: 'expected' },
      { date: '2027-01-02', time: '19:00', label: 'Semi-Finals — Evening Session', status: 'expected' },
      { date: '2027-01-03', time: '19:00', label: 'Final — Evening Session', status: 'expected' },
    ],
  },

  // ======================= JANUARY 2027 (provisional) =======================
  {
    id: 'bahrain-masters-2027',
    name: 'Bahrain Darts Masters 2027 (World Series)',
    category: 'world-series',
    start: '2027-01-14', end: '2027-01-15',
    venue: 'TBC', city: 'Sakhir', country: 'Bahrain',
    tv: { uk: 'ITV4', detail: 'World Series events are live on ITV4 / ITVX (deal runs to 2028). Sessions usually mid-afternoon UK time.' },
    status: 'provisional',
    epgKeywords: ['bahrain darts masters'],
    notes: 'Dates not yet announced — shown in the usual mid-January slot.',
    sessions: [],
  },
  {
    id: 'saudi-masters-2027',
    name: 'Saudi Arabia Darts Masters 2027 (World Series)',
    category: 'world-series',
    start: '2027-01-18', end: '2027-01-19',
    venue: 'TBC', city: 'Riyadh', country: 'Saudi Arabia',
    tv: { uk: 'ITV4', detail: 'World Series events are live on ITV4 / ITVX. Sessions usually mid-afternoon UK time.' },
    status: 'provisional',
    epgKeywords: ['saudi arabia darts masters'],
    notes: 'Dates not yet announced — shown in the usual mid-January slot.',
    sessions: [],
  },
  {
    id: 'world-masters-2027',
    name: 'Winmau World Masters 2027',
    category: 'major',
    start: '2027-01-28', end: '2027-01-31',
    venue: 'Arena MK (expected)', city: 'Milton Keynes', country: 'England',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX (deal runs to 2028).' },
    status: 'provisional',
    epgKeywords: ['world masters'],
    notes: 'Dates not yet announced — shown in the usual late-January slot.',
    sessions: [],
  },

  // ======================= FEBRUARY – MAY 2027 (provisional) =======================
  {
    id: 'premier-league-2027',
    name: 'Premier League Darts 2027',
    category: 'premier-league',
    start: '2027-02-04', end: '2027-05-27',
    venue: '17 arenas across UK, Ireland & Europe', city: 'Various', country: '',
    tv: { uk: 'Sky Sports', detail: 'Every night live on Sky Sports, normally Thursdays from 19:00 on Main Event and/or Action. Play-offs at The O2, London.' },
    status: 'provisional',
    epgKeywords: ['premier league', 'pl darts'],
    notes: 'Line-up announced after the World Championship; night-by-night venues and dates published in the new year. Usual pattern: 16 league nights Feb–May plus Play-Offs at The O2 in late May.',
    sessions: [],
  },
  {
    id: 'uk-open-2027',
    name: 'UK Open 2027',
    category: 'major',
    start: '2027-03-05', end: '2027-03-07',
    venue: 'Butlin\'s Resort (expected)', city: 'Minehead', country: 'England',
    tv: { uk: 'ITV4', detail: 'Live on ITV4 / ITVX across all three days.' },
    status: 'provisional',
    epgKeywords: ['uk open'],
    notes: 'Dates not yet announced — shown in the usual first-weekend-of-March slot. The "FA Cup of darts": 160 players, open draw.',
    sessions: [],
  },
  // ======================= JUNE 2027 (provisional) =======================
  {
    id: 'world-cup-2027',
    name: 'World Cup of Darts 2027',
    category: 'major',
    start: '2027-06-10', end: '2027-06-13',
    venue: 'TBC', city: 'TBC', country: 'Germany (expected)',
    tv: { uk: 'Sky Sports', detail: 'Live on Sky Sports.' },
    status: 'provisional',
    epgKeywords: ['world cup of darts'],
    notes: 'Dates not yet announced — shown in the usual mid-June slot.',
    sessions: [],
  },
];
