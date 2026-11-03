/* ---------- tiny helpers ---------- */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const todayKey = () => dayKey(new Date());
export const daysAgo = (n) => new Date(Date.now() - n * 864e5);
export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const timeAgo = (ts) => {
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return 'yesterday';
  return `${Math.floor(s / 86400)}d ago`;
};
export const initials = (n = '') => n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
export const isLetters = (s) => /^[A-Za-z\u00C0-\u024F]+( [A-Za-z\u00C0-\u024F]+)*$/.test(s.trim());
export const dayOfYear = () => { const n = new Date(); return Math.floor((n - new Date(n.getFullYear(), 0, 0)) / 864e5); };
export const prettyDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const prettyTime = (t) => { const [h, m] = t.split(':'); const d = new Date(); d.setHours(+h, +m); return fmtTime(d); };

/* ---------- moods (weather metaphor) ---------- */
export const MOODS = [
  { v: 1, label: 'Heavy',   emoji: '🌧️', c: '#8E9BB3' },
  { v: 2, label: 'Low',     emoji: '🌥️', c: '#A8A0C0' },
  { v: 3, label: 'Okay',    emoji: '⛅',  c: '#D9C48F' },
  { v: 4, label: 'Good',    emoji: '🌤️', c: '#B8C98F' },
  { v: 5, label: 'Radiant', emoji: '🌞', c: '#E8B04B' },
];
export const MOOD_RESP = {
  1: 'Thank you for being honest — that takes courage. Heavy days are real. Be extra gentle with yourself, and visit the Breathing Space when you can. 🫂',
  2: 'Noted with care. Low days still count. One small kind thing for yourself today is enough. 🌥️',
  3: 'Okay is perfectly okay. Steady ground is still ground — maybe add one tiny spark today. ⛅',
  4: 'Lovely. Good days are worth savouring — what made today good? 🌤️',
  5: 'Radiant! Let this warmth sink in. Your mind is learning the way back here. 🌞',
};

export const ILLNESSES = ['Anxiety','Depression','Stress & Burnout','Panic Attacks','PTSD','OCD','Bipolar Disorder','Insomnia','Eating Disorder','Grief','ADHD','Other'];

/* ---------- daily self-help tips (rotates by day) ---------- */
export const TIPS = [
  { e: '🌅', t: 'Morning light',        b: 'Get 5–10 minutes of daylight within an hour of waking — it steadies your body clock and gently lifts mood.' },
  { e: '🫁', t: 'One conscious breath', b: 'Try a single slow exhale, twice as long as your inhale. Your nervous system is listening.' },
  { e: '📵', t: 'A tiny unplug',        b: 'Keep the first 15 minutes of your day screen-free. Let your own mind wake up first.' },
  { e: '💧', t: 'Sip with intention',   b: 'Dehydration whispers as fatigue and fog. A glass of water is a small act of care.' },
  { e: '🚶', t: 'A two-minute walk',    b: 'Movement is medicine in tiny doses. Even a short stroll resets stress chemistry.' },
  { e: '✍️', t: 'Name it to tame it',   b: 'Write one feeling you are carrying in a single sentence. Naming emotions softens their grip.' },
  { e: '🌙', t: 'A wind-down ritual',   b: 'Dim the lights an hour before bed. Your brain reads darkness as a lullaby.' },
  { e: '🤝', t: 'One kind hello',       b: 'Connection is quiet medicine. Send one short message to someone who feels like home.' },
  { e: '🧺', t: 'Single-task one chore',b: 'Fold, wash or tidy one thing with full attention. Ordinary acts can be grounding.' },
  { e: '🌿', t: 'Self-talk swap',       b: 'Catch one harsh thought today and rewrite it the way you would for a dear friend.' },
  { e: '🍵', t: 'A warm pause',         b: 'Make tea slowly — the smell, the warmth, the sip. Let it be a five-minute sanctuary.' },
  { e: '🎵', t: 'One soothing song',    b: 'Play a song that once comforted you. Music is a bridge back to safe feelings.' },
  { e: '🛏️', t: 'Same-time sleep',      b: 'Choose a sleep and wake time for this week. Rhythm soothes an anxious mind.' },
  { e: '🌻', t: 'Three good things',    b: 'Before bed, name three small things that went okay today. Small counts.' },
];

export const AFFIRMATIONS = [
  'I am allowed to take this one small step.',
  'My feelings are valid — and they will pass through me.',
  'I am more than the hardest thing I have felt.',
  'Healing is not linear, and I am still moving.',
  'I choose gentleness with myself today.',
  'I have survived 100% of my hardest days.',
  'Peace is a practice, and I am practising.',
  'I can do hard things — gently.',
  'My worth is not measured by my productivity.',
  'I breathe in calm, I breathe out tension.',
  'It is okay to rest before I am tired.',
  'I am becoming someone who takes care of me.',
  'This moment is temporary. I am enduring.',
  'I deserve the same kindness I give to others.',
  'Small progress is still progress.',
  'Right now, in this moment, I am safe enough to breathe.',
];

export const TECHNIQUES = {
  calm: { name: 'Calm Breath',    sub: '4 · 2 · 6 — everyday steadiness', phases: [['Inhale', 4], ['Hold', 2], ['Exhale', 6]] },
  box:  { name: 'Box Breathing',  sub: '4 · 4 · 4 · 4 — focus & balance', phases: [['Inhale', 4], ['Hold', 4], ['Exhale', 4], ['Hold', 4]] },
  r478: { name: '4-7-8 Deep Rest',sub: 'for sleep & deep calm',           phases: [['Inhale', 4], ['Hold', 7], ['Exhale', 8]] },
};

export const GROUND_STEPS = [
  { n: 5, sense: 'things you can SEE',   icon: '👀' },
  { n: 4, sense: 'things you can TOUCH', icon: '✋' },
  { n: 3, sense: 'things you can HEAR',  icon: '👂' },
  { n: 2, sense: 'things you can SMELL', icon: '🌸' },
  { n: 1, sense: 'thing you can TASTE',  icon: '🍵' },
];

export const SESSION_KINDS = ['Video call', 'Voice call', 'In-person', 'Chat session'];

/* ---------- progress maths (shared by both dashboards) ---------- */
export function computeStats(moods = [], sessions = [], activity = []) {
  const cut = Date.now() - 13 * 864e5;
  const recent = moods.filter((m) => +new Date(m.at) >= cut);
  const avg = recent.length ? recent.reduce((a, m) => a + m.value, 0) / recent.length : 0;
  const days = new Set(moods.map((m) => dayKey(m.at)));
  let streak = 0;
  for (let i = days.has(todayKey()) ? 0 : 1; i < 366; i++) {
    if (days.has(dayKey(daysAgo(i)))) streak++; else break;
  }
  const tk = todayKey();
  const upcoming = sessions.filter((s) => s.date >= tk).sort((a, b) => ((a.date + a.time) < (b.date + b.time) ? -1 : 1));
  const past = sessions.filter((s) => s.date < tk);
  const acts = { breath: 0, sound: 0, journal: 0, grounding: 0, worry: 0, mood: 0 };
  activity.forEach((a) => { if (acts[a.kind] != null) acts[a.kind]++; });
  return { recent, avg, streak, upcoming, past, acts };
}

export function recommendation(avg) {
  if (!avg) return 'Not enough check-ins yet — a gentle nudge to begin the daily mood ritual.';
  if (avg < 2.5) return 'The last two weeks have felt heavy. Prioritise rest, keep sessions close together, and lean on the breathing and grounding tools on difficult evenings.';
  if (avg < 3.5) return 'Mood has been steady with natural ups and downs. Consistency is the medicine here: daily check-ins and small rituals are working.';
  return 'A bright, rising trend. Beautiful work — protect the routines that are clearly working.';
}

export function buildReportText(patient, { moods, sessions, notes, activity, therapist }) {
  const st = computeStats(moods, sessions, activity);
  const dom = st.avg >= 1 ? MOODS[Math.round(st.avg) - 1] : null;
  const focus = [...(patient.illnesses || []), patient.customIllness].filter(Boolean).join(', ') || '—';
  return [
    'MINDFUL SPACE — PROGRESS REPORT',
    '='.repeat(44),
    `Patient    : ${patient.fullName}`,
    `Age        : ${patient.age || '—'}`,
    `Focus      : ${focus}`,
    `Therapist  : ${therapist ? therapist.fullName : '—'}`,
    `Generated  : ${new Date().toLocaleString()}`,
    '',
    '— LAST 14 DAYS —',
    `Mood check-ins  : ${st.recent.length}`,
    `Average mood    : ${st.avg ? `${st.avg.toFixed(2)} / 5 (${dom.label})` : '—'}`,
    `Check-in streak : ${st.streak} day(s)`,
    '',
    '— HEALING ENGAGEMENT —',
    `Breathing sessions  : ${st.acts.breath}`,
    `Sound sessions      : ${st.acts.sound}`,
    `Journal entries     : ${st.acts.journal}`,
    `Grounding exercises : ${st.acts.grounding}`,
    `Worries released    : ${st.acts.worry}`,
    '',
    '— SESSIONS —',
    `Upcoming  : ${st.upcoming.length}${st.upcoming[0] ? ` (next ${st.upcoming[0].date} ${st.upcoming[0].time})` : ''}`,
    `Completed : ${st.past.length}`,
    '',
    '— LATEST THERAPIST NOTE —',
    notes[0] ? `${notes[0].title}: ${notes[0].body}` : '(none yet)',
    '',
    '— RECOMMENDATION —',
    recommendation(st.avg),
    '',
    'Generated with care by Mindful Space 🌿',
    'Note: this is a wellbeing summary, not a medical diagnosis.',
  ].join('\n');
}