import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB, isLive } from '../lib/db';
import { ILLNESSES, isLetters } from '../lib/content';
import { Orbs, Logo, Field, fadeUp, stagger } from '../components/ui';

/* =========================================================
   LANDING
   ========================================================= */
export function Landing({ go }) {
  const feats = [
    ['🌤️', 'Daily check-in', 'Track your mood like weather and receive a gentle self-care tip every single day.', '#E3EDE3'],
    ['🫁', 'Breathing space', 'Guided 4-7-8, box and calm breathing with a living, breathing companion.', '#EBE3F5'],
    ['🌧️', 'Soothing sounds', 'Rain, ocean, wind and healing drones — generated live, so they always play.', '#F6E8D8'],
    ['🤝', 'Therapist beside you', 'Private chat, planned sessions and progress notes to keep recovery consistent.', '#DCE9F0'],
  ];
  return (
    <div className="landing">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="logoRow"><Logo /></motion.div>
      <div className="hero">
        <div className="rings">
          {[300, 420, 540].map((r, i) => (
            <motion.div key={i} className="ring" style={{ width: r, height: r }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="eyebrow">a quiet corner of the internet</motion.div>
        <motion.h1 className="h1" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
          Breathe.<br />You&apos;ve <em>arrived</em>.
        </motion.h1>
        <motion.p className="sub" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}>
          Mindful Space is a gentle place to feel, rest and heal — daily mood rituals, guided breathwork,
          soothing sounds, and a therapist walking beside you, one small step at a time.
        </motion.p>
        <motion.div className="heroCtas" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn primary" style={{ padding: '14px 30px' }} onClick={() => go('signup')}>🌱 Begin your journey</motion.button>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="btn ghost" style={{ padding: '14px 30px' }} onClick={() => go('login')}>I have an account</motion.button>
        </motion.div>
      </div>
      <motion.div className="features" variants={stagger} initial="hidden" animate="show">
        {feats.map((f) => (
          <motion.div key={f[1]} variants={fadeUp} className="glass feat">
            <div className="ic" style={{ background: f[3] }}>{f[0]}</div>
            <h3>{f[1]}</h3><p>{f[2]}</p>
          </motion.div>
        ))}
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
        style={{ marginTop: 54, fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: '1.12rem', color: 'var(--ink-soft)' }}>
        “You don&apos;t have to see the whole staircase. Just take the first step.”
      </motion.p>
    </div>
  );
}

/* =========================================================
   LOGIN
   ========================================================= */
export function Login({ go, onAuth }) {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!email.trim()) return setErr('Please enter your email.');
    if (!/^\d{1,6}$/.test(pw)) return setErr('PIN is numbers only (maximum 6 digits).');
    setBusy(true);
    try { onAuth(await DB.login(email.trim(), pw, role)); }
    catch (x) { setErr(x.message || 'Login failed.'); }
    setBusy(false);
  };

  return (
    <div className="authWrap">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass authCard">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}><Logo /></div>
        <h2 style={{ textAlign: 'center', fontSize: '1.7rem', marginBottom: 6 }}>Welcome back 🌿</h2>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: '.9rem', marginBottom: 20 }}>Your space has been waiting for you.</p>

        <div className="roleTabs">
          <button className={'roleTab' + (role === 'patient' ? ' on' : '')} onClick={() => setRole('patient')}>🌸 Patient</button>
          <button className={'roleTab' + (role === 'therapist' ? ' on' : '')} onClick={() => setRole('therapist')}>🤝 Therapist</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Email"><input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Secret PIN" hint="Numbers only · maximum 6 digits.">
            <input className="input" type="password" inputMode="numeric" maxLength={6} placeholder="••••••"
              value={pw} onChange={(e) => setPw(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </Field>
          {err && <div className="ferr" style={{ marginBottom: 10 }}>{err}</div>}
          <motion.button whileTap={{ scale: 0.97 }} className="btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Opening…' : 'Come on in 🍃'}
          </motion.button>
        </form>

        {!isLive && (
          <div className="demoBox">
            <b>Demo mode — try it instantly:</b><br />
            Patient · patient@mindful.space · PIN 123456<br />
            Therapist · therapist@mindful.space · PIN 123456
            <span style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn sm lav" onClick={() => { setRole('patient'); setEmail('patient@mindful.space'); setPw('123456'); }}>Fill patient</button>
              <button className="btn sm soft" onClick={() => { setRole('therapist'); setEmail('therapist@mindful.space'); setPw('123456'); }}>Fill therapist</button>
            </span>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.88rem', color: 'var(--ink-soft)' }}>
          New here? <a href="#" onClick={(e) => { e.preventDefault(); go('signup'); }} style={{ fontWeight: 800 }}>Create your space</a>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); go('landing'); }} style={{ fontSize: '.8rem', color: 'var(--ink-soft)' }}>← back home</a>
        </p>
      </motion.div>
    </div>
  );
}

/* =========================================================
   SIGN UP — with all your validation rules
   ========================================================= */
export function Signup({ go, onAuth }) {
  const [role, setRole] = useState('patient');
  const [f, setF] = useState({ fullName: '', email: '', age: '', phone: '', password: '', specialty: '', customIllness: '' });
  const [ills, setIlls] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState({});
  const [topErr, setTopErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleIll = (i) => setIlls((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const validate = () => {
    const e = {};
    if (!f.fullName.trim()) e.fullName = 'Full name is required.';
    else if (!isLetters(f.fullName)) e.fullName = 'Letters only, please.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (role === 'patient') {
      if (!/^\d{1,2}$/.test(f.age)) e.age = 'Numbers only · maximum 2 digits.';
      else if (+f.age < 1 || +f.age > 120) e.age = 'Please enter a real age (1–120).';
      if (ills.length === 0) e.ills = 'Select at least one, or choose “Other” and describe it.';
      if (ills.includes('Other') && !f.customIllness.trim()) e.ills = 'Please describe the “Other” option you selected.';
    }
    if (!/^\d{1,6}$/.test(f.password)) e.password = 'Numbers only · maximum 6 digits.';
    if (!/^\d{1,10}$/.test(f.phone)) e.phone = 'Numbers only · maximum 10 digits.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(); setErr(e); setTopErr('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const r = await DB.signUp({
        role, fullName: f.fullName, email: f.email.trim(), age: f.age, phone: f.phone,
        password: f.password, specialty: f.specialty,
        illnesses: role === 'patient' ? ills : [],
        customIllness: ills.includes('Other') ? f.customIllness.trim() : '',
      });
      if (r?.pending) setTopErr('Account created! Please confirm your email, then log in. 💌');
      else onAuth(r);
    } catch (x) { setTopErr(x.message || 'Sign up failed.'); }
    setBusy(false);
  };

  return (
    <div className="authWrap" style={{ maxWidth: 570 }}>
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass authCard">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><Logo /></div>
        <h2 style={{ textAlign: 'center', fontSize: '1.7rem', marginBottom: 6 }}>Create your space 🌱</h2>
        <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: '.9rem', marginBottom: 20 }}>A few gentle details, and we&apos;ll prepare everything for you.</p>

        <div className="roleTabs">
          <button className={'roleTab' + (role === 'patient' ? ' on' : '')} onClick={() => setRole('patient')}>🌸 I&apos;m a patient</button>
          <button className={'roleTab' + (role === 'therapist' ? ' on' : '')} onClick={() => setRole('therapist')}>🤝 I&apos;m a therapist</button>
        </div>

        <form onSubmit={submit}>
          <Field label="Full name" error={err.fullName} hint="Letters only.">
            <input className={'input' + (err.fullName ? ' err' : '')} placeholder="e.g. Maya Daniels" value={f.fullName}
              onChange={(e) => set('fullName', e.target.value.replace(/[^A-Za-z\u00C0-\u024F ]/g, ''))} />
          </Field>

          <div className="twoCol">
            <Field label="Email" error={err.email}>
              <input className={'input' + (err.email ? ' err' : '')} type="email" placeholder="you@example.com" value={f.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            {role === 'patient' ? (
              <Field label="Age" error={err.age} hint="Numbers only · max 2 digits.">
                <input className={'input' + (err.age ? ' err' : '')} inputMode="numeric" maxLength={2} placeholder="e.g. 24" value={f.age}
                  onChange={(e) => set('age', e.target.value.replace(/\D/g, '').slice(0, 2))} />
              </Field>
            ) : (
              <Field label="Specialty">
                <input className="input" placeholder="e.g. Anxiety & mood disorders" value={f.specialty} onChange={(e) => set('specialty', e.target.value)} />
              </Field>
            )}
          </div>

          <div className="twoCol">
            <Field label="Phone number" error={err.phone} hint="Numbers only · max 10 digits.">
              <input className={'input' + (err.phone ? ' err' : '')} inputMode="numeric" maxLength={10} placeholder="e.g. 0821234567" value={f.phone}
                onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </Field>
            <Field label="Secret PIN" error={err.password} hint="Numbers only · max 6 digits.">
              <div style={{ display: 'flex', gap: 8 }}>
                <input className={'input' + (err.password ? ' err' : '')} type={showPw ? 'text' : 'password'} inputMode="numeric" maxLength={6} placeholder="••••••" value={f.password}
                  onChange={(e) => set('password', e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <button type="button" className="btn ghost sm" style={{ flexShrink: 0 }} onClick={() => setShowPw((s) => !s)}>{showPw ? '🙈' : '👁️'}</button>
              </div>
            </Field>
          </div>

          {role === 'patient' && (
            <Field label="What are you working through?" error={err.ills} hint="Choose as many as feel right. If it isn't listed, pick “Other”.">
              <div className="chips">
                {ILLNESSES.map((i) => (
                  <button type="button" key={i} className={'chip' + (ills.includes(i) ? ' on' : '')} onClick={() => toggleIll(i)}>{i}</button>
                ))}
              </div>
            </Field>
          )}

          <AnimatePresence>
            {role === 'patient' && ills.includes('Other') && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Field label="In your own words">
                  <input className="input" placeholder="What else would you like us to know?" value={f.customIllness} onChange={(e) => set('customIllness', e.target.value)} />
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          {topErr && <div className="ferr" style={{ marginBottom: 12 }}>{topErr}</div>}
          <motion.button whileTap={{ scale: 0.97 }} className="btn primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Preparing your space…' : 'Create my Mindful Space 🍃'}
          </motion.button>
          {role === 'patient' && (
            <p className="fhint" style={{ textAlign: 'center', marginTop: 10 }}>
              We&apos;ll match you with a therapist automatically — you can chat with them any time. 💚
            </p>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.88rem', color: 'var(--ink-soft)' }}>
          Already have a space? <a href="#" onClick={(e) => { e.preventDefault(); go('login'); }} style={{ fontWeight: 800 }}>Log in</a>
        </p>
      </motion.div>
    </div>
  );
}