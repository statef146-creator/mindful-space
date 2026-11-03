import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB } from '../lib/db';
import { SFX, sound } from '../lib/soundEngine';
import { TECHNIQUES, AFFIRMATIONS, GROUND_STEPS, fmtDate, fmtTime } from '../lib/content';
import { Field, Empty, fadeUp, stagger } from './ui';

/* =========================================================
   1. BREATHING — the circle expands/holds/contracts in sync
   ========================================================= */
export function Breathe({ user }) {
  const [tech, setTech] = useState('calm');
  const [running, setRunning] = useState(false);
  const [st, setSt] = useState({ ix: 0, left: 0, cycles: 0 });
  const phases = TECHNIQUES[tech].phases;

  useEffect(() => {
    if (!running) return;
    const ph = TECHNIQUES[tech].phases;
    const id = setInterval(() => {
      setSt((s) => {
        if (s.left > 1) return { ...s, left: s.left - 1 };
        const ix = (s.ix + 1) % ph.length;
        return { ix, left: ph[ix][1], cycles: ix === 0 ? s.cycles + 1 : s.cycles };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, tech]);

  const start = () => { setSt({ ix: 0, left: phases[0][1], cycles: 0 }); setRunning(true); DB.logActivity(user.id, 'breath'); };
  const label = running ? phases[st.ix][0] : 'Ready';
  const prev = phases[(st.ix - 1 + phases.length) % phases.length][0];
  const scale = label === 'Inhale' ? 1.3 : label === 'Exhale' ? 0.8 : prev === 'Inhale' ? 1.3 : 0.8;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass breathStage">
      <div className="techPills">
        {Object.keys(TECHNIQUES).map((k) => (
          <button key={k} className={'chip' + (tech === k ? ' on' : '')} disabled={running} onClick={() => setTech(k)}>{TECHNIQUES[k].name}</button>
        ))}
      </div>
      <div style={{ color: 'var(--ink-soft)', fontSize: '.87rem' }}>{TECHNIQUES[tech].sub}</div>

      <div className="bCircleWrap">
        <motion.div className="bCircle"
          animate={running ? { scale } : { scale: 1 }}
          transition={running ? { duration: phases[st.ix][1], ease: 'easeInOut' } : { duration: 0.6 }}>
          <div className="bInner">
            <div className="ph">{label}</div>
            <div className="ct">{running ? st.left : '🌿'}</div>
          </div>
        </motion.div>
      </div>

      {!running ? (
        <motion.button whileTap={{ scale: 0.95 }} className="btn primary" style={{ padding: '14px 34px' }} onClick={start}>Begin breathing 🫁</motion.button>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button whileTap={{ scale: 0.95 }} className="btn ghost" onClick={() => setRunning(false)}>Finish</motion.button>
          <span style={{ fontWeight: 800, color: 'var(--sage-deep)' }}>{st.cycles} cycle{st.cycles === 1 ? '' : 's'} completed 🌟</span>
        </div>
      )}

      <p style={{ maxWidth: 430, textAlign: 'center', marginTop: 22, fontSize: '.87rem', color: 'var(--ink-soft)', lineHeight: 1.7 }}>
        Sit comfortably, soften your shoulders, and let your breath follow the circle. Even one minute counts.
        If you feel lightheaded, return to normal breathing — that is completely okay.
      </p>
    </motion.div>
  );
}

/* =========================================================
   2. SOOTHING SOUNDS — real audio + sleep timer
   ========================================================= */
export function Sounds({ user }) {
  const [active, setActive] = useState(sound.current);
  const [vol, setVol] = useState(0.5);
  const [timer, setTimer] = useState(0);
  const tRef = useRef(null);

  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const toggle = async (name) => {
    if (tRef.current) { clearTimeout(tRef.current); tRef.current = null; }
    if (active === name) { sound.stop(); setActive(null); return; }
    sound.play(name, vol);
    setActive(name);
    DB.logActivity(user.id, 'sound');
    if (timer > 0) tRef.current = setTimeout(() => { sound.stop(); setActive(null); }, timer * 60000);
  };
  const changeVol = (v) => { setVol(v); sound.setVol(v); };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="glass card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div style={{ maxWidth: 520 }}>
            <h3>Soothing soundscapes 🎧</h3>
            <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginTop: 4 }}>
              Every sound is generated live in your browser — nothing to download, nothing to break. Press play and breathe. Headphones recommended.
            </p>
          </div>
          <label style={{ fontSize: '.8rem', fontWeight: 800, color: 'var(--sage-deep)' }}>
            ⏲️ Sleep timer
            <select className="input" style={{ width: 'auto', marginLeft: 8, padding: '8px 10px' }} value={timer} onChange={(e) => setTimer(+e.target.value)}>
              <option value={0}>Off</option><option value={5}>5 min</option><option value={10}>10 min</option><option value={20}>20 min</option><option value={45}>45 min</option>
            </select>
          </label>
        </div>
      </motion.div>

      <div className="soundGrid">
        {Object.keys(SFX).map((k) => {
          const s = SFX[k], on = active === k;
          return (
            <motion.div key={k} variants={fadeUp} whileHover={{ y: -3 }} className={'glass soundCard' + (on ? ' on' : '')} onClick={() => toggle(k)}>
              <div className="top">
                <span className="em">{s.em}</span>
                {on && (
                  <div className="eq">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} animate={{ height: [6, 16, 8, 14, 6] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                )}
              </div>
              <h4>{s.name}</h4>
              <p>{s.desc}</p>
              {on && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => e.stopPropagation()}>
                  <input type="range" min="0" max="1" step="0.01" value={vol} onChange={(e) => changeVol(+e.target.value)} />
                </motion.div>
              )}
              <div style={{ marginTop: 10, fontSize: '.77rem', fontWeight: 800, color: on ? 'var(--sage-deep)' : 'var(--ink-soft)' }}>
                {on ? '⏸ Tap to pause' : '▶ Tap to play'}
              </div>
            </motion.div>
          );
        })}
      </div>
      {active && <p style={{ marginTop: 16, fontSize: '.84rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
        Playing <b>{SFX[active].name}</b> — it keeps going while you explore other tabs. 🌿
      </p>}
    </motion.div>
  );
}

/* =========================================================
   3. TOOLKIT — journal · affirmations · grounding · worry release
   ========================================================= */
export function Toolkit({ user }) {
  const [tool, setTool] = useState('journal');
  const tabs = [['journal', '📓 Journal'], ['affirm', '🌸 Affirmations'], ['ground', '🌍 Grounding 5-4-3-2-1'], ['worry', '🎈 Release a worry']];
  return (
    <div>
      <div className="subNav">
        {tabs.map(([id, label]) => (
          <button key={id} className={'chip' + (tool === id ? ' on' : '')} onClick={() => setTool(id)}>{label}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tool} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {tool === 'journal' && <Journal user={user} />}
          {tool === 'affirm' && <Affirmations />}
          {tool === 'ground' && <Grounding user={user} />}
          {tool === 'worry' && <WorryRelease user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Journal({ user }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { DB.getJournal(user.id).then(setEntries); }, [user.id]);

  const save = async () => {
    if (!text.trim()) return;
    await DB.addJournal(user.id, text.trim());
    await DB.logActivity(user.id, 'journal');
    setText(''); setMsg('Saved. Your words are safe here. 💚');
    setEntries(await DB.getJournal(user.id));
    setTimeout(() => setMsg(''), 2800);
  };

  return (
    <div className="glass card">
      <h3 style={{ marginBottom: 6 }}>Gratitude & reflection journal 📓</h3>
      <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 14 }}>Write freely — this is private to you.</p>
      <textarea className="input" style={{ minHeight: 110 }} placeholder="Today I noticed / I am grateful for / I felt…" value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <motion.button whileTap={{ scale: 0.95 }} className="btn primary" onClick={save}>Keep this thought 🌿</motion.button>
        <AnimatePresence>{msg && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--sage-deep)' }}>{msg}</motion.span>}</AnimatePresence>
      </div>
      <div style={{ marginTop: 22 }}>
        {entries.length === 0 && <Empty>Your first entry will appear here. 🕊️</Empty>}
        {entries.map((e) => (
          <div key={e.id} className="listItem" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>🕊️</span>
            <div style={{ flex: 1, fontSize: '.9rem', lineHeight: 1.6 }}>
              {e.body}
              <div style={{ fontSize: '.73rem', color: 'var(--ink-soft)', marginTop: 6, fontWeight: 700 }}>{fmtDate(e.at)} · {fmtTime(e.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Affirmations() {
  const [card, setCard] = useState(AFFIRMATIONS[0]);
  const draw = () => {
    let n; do { n = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]; } while (n === card);
    setCard(n);
  };
  return (
    <div className="glass card" style={{ textAlign: 'center', padding: '44px 26px' }}>
      <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 6, repeat: Infinity }} style={{ fontSize: '2rem', marginBottom: 14 }}>🌸</motion.div>
      <AnimatePresence mode="wait">
        <motion.p key={card} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
          className="serif" style={{ fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontStyle: 'italic', maxWidth: 520, margin: '0 auto', lineHeight: 1.5 }}>
          “{card}”
        </motion.p>
      </AnimatePresence>
      <motion.button whileTap={{ scale: 0.95 }} className="btn lav" style={{ marginTop: 26 }} onClick={draw}>Give me another 🍃</motion.button>
    </div>
  );
}

function Grounding({ user }) {
  const [step, setStep] = useState(-1);
  const [vals, setVals] = useState(GROUND_STEPS.map(() => []));
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);

  const start = () => { setStep(0); setVals(GROUND_STEPS.map(() => [])); setInput(''); setDone(false); };
  const add = () => {
    if (!input.trim()) return;
    setVals((v) => v.map((arr, i) => (i === step ? [...arr, input.trim()] : arr)));
    setInput('');
  };
  const next = () => {
    if (step < GROUND_STEPS.length - 1) { setStep(step + 1); setInput(''); }
    else { setDone(true); DB.logActivity(user.id, 'grounding'); }
  };

  if (done) return (
    <div className="glass card" style={{ textAlign: 'center', padding: '44px 26px' }}>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: '3rem' }}>🌳</motion.div>
      <h3 style={{ margin: '14px 0 8px' }}>You&apos;re here. You&apos;re okay.</h3>
      <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 430, margin: '0 auto' }}>
        Notice how your body feels a little more present. Whenever the world feels loud you can return to this — your senses are always with you.
      </p>
      <button className="btn soft" style={{ marginTop: 20 }} onClick={() => setStep(-1)}>Do it again</button>
    </div>
  );

  if (step === -1) return (
    <div className="glass card" style={{ textAlign: 'center', padding: '40px 26px' }}>
      <div style={{ fontSize: '2.4rem' }}>🌍</div>
      <h3 style={{ margin: '12px 0 8px' }}>5-4-3-2-1 Grounding</h3>
      <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto 20px' }}>
        A gentle way back to the present moment when anxiety rises. We&apos;ll walk through your five senses together — no rush.
      </p>
      <motion.button whileTap={{ scale: 0.95 }} className="btn primary" onClick={start}>Ground me 🌿</motion.button>
    </div>
  );

  const g = GROUND_STEPS[step];
  return (
    <div className="glass card">
      <div className="chips" style={{ marginBottom: 16 }}>
        {GROUND_STEPS.map((s, i) => <span key={i} className={'chip' + (i === step ? ' on' : '')} style={{ cursor: 'default' }}>{s.n}</span>)}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <div style={{ fontSize: '2rem' }}>{g.icon}</div>
          <h3 style={{ margin: '8px 0 14px' }}>Name {g.n} {g.sense}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" autoFocus placeholder="Type one, then press Enter…" value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
            <button className="btn soft" onClick={add}>Add</button>
          </div>
          <div className="chips" style={{ marginTop: 14 }}>
            {vals[step].map((v, i) => <motion.span key={i} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chip on">{v}</motion.span>)}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <motion.button whileTap={{ scale: 0.95 }} className="btn primary" disabled={vals[step].length < g.n} onClick={next}>
              {step === GROUND_STEPS.length - 1 ? 'Finish 🌳' : 'Next sense →'}
            </motion.button>
            <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{vals[step].length} / {g.n} — approximate is fine, this isn&apos;t a test.</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function WorryRelease({ user }) {
  const [text, setText] = useState('');
  const [flying, setFlying] = useState(false);
  const [released, setReleased] = useState(false);

  const release = () => {
    if (!text.trim()) return;
    setFlying(true);
    DB.logActivity(user.id, 'worry');
    setTimeout(() => { setFlying(false); setReleased(true); setText(''); }, 1500);
  };

  return (
    <div className="glass card" style={{ overflow: 'hidden' }}>
      <h3 style={{ marginBottom: 6 }}>Release a worry 🎈</h3>
      <p style={{ fontSize: '.85rem', color: 'var(--ink-soft)', marginBottom: 16, lineHeight: 1.6 }}>
        Write one worry down. It is never saved or shared — you simply let it float away. Naming a worry and setting it down is a real, evidence-based practice.
      </p>
      <AnimatePresence mode="wait">
        {released ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '26px 10px' }}>
            <div style={{ fontSize: '2.6rem' }}>🕊️</div>
            <h3 style={{ margin: '12px 0 8px' }}>Released.</h3>
            <p style={{ color: 'var(--ink-soft)', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
              You don&apos;t have to carry it right now. If it returns, you can release it again — as many times as you need.
            </p>
            <button className="btn soft" style={{ marginTop: 18 }} onClick={() => setReleased(false)}>Release another</button>
          </motion.div>
        ) : (
          <motion.div key="write" animate={flying ? { y: -320, opacity: 0, rotate: -8, scale: 0.9 } : { y: 0, opacity: 1, rotate: 0, scale: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <textarea className="input" style={{ minHeight: 120 }} placeholder="Right now I am worried about…" value={text} onChange={(e) => setText(e.target.value)} disabled={flying} />
            <motion.button whileTap={{ scale: 0.95 }} className="btn lav" style={{ marginTop: 14 }} onClick={release} disabled={flying || !text.trim()}>
              Let it go 🎈
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}