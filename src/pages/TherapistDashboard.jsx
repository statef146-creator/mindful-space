import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB } from '../lib/db';
import { SESSION_KINDS, initials, timeAgo, todayKey, prettyDate, prettyTime, computeStats } from '../lib/content';
import { Sidebar, PageHead, ChatPanel, ReportView, NoteList, Empty, Stat, Field, MoodChart, fadeUp, stagger, pageMotion } from '../components/ui';

const TABS = [
  { id: 'patients', label: 'Patients',  icon: '🌸', title: 'Your patients', sub: 'Everyone who has signed up or logged in.' },
  { id: 'chat',     label: 'Messages',  icon: '💬', title: 'Messages', sub: 'Stay close between sessions.' },
  { id: 'schedule', label: 'Scheduler', icon: '📅', title: 'Session scheduler', sub: 'Plan the next gentle step.' },
  { id: 'notes',    label: 'Notes',     icon: '📝', title: 'Progress notes', sub: 'Write and update — your patient sees these.' },
  { id: 'reports',  label: 'Reports',   icon: '📊', title: 'Patient reports', sub: 'Fourteen days of healing, at a glance.' },
];

export default function TherapistDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const [p, s] = await Promise.all([DB.getPatients(), DB.getSessions()]);
    setPatients(p); setSessions(s);
    setSelectedId((cur) => cur || p[0]?.id || null);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'patients' || tab === 'schedule') load(); }, [tab]);

  const selected = patients.find((p) => p.id === selectedId) || null;
  const meta = TABS.find((t) => t.id === tab);
  const jump = (id, t) => { setSelectedId(id); setTab(t); };

  const Picker = () => (
    <select className="input" style={{ maxWidth: 320 }} value={selectedId || ''} onChange={(e) => setSelectedId(e.target.value)}>
      {patients.length === 0 && <option value="">No patients yet</option>}
      {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
    </select>
  );

  return (
    <div className="shell">
      <Sidebar items={TABS} active={tab} onChange={setTab} user={user} onLogout={onLogout} />
      <main className="main">
        <PageHead title={meta.title} subtitle={meta.sub}
          right={tab !== 'patients' && tab !== 'schedule' ? <Picker /> : <span className="pill lav">{patients.length} patient{patients.length === 1 ? '' : 's'}</span>} />
        <AnimatePresence mode="wait">
          <motion.div key={tab} {...pageMotion}>
            {tab === 'patients' && <Patients patients={patients} sessions={sessions} jump={jump} />}
            {tab === 'chat' && (
              <div className="glass card">
                {selected
                  ? <ChatPanel me={user} patientId={selected.id} therapistId={user.id} otherName={selected.fullName} />
                  : <Empty>Once a patient signs up, they will appear here. 🌱</Empty>}
              </div>
            )}
            {tab === 'schedule' && <Scheduler user={user} patients={patients} sessions={sessions} reload={load} />}
            {tab === 'notes' && <Notes user={user} patient={selected} />}
            {tab === 'reports' && <ReportView patient={selected} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------------- Patients ---------------- */
function Patients({ patients, sessions, jump }) {
  const tk = todayKey();
  const upcoming = sessions.filter((s) => s.date >= tk).length;
  const activeToday = patients.filter((p) => Date.now() - new Date(p.lastLogin) < 864e5).length;
  if (!patients.length) return <Empty>No patients yet. Share your signup link — new patients appear here the moment they register. 🌸</Empty>;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <div className="statRow">
        <Stat n={patients.length} l="Patients" />
        <Stat n={activeToday} l="Active today" />
        <Stat n={upcoming} l="Upcoming sessions" />
      </div>
      {patients.map((p) => <PatientCard key={p.id} p={p} sessions={sessions} jump={jump} />)}
    </motion.div>
  );
}

function PatientCard({ p, sessions, jump }) {
  const [moods, setMoods] = useState([]);
  useEffect(() => { DB.getMoods(p.id).then(setMoods); }, [p.id]);
  const st = computeStats(moods, sessions.filter((s) => s.patientId === p.id), []);
  const online = Date.now() - new Date(p.lastLogin) < 864e5;
  const isNew = Date.now() - new Date(p.createdAt) < 3 * 864e5;
  const focus = [...(p.illnesses || []), p.customIllness].filter(Boolean);

  return (
    <motion.div variants={fadeUp} className="glass card" style={{ marginBottom: 14 }}>
      {/* Header with name, badges, and status */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.05rem' }}>{initials(p.fullName)}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.2rem' }}>{p.fullName}</h3>
            {isNew && <span className="pill peach">new</span>}
            <span className="pill" style={{ background: online ? '#E3EDE3' : '#EFEDE6', color: online ? '#3F6252' : '#7C8A80' }}>
              <span className="dot" style={{ background: online ? '#5E8A6E' : '#B9BDB6', marginRight: 6 }} />
              {online ? 'active today' : 'quiet'}
            </span>
          </div>
          <div style={{ fontSize: '.83rem', color: 'var(--ink-soft)', marginTop: 5 }}>
            {p.age ? `${p.age} yrs · ` : ''}{p.phone || 'no phone'} · {p.email}
          </div>
          <div style={{ fontSize: '.79rem', color: 'var(--ink-soft)', marginTop: 3 }}>
            Joined {prettyDate(p.createdAt.slice(0, 10))} · last seen {timeAgo(p.lastLogin)}
          </div>
        </div>
        <div style={{ minWidth: 190, flex: 1 }}>
          <div style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
            14-day mood · avg {st.avg ? st.avg.toFixed(1) : '—'}/5 · 🔥 {st.streak}
          </div>
          <MoodChart moods={moods} days={14} />
        </div>
      </div>

      {/* Prominent Conditions / Issues section */}
      <div style={{ marginTop: 16, padding: '16px', background: 'linear-gradient(135deg, rgba(235,227,245,.4), rgba(227,237,227,.4))', borderRadius: '14px', border: '1px solid rgba(159,134,201,.18)' }}>
        <div style={{ fontSize: '.75rem', fontWeight: 800, color: 'var(--lav-deep)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '1.1rem' }}>🩺</span> Conditions / Issues
        </div>
        {focus.length ? (
          <div className="chips">
            {focus.map((f) => (
              <span key={f} className="chip" style={{ 
                cursor: 'default', 
                fontSize: '.82rem', 
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #9F86C9, #7A639E)',
                color: '#fff',
                border: 'none',
                fontWeight: 700
              }}>
                {f}
              </span>
            ))}
          </div>
        ) : (
          <span className="fhint">No conditions recorded during signup</span>
        )}
        {p.customIllness && focus.includes(p.customIllness) && (
          <div style={{ marginTop: 10, fontSize: '.85rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
            💬 Custom note: "{p.customIllness}"
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button className="btn soft sm" onClick={() => jump(p.id, 'chat')}>💬 Chat</button>
        <button className="btn soft sm" onClick={() => jump(p.id, 'notes')}>📝 Notes</button>
        <button className="btn soft sm" onClick={() => jump(p.id, 'reports')}>📊 Report</button>
        <button className="btn ghost sm" onClick={() => jump(p.id, 'schedule')}>📅 Schedule</button>
      </div>
    </motion.div>
  );
}

/* ---------------- Scheduler ---------------- */
function Scheduler({ user, patients, sessions, reload }) {
  const [f, setF] = useState({ patientId: '', date: todayKey(), time: '15:00', kind: SESSION_KINDS[0], duration: 45, note: '' });
  const [msg, setMsg] = useState('');
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  useEffect(() => { if (!f.patientId && patients[0]) set('patientId', patients[0].id); }, [patients]);

  const tk = todayKey();
  const upcoming = sessions.filter((s) => s.date >= tk).sort((a, b) => ((a.date + a.time) < (b.date + b.time) ? -1 : 1));
  const past = sessions.filter((s) => s.date < tk).reverse();
  const nameOf = (id) => patients.find((p) => p.id === id)?.fullName || 'Patient';

  const create = async (e) => {
    e.preventDefault();
    if (!f.patientId) return setMsg('Please choose a patient first.');
    await DB.addSession({ ...f, therapistId: user.id, duration: +f.duration });
    setMsg('Session planned 🌿 Your patient can see it now.');
    set('note', '');
    reload();
    setTimeout(() => setMsg(''), 3200);
  };
  const cancel = async (id) => { await DB.removeSession(id); reload(); };

  return (
    <div className="grid2">
      <div className="glass card">
        <h3 style={{ marginBottom: 14 }}>Plan a session 📅</h3>
        <form onSubmit={create}>
          <Field label="Patient">
            <select className="input" value={f.patientId} onChange={(e) => set('patientId', e.target.value)}>
              {patients.length === 0 && <option value="">No patients yet</option>}
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
          </Field>
          <div className="twoCol">
            <Field label="Date"><input className="input" type="date" min={tk} value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label="Time"><input className="input" type="time" value={f.time} onChange={(e) => set('time', e.target.value)} /></Field>
          </div>
          <div className="twoCol">
            <Field label="Type">
              <select className="input" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
                {SESSION_KINDS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Duration">
              <select className="input" value={f.duration} onChange={(e) => set('duration', e.target.value)}>
                {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </Field>
          </div>
          <Field label="Focus / note (shared with patient)">
            <input className="input" placeholder="e.g. Review sleep routine" value={f.note} onChange={(e) => set('note', e.target.value)} />
          </Field>
          <motion.button whileTap={{ scale: 0.97 }} className="btn primary" style={{ width: '100%' }}>Add to schedule 🌿</motion.button>
          {msg && <div className="fhint" style={{ marginTop: 10, color: 'var(--sage-deep)', fontWeight: 700 }}>{msg}</div>}
        </form>
      </div>

      <div>
        <div className="glass card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Upcoming ({upcoming.length})</h3>
          {upcoming.length === 0 && <Empty>Nothing planned yet.</Empty>}
          {upcoming.map((s, i) => (
            <motion.div key={s.id} className="listItem" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ flex: 1, minWidth: 170 }}>
                <b>{nameOf(s.patientId)}</b>
                <div style={{ fontSize: '.84rem', color: 'var(--ink-soft)' }}>
                  {prettyDate(s.date)} · {prettyTime(s.time)} · {s.kind} · {s.duration}min
                </div>
                {s.note && <div style={{ fontSize: '.8rem', color: 'var(--ink-soft)', marginTop: 3 }}>"{s.note}"</div>}
              </div>
              <button className="btn danger sm" onClick={() => cancel(s.id)}>Cancel</button>
            </motion.div>
          ))}
        </div>
        <div className="glass card">
          <h3 style={{ marginBottom: 12 }}>Past ({past.length})</h3>
          {past.length === 0 && <Empty>History will gather here.</Empty>}
          {past.slice(0, 6).map((s) => (
            <div key={s.id} className="listItem">
              <div style={{ flex: 1 }}>
                <b>{nameOf(s.patientId)}</b>
                <div style={{ fontSize: '.83rem', color: 'var(--ink-soft)' }}>{prettyDate(s.date)} · {s.kind}</div>
              </div>
              <span className="pill">done</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Notes (write + update) ---------------- */
function Notes({ user, patient }) {
  const [notes, setNotes] = useState([]);
  const [f, setF] = useState({ id: null, title: '', category: 'Progress', body: '' });
  const [msg, setMsg] = useState('');
  const load = async () => { if (patient) setNotes(await DB.getNotes(patient.id)); };
  useEffect(() => { load(); setF({ id: null, title: '', category: 'Progress', body: '' }); }, [patient?.id]);

  if (!patient) return <Empty>Choose a patient to write a note. 📝</Empty>;

  const save = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.body.trim()) return setMsg('A title and a few words, please.');
    await DB.saveNote({ ...f, patientId: patient.id, therapistId: user.id });
    setMsg(f.id ? 'Note updated 🌿' : 'Note shared with your patient 💚');
    setF({ id: null, title: '', category: 'Progress', body: '' });
    load();
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="grid2">
      <div className="glass card">
        <h3 style={{ marginBottom: 4 }}>{f.id ? 'Update note ✏️' : 'New note 📝'}</h3>
        <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)', marginBottom: 14 }}>For {patient.fullName} — visible on their Progress page.</p>
        <form onSubmit={save}>
          <Field label="Title"><input className="input" placeholder="e.g. Week three check-in" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Category">
            <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {['Progress', 'Plan', 'Homework', 'Observation', 'Encouragement'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Note">
            <textarea className="input" style={{ minHeight: 150 }} placeholder="What is going well? What is the next gentle step?" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          </Field>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <motion.button whileTap={{ scale: 0.97 }} className="btn primary">{f.id ? 'Save update 🌿' : 'Share note 💚'}</motion.button>
            {f.id && <button type="button" className="btn ghost" onClick={() => setF({ id: null, title: '', category: 'Progress', body: '' })}>Cancel edit</button>}
          </div>
          {msg && <div className="fhint" style={{ marginTop: 10, color: 'var(--sage-deep)', fontWeight: 700 }}>{msg}</div>}
        </form>
      </div>
      <div className="glass card">
        <h3 style={{ marginBottom: 14 }}>History ({notes.length})</h3>
        <NoteList notes={notes} onEdit={(n) => setF({ id: n.id, title: n.title, category: n.category, body: n.body })} />
      </div>
    </div>
  );
}