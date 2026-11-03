import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB } from '../lib/db';
import { MOODS, MOOD_RESP, TIPS, dayOfYear, dayKey, todayKey, daysAgo, fmtDate, fmtTime, prettyDate, prettyTime, computeStats } from '../lib/content';
import { Sidebar, PageHead, MoodChart, ChatPanel, ReportView, NoteList, Empty, Stat, fadeUp, stagger, pageMotion } from '../components/ui';
import { Breathe, Sounds, Toolkit } from '../components/Healing';

const TABS = [
  { id: 'home',     label: 'Today',    icon: '🌿', title: 'Your space today', sub: 'Small steps, gently taken.' },
  { id: 'mood',     label: 'Mood',     icon: '🌤️', title: 'Mood check-in', sub: 'Your inner weather, over time.' },
  { id: 'breathe',  label: 'Breathe',  icon: '🫁', title: 'Breathing space', sub: 'Let the circle guide you.' },
  { id: 'sounds',   label: 'Sounds',   icon: '🎧', title: 'Soothing sounds', sub: 'A calm you can hear.' },
  { id: 'tools',    label: 'Toolkit',  icon: '🧰', title: 'Recovery toolkit', sub: 'Journal, affirm, ground, release.' },
  { id: 'sessions', label: 'Sessions', icon: '📅', title: 'Your sessions', sub: 'Planned with your therapist.' },
  { id: 'chat',     label: 'Chat',     icon: '💬', title: 'Talk to your therapist', sub: 'You are not doing this alone.' },
  { id: 'progress', label: 'Progress', icon: '📊', title: 'Your progress', sub: 'Look how far you have come.' },
];

export default function PatientDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('home');
  const [therapist, setTherapist] = useState(null);
  useEffect(() => { if (user.therapistId) DB.getUser(user.therapistId).then(setTherapist); }, [user.therapistId]);
  const meta = TABS.find((t) => t.id === tab);

  return (
    <div className="shell">
      <Sidebar items={TABS} active={tab} onChange={setTab} user={user} onLogout={onLogout} />
      <main className="main">
        <PageHead title={meta.title} subtitle={meta.sub}
          right={<span className="pill lav">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>} />
        <AnimatePresence mode="wait">
          <motion.div key={tab} {...pageMotion}>
            {tab === 'home' && <Home user={user} go={setTab} therapist={therapist} />}
            {tab === 'mood' && <Mood user={user} />}
            {tab === 'breathe' && <Breathe user={user} />}
            {tab === 'sounds' && <Sounds user={user} />}
            {tab === 'tools' && <Toolkit user={user} />}
            {tab === 'sessions' && <Sessions user={user} therapist={therapist} />}
            {tab === 'chat' && (
              <div className="glass card">
                <ChatPanel me={user} patientId={user.id} therapistId={user.therapistId}
                  otherName={therapist ? therapist.fullName : 'your therapist'} />
              </div>
            )}
            {tab === 'progress' && <Progress user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------------- Today ---------------- */
function Home({ user, go, therapist }) {
  const [data, setData] = useState({ moods: [], notes: [], sessions: [], activity: [] });
  const [resp, setResp] = useState('');
  const load = async () => {
    const [moods, notes, sessions, activity] = await Promise.all([
      DB.getMoods(user.id), DB.getNotes(user.id), DB.getSessions(user.id), DB.getActivity(user.id),
    ]);
    setData({ moods, notes, sessions, activity });
  };
  useEffect(() => { load(); }, [user.id]);

  const tip = TIPS[dayOfYear() % TIPS.length];
  const st = computeStats(data.moods, data.sessions, data.activity);
  const checkedToday = data.moods.some((m) => dayKey(m.at) === todayKey());
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const pick = async (v) => {
    await DB.addMood(user.id, v, '');
    await DB.logActivity(user.id, 'mood');
    setResp(MOOD_RESP[v]);
    load();
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="glass card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: '1.5rem' }}>{greet}, {user.fullName.split(' ')[0]} 🌿</h3>
        <p style={{ color: 'var(--ink-soft)', fontSize: '.92rem', marginTop: 6 }}>
          {checkedToday ? 'You have already checked in today — beautifully done.' : 'Whenever you are ready, one small check-in is a big act of self-care.'}
          {therapist ? ` ${therapist.fullName} is walking with you.` : ''}
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="glass card" style={{ background: 'linear-gradient(135deg,rgba(227,237,227,.92),rgba(235,227,245,.92))', marginBottom: 18 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
          Today&apos;s gentle tip · {tip.e}
        </div>
        <h3 style={{ fontSize: '1.35rem', margin: '6px 0 8px' }}>{tip.t}</h3>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.65, fontSize: '.94rem' }}>{tip.b}</p>
      </motion.div>

      <div className="grid2">
        <motion.div variants={fadeUp} className="glass card">
          <h3 style={{ marginBottom: 4 }}>How is your inner weather? {checkedToday && '✓'}</h3>
          <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)', marginBottom: 14 }}>Tap the sky that matches how you feel.</p>
          <div className="moodRow">
            {MOODS.map((m) => (
              <motion.button key={m.v} whileHover={{ y: -3 }} whileTap={{ scale: 0.9 }} className="moodBtn" onClick={() => pick(m.v)}>
                <span className="em">{m.emoji}</span>{m.label}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {resp && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginTop: 14, background: 'var(--lav-soft)', borderRadius: 14, padding: '12px 14px', fontSize: '.88rem', lineHeight: 1.6 }}>{resp}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.7rem' }}>🔥</span>
              <div><b>{st.streak}-day check-in streak</b>
                <div style={{ fontSize: '.8rem', color: 'var(--ink-soft)' }}>Keep the gentle momentum going.</div></div>
            </div>
          </div>
          <div className="glass card">
            <b>📅 Next session</b>
            {st.upcoming[0] ? (
              <div style={{ fontSize: '.89rem', color: 'var(--ink-soft)', marginTop: 6 }}>
                {prettyDate(st.upcoming[0].date)} at {prettyTime(st.upcoming[0].time)} · {st.upcoming[0].kind}
                {st.upcoming[0].note ? ` — ${st.upcoming[0].note}` : ''}
              </div>
            ) : <div style={{ fontSize: '.87rem', color: 'var(--ink-soft)', marginTop: 6 }}>Nothing planned yet — your therapist can schedule one.</div>}
          </div>
          {data.notes[0] && (
            <div className="glass card" style={{ background: 'linear-gradient(135deg,rgba(235,227,245,.85),rgba(255,253,247,.75))' }}>
              <b>💌 From your therapist</b>
              <div style={{ fontSize: '.87rem', color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.55 }}>
                <b>{data.notes[0].title}</b> — {data.notes[0].body.slice(0, 110)}{data.notes[0].body.length > 110 ? '…' : ''}
              </div>
              <button className="btn sm ghost" style={{ marginTop: 10 }} onClick={() => go('progress')}>Read more →</button>
            </div>
          )}
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="glass card" style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Quick healing tools ✨</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn soft" onClick={() => go('breathe')}>🫁 Breathe with me</button>
          <button className="btn soft" onClick={() => go('sounds')}>🌧️ Soothing sounds</button>
          <button className="btn soft" onClick={() => go('tools')}>📓 Journal</button>
          <button className="btn soft" onClick={() => go('chat')}>💬 Message therapist</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Mood ---------------- */
function Mood({ user }) {
  const [moods, setMoods] = useState([]);
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const load = async () => setMoods(await DB.getMoods(user.id));
  useEffect(() => { load(); }, [user.id]);

  const save = async () => {
    if (!sel) return;
    await DB.addMood(user.id, sel, note);
    await DB.logActivity(user.id, 'mood');
    setMsg(MOOD_RESP[sel]); setNote(''); setSel(null); load();
  };
  const recent = [...moods].reverse().slice(0, 8);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="glass card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Check in with yourself 🌦️</h3>
        <div className="moodRow">
          {MOODS.map((m) => (
            <motion.button key={m.v} whileTap={{ scale: 0.9 }} animate={sel === m.v ? { scale: 1.07 } : { scale: 1 }}
              className={'moodBtn' + (sel === m.v ? ' on' : '')} onClick={() => setSel(m.v)}>
              <span className="em">{m.emoji}</span>{m.label}
            </motion.button>
          ))}
        </div>
        <textarea className="input" style={{ marginTop: 14 }} placeholder="Anything you want to add? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <motion.button whileTap={{ scale: 0.95 }} className="btn primary" disabled={!sel} onClick={save}>Save check-in 🌿</motion.button>
          <AnimatePresence>{msg && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '.87rem', color: 'var(--sage-deep)', fontWeight: 700, maxWidth: 460 }}>{msg}</motion.span>}</AnimatePresence>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginBottom: 10 }}>Your last 14 days 🌤️</h3>
        <MoodChart moods={moods} />
      </motion.div>

      <motion.div variants={fadeUp} className="glass card">
        <h3 style={{ marginBottom: 12 }}>Recent entries 📖</h3>
        {recent.length === 0 && <Empty>Your first entry will appear here.</Empty>}
        {recent.map((m) => (
          <div key={m.id} className="listItem">
            <span style={{ fontSize: '1.4rem' }}>{MOODS[m.value - 1].emoji}</span>
            <div style={{ flex: 1, minWidth: 140 }}>
              <b>{MOODS[m.value - 1].label}</b>
              {m.note && <div style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>{m.note}</div>}
            </div>
            <span style={{ fontSize: '.77rem', color: 'var(--ink-soft)', fontWeight: 700 }}>{fmtDate(m.at)} · {fmtTime(m.at)}</span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Sessions ---------------- */
function Sessions({ user, therapist }) {
  const [sessions, setSessions] = useState([]);
  useEffect(() => { DB.getSessions(user.id).then(setSessions); }, [user.id]);
  const st = computeStats([], sessions, []);
  return (
    <div>
      <div className="statRow">
        <Stat n={st.upcoming.length} l="Upcoming" />
        <Stat n={st.past.length} l="Completed" />
        <Stat n={therapist ? therapist.fullName.split(' ')[0] : '—'} l="Your therapist" />
      </div>
      <div className="glass card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginBottom: 12 }}>Coming up 📅</h3>
        {st.upcoming.length === 0 && <Empty>No sessions planned yet. Your therapist will schedule one — you can also ask in chat. 💬</Empty>}
        {st.upcoming.map((s, i) => (
          <motion.div key={s.id} className="listItem" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
            <span style={{ fontSize: '1.5rem' }}>🗓️</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <b>{prettyDate(s.date)} · {prettyTime(s.time)}</b>
              <div style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>{s.kind} · {s.duration} min{s.note ? ` — ${s.note}` : ''}</div>
            </div>
            <span className="pill">scheduled</span>
          </motion.div>
        ))}
      </div>
      <div className="glass card">
        <h3 style={{ marginBottom: 12 }}>Past sessions 🌱</h3>
        {st.past.length === 0 && <Empty>Your history will gather here.</Empty>}
        {[...st.past].reverse().map((s) => (
          <div key={s.id} className="listItem">
            <span style={{ fontSize: '1.3rem' }}>✅</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <b>{prettyDate(s.date)}</b>
              <div style={{ fontSize: '.85rem', color: 'var(--ink-soft)' }}>{s.kind}{s.note ? ` — ${s.note}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Progress ---------------- */
function Progress({ user }) {
  const [notes, setNotes] = useState([]);
  useEffect(() => { DB.getNotes(user.id).then(setNotes); }, [user.id]);
  return (
    <div>
      <ReportView patient={user} />
      <div className="glass card" style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 6 }}>Notes from your therapist 💌</h3>
        <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 16 }}>Updates and gentle homework, shared with you.</p>
        <NoteList notes={notes} />
      </div>
    </div>
  );
}