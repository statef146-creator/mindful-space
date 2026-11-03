import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB } from '../lib/db';
import { MOODS, dayKey, daysAgo, fmtDate, fmtTime, initials, computeStats, recommendation, buildReportText } from '../lib/content';

export const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
export const pageMotion = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: 0.32, ease: 'easeOut' } };

/* ---------- ambient floating orbs ---------- */
export function Orbs() {
  const orbs = [['#B9D3B5', '6%', '4%', 420, 26], ['#D9C7EC', '62%', '10%', 380, 32], ['#F0D9BE', '30%', '68%', 460, 38], ['#C9DDE8', '78%', '60%', 320, 30]];
  return (
    <div className="orbs">
      {orbs.map((o, i) => (
        <motion.div key={i} className="orb"
          style={{ left: o[1], top: o[2], width: o[3], height: o[3], background: `radial-gradient(circle at 30% 30%, ${o[0]}, transparent 70%)` }}
          animate={{ y: [0, -28, 0], x: [0, 18, 0] }}
          transition={{ duration: o[4], repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div className="logoLeaf">🍃</div>
      <span className="serif" style={{ fontSize: '1.12rem' }}>Mindful&nbsp;Space</span>
    </div>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <div className="field">
      <label className="flabel">{label}</label>
      {children}
      {hint && !error && <div className="fhint">{hint}</div>}
      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ferr">{error}</motion.div>}
      </AnimatePresence>
    </div>
  );
}

export const Empty = ({ children }) => <div className="emptyNote">{children}</div>;
export const Stat = ({ n, l }) => <div className="glass stat"><div className="n">{n}</div><div className="l">{l}</div></div>;
export const PageHead = ({ title, subtitle, right }) => (
  <div className="pageHead"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{right}</div>
);

/* ---------- dashboard navigation ---------- */
export function Sidebar({ items, active, onChange, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sideBrand"><Logo /></div>
      {items.map((it) => (
        <button key={it.id} className={'navbtn' + (active === it.id ? ' active' : '')} onClick={() => onChange(it.id)}>
          {active === it.id && <motion.span layoutId="navpill" className="navpill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
          <span>{it.icon}</span><span>{it.label}</span>
        </button>
      ))}
      <div className="sideSpacer" />
      <div className="sideUser">
        <div className="avatar">{initials(user.fullName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}><b>{user.fullName.split(' ')[0]}</b><small>{user.role}</small></div>
        <button className="btn ghost sm" onClick={onLogout}>Exit</button>
      </div>
    </aside>
  );
}

/* ---------- mood chart (hand-rolled SVG, no chart library) ---------- */
export function MoodChart({ moods = [], days = 14 }) {
  const W = 560, H = 170, padX = 30, padY = 24;
  const keys = Array.from({ length: days }, (_, i) => dayKey(daysAgo(days - 1 - i)));
  const byDay = {};
  moods.forEach((m) => { const k = dayKey(m.at); if (!byDay[k] || m.at > byDay[k].at) byDay[k] = m; });
  const step = (W - padX * 2) / (days - 1);
  const pts = keys.map((k, i) => {
    const m = byDay[k];
    return { x: padX + i * step, y: m ? padY + ((5 - m.value) * (H - padY * 2)) / 4 : null, v: m?.value };
  });
  let d = '', started = false;
  pts.forEach((p) => {
    if (p.y == null) { started = false; return; }
    d += (started ? ' L' : ' M') + p.x + ',' + p.y; started = true;
  });
  const has = pts.some((p) => p.y != null);
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420 }}>
        <defs>
          <linearGradient id="mg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7A639E" /><stop offset="100%" stopColor="#3F6252" />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map((v) => {
          const y = padY + ((5 - v) * (H - padY * 2)) / 4;
          return <line key={v} x1={padX} x2={W - padX} y1={y} y2={y} stroke="rgba(63,98,82,.1)" strokeDasharray="3 5" />;
        })}
        {has && <motion.path d={d} fill="none" stroke="url(#mg)" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }} />}
        {pts.map((p, i) => p.y != null && (
          <motion.circle key={i} cx={p.x} cy={p.y} r="5.5" fill="#FFFDF7" stroke={MOODS[p.v - 1].c} strokeWidth="3"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.04 }}>
            <title>{MOODS[p.v - 1].label} — {fmtDate(keys[i])}</title>
          </motion.circle>
        ))}
        {[0, Math.floor((days - 1) / 2), days - 1].map((i) => (
          <text key={i} x={pts[i].x} y={H - 4} fontSize="10" textAnchor="middle" fill="#5E7267" fontWeight="700">{fmtDate(keys[i])}</text>
        ))}
      </svg>
      {!has && <Empty>No check-ins yet — your mood garden will bloom here. 🌱</Empty>}
    </div>
  );
}

/* ---------- shared patient ⇄ therapist chat (polls every 3s) ---------- */
export function ChatPanel({ me, patientId, therapistId, otherName }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    if (!patientId || !therapistId) return;
    let alive = true;
    const load = async () => { const m = await DB.getMessages(patientId, therapistId); if (alive) setMsgs(m); };
    load();
    const t = setInterval(load, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [patientId, therapistId]);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    await DB.sendMessage({ patientId, therapistId, senderId: me.id, body });
    setMsgs(await DB.getMessages(patientId, therapistId));
  };

  if (!therapistId) return <Empty>No therapist assigned yet — one will appear here soon. 🌱</Empty>;
  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 10, color: 'var(--sage-deep)' }}>💬 {otherName}</div>
      <div className="chatBox" ref={boxRef}>
        {msgs.length === 0 && <Empty>Say hello — this is your safe, private space. 💌</Empty>}
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className={'bub ' + (m.senderId === me.id ? 'me' : 'them')}>
              {m.body}<span className="tm">{fmtDate(m.at)} · {fmtTime(m.at)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="chatInput">
        <input className="input" placeholder="Write something gentle…" value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <motion.button whileTap={{ scale: 0.94 }} className="btn primary" onClick={send}>Send ➤</motion.button>
      </div>
    </div>
  );
}

/* ---------- progress report (used by BOTH dashboards) ---------- */
export function ReportView({ patient }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!patient) return;
    let alive = true;
    setData(null);
    (async () => {
      const [moods, sessions, notes, activity, therapist] = await Promise.all([
        DB.getMoods(patient.id), DB.getSessions(patient.id), DB.getNotes(patient.id), DB.getActivity(patient.id),
        patient.therapistId ? DB.getUser(patient.therapistId) : Promise.resolve(null),
      ]);
      if (alive) setData({ moods, sessions, notes, activity, therapist });
    })();
    return () => { alive = false; };
  }, [patient?.id]);

  if (!patient) return <Empty>Choose a patient to generate their report. 📊</Empty>;
  if (!data) return <Empty>Gathering the last two weeks… 🌿</Empty>;

  const st = computeStats(data.moods, data.sessions, data.activity);
  const dom = st.avg >= 1 ? MOODS[Math.round(st.avg) - 1] : null;

  const download = () => {
    const blob = new Blob([buildReportText(patient, data)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mindful-space-report-${patient.fullName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="reportHead">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Progress report</div>
            <div className="serif" style={{ fontSize: '1.5rem' }}>{patient.fullName}</div>
            <div style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
              Generated {fmtDate(Date.now())} · last 14 days{data.therapist ? ` · with ${data.therapist.fullName}` : ''}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} className="btn primary sm" onClick={download}>⬇ Download report</motion.button>
        </div>
      </div>
      <div className="statRow">
        <Stat n={st.recent.length} l="Check-ins" />
        <Stat n={dom ? dom.emoji : '—'} l={`Avg ${st.avg ? st.avg.toFixed(1) + '/5' : '—'}`} />
        <Stat n={`🔥 ${st.streak}`} l="Day streak" />
        <Stat n={st.upcoming.length} l="Upcoming sessions" />
      </div>
      <div className="glass card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 10 }}>Mood journey 🌤️</h3>
        <MoodChart moods={data.moods} />
      </div>
      <div className="grid2">
        <div className="glass card">
          <h3 style={{ marginBottom: 12 }}>Healing engagement 🌱</h3>
          {[['Breathing sessions', st.acts.breath], ['Sound sessions', st.acts.sound], ['Journal entries', st.acts.journal], ['Grounding exercises', st.acts.grounding], ['Worries released', st.acts.worry]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--line)', fontSize: '.9rem' }}>
              <span>{l}</span><b>{v}</b>
            </div>
          ))}
        </div>
        <div className="glass card">
          <h3 style={{ marginBottom: 12 }}>Recommendation 💚</h3>
          <p style={{ fontSize: '.92rem', lineHeight: 1.7, color: 'var(--ink-soft)' }}>{recommendation(st.avg)}</p>
          {st.upcoming[0] && (
            <p style={{ marginTop: 12, fontSize: '.85rem', background: 'var(--lav-soft)', borderRadius: 12, padding: '10px 12px' }}>
              Next session: <b>{st.upcoming[0].date} at {st.upcoming[0].time}</b> · {st.upcoming[0].kind}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- therapist notes list (patient sees these too) ---------- */
export function NoteList({ notes, onEdit }) {
  if (!notes.length) return <Empty>No notes yet. 🌱</Empty>;
  return notes.map((n, i) => (
    <motion.div key={n.id} className="noteCard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="pill lav">{n.category}</span>
        <span style={{ fontSize: '.74rem', color: 'var(--ink-soft)', fontWeight: 700 }}>
          {fmtDate(n.createdAt)}{n.updatedAt !== n.createdAt ? ' · updated' : ''}
        </span>
      </div>
      <h4>{n.title}</h4>
      <p>{n.body}</p>
      {onEdit && <button className="btn ghost sm" style={{ marginTop: 12 }} onClick={() => onEdit(n)}>✏️ Update note</button>}
    </motion.div>
  ));
}