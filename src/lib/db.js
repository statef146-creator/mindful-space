import { createClient } from '@supabase/supabase-js';
import { uid, dayKey, daysAgo } from './content';

/* =========================================================
   Supabase client — activates automatically when .env is set.
   Without keys the app runs on a local demo store so you can
   design/test everything before the backend exists.
   ========================================================= */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const isLive = !!supabase;

const KEY = 'mindful_space_v1';
const SKEY = 'mindful_space_session';
const nowISO = () => new Date().toISOString();
const blank = () => ({ users: [], moods: [], messages: [], sessions: [], notes: [], journal: [], activity: [] });

/* ---------- demo seed so both dashboards feel alive ---------- */
function seed(s) {
  const now = Date.now();
  s.users.push(
    { id: 't1', role: 'therapist', fullName: 'Dr. Amara Osei', email: 'therapist@mindful.space', password: '123456', phone: '0803123456', specialty: 'Anxiety, depression & trauma-informed care', therapistId: null, createdAt: daysAgo(60).toISOString(), lastLogin: new Date(now - 36e5).toISOString() },
    { id: 'p1', role: 'patient', fullName: 'Maya Daniels', email: 'patient@mindful.space', password: '123456', age: '24', phone: '0821234567', illnesses: ['Anxiety', 'Depression'], customIllness: '', therapistId: 't1', createdAt: daysAgo(21).toISOString(), lastLogin: new Date(now - 18e5).toISOString() }
  );
  [3, 2, 3, 4, 3, 2, 4, 4, 3, 5].forEach((v, i) => {
    const d = daysAgo(9 - i); d.setHours(9 + (i % 3), 12, 0, 0);
    s.moods.push({ id: uid(), patientId: 'p1', value: v, note: i === 9 ? 'Felt lighter after our session 🌿' : i === 5 ? 'Rough night, feeling tired' : '', at: d.toISOString() });
  });
  const mm = (sid, body, hrs) => ({ id: uid(), patientId: 'p1', therapistId: 't1', senderId: sid, body, at: new Date(now - hrs * 36e5).toISOString() });
  s.messages.push(
    mm('t1', 'Hi Maya, welcome to Mindful Space 🌱 How has your week been feeling?', 52),
    mm('p1', 'A little heavy at first — but the breathing exercises really helped me sleep.', 50),
    mm('t1', 'That is wonderful to hear. Small steps count. Shall we keep the evening breathing routine going?', 49),
    mm('p1', 'Yes please. I will try 10 minutes tonight 💚', 47)
  );
  s.sessions.push(
    { id: uid(), patientId: 'p1', therapistId: 't1', date: dayKey(daysAgo(5)), time: '11:00', kind: 'Video call', duration: 45, note: 'Intro session', status: 'scheduled' },
    { id: uid(), patientId: 'p1', therapistId: 't1', date: dayKey(new Date(now + 864e5)), time: '15:00', kind: 'Video call', duration: 45, note: 'Check-in on sleep routine', status: 'scheduled' }
  );
  s.notes.push(
    { id: uid(), patientId: 'p1', therapistId: 't1', title: 'First steps', category: 'Plan', body: 'Maya responded warmly to guided breathing. Goal for this fortnight: a 5-minute evening breathing practice and a morning mood check-in.', createdAt: daysAgo(12).toISOString(), updatedAt: daysAgo(12).toISOString() },
    { id: uid(), patientId: 'p1', therapistId: 't1', title: 'Gentle progress', category: 'Progress', body: 'Mood trend is lifting mid-week — lovely momentum. Keep the grounding exercise before bed, and bring one worry to our next session so we can work with it together.', createdAt: daysAgo(2).toISOString(), updatedAt: daysAgo(2).toISOString() }
  );
  s.journal.push({ id: uid(), patientId: 'p1', body: 'Today I noticed the sky on my walk home. Small thing, but it made me smile.', at: daysAgo(1).toISOString() });
  s.activity.push(
    { id: uid(), patientId: 'p1', kind: 'breath', at: daysAgo(1).toISOString() },
    { id: uid(), patientId: 'p1', kind: 'journal', at: daysAgo(1).toISOString() },
    { id: uid(), patientId: 'p1', kind: 'sound', at: daysAgo(2).toISOString() }
  );
}
function read() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch { /* ignore */ }
  if (!s || !s.users) { s = blank(); seed(s); localStorage.setItem(KEY, JSON.stringify(s)); }
  return s;
}
const write = (s) => localStorage.setItem(KEY, JSON.stringify(s));

/* snake_case row -> app shape */
const normP = (p) => ({
  id: p.id, role: p.role, fullName: p.full_name, email: p.email,
  age: p.age ? String(p.age) : '', phone: p.phone || '', specialty: p.specialty || '',
  therapistId: p.therapist_id, createdAt: p.created_at, lastLogin: p.last_login,
  illnesses: (p.patient_illnesses || []).map((x) => x.illness), customIllness: p.custom_illness || '',
});
const fail = (e) => { if (e) throw new Error(e.message || 'Something went wrong.'); };

export const DB = {
  /* ---------------- auth ---------------- */
  async restore() {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) return null;
      const { data: p, error } = await supabase.from('profiles').select('*, patient_illnesses(illness)').eq('id', data.session.user.id).single();
      return error || !p ? null : normP(p);
    }
    const id = localStorage.getItem(SKEY);
    if (!id) return null;
    const u = read().users.find((x) => x.id === id);
    return u ? { ...u } : null;
  },

  async signUp(o) {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email: o.email, password: o.password });
      fail(error);
      const user = data.user;
      if (!user) throw new Error('Sign up failed.');
      if (!data.session) return { pending: true }; // email confirmation is ON
      let therapistId = null;
      if (o.role === 'patient') {
        const { data: t } = await supabase.from('profiles').select('id').eq('role', 'therapist').order('created_at').limit(1);
        therapistId = t?.[0]?.id || null;
      }
      fail((await supabase.from('profiles').insert({
        id: user.id, email: o.email, full_name: o.fullName, role: o.role,
        age: o.age ? Number(o.age) : null, phone: o.phone, specialty: o.specialty || null,
        therapist_id: therapistId, custom_illness: o.customIllness || null,
      })).error);
      if (o.role === 'patient' && o.illnesses?.length) {
        fail((await supabase.from('patient_illnesses').insert(o.illnesses.map((i) => ({ patient_id: user.id, illness: i })))).error);
      }
      return { id: user.id, role: o.role, fullName: o.fullName, email: o.email, age: o.age, phone: o.phone, specialty: o.specialty || '', illnesses: o.illnesses || [], customIllness: o.customIllness || '', therapistId, createdAt: nowISO(), lastLogin: nowISO() };
    }
    const s = read();
    if (s.users.some((u) => u.email.toLowerCase() === o.email.toLowerCase())) throw new Error('An account with this email already exists.');
    const t = o.role === 'patient' ? s.users.find((u) => u.role === 'therapist') : null;
    const u = { id: uid(), role: o.role, fullName: o.fullName.trim(), email: o.email.trim(), password: o.password, age: o.age, phone: o.phone, specialty: o.specialty || '', illnesses: o.illnesses || [], customIllness: o.customIllness || '', therapistId: t ? t.id : null, createdAt: nowISO(), lastLogin: nowISO() };
    s.users.push(u); write(s); localStorage.setItem(SKEY, u.id);
    return { ...u };
  },

  async login(email, pw, role) {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
      fail(error);
      const { data: p, error: e2 } = await supabase.from('profiles').select('*, patient_illnesses(illness)').eq('id', data.user.id).single();
      fail(e2);
      if (p.role !== role) throw new Error(`This account is registered as a ${p.role}. Switch the role tab.`);
      await supabase.from('profiles').update({ last_login: nowISO() }).eq('id', p.id);
      return normP(p);
    }
    const s = read();
    const u = s.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) throw new Error('No account found with this email.');
    if (u.password !== pw) throw new Error('Incorrect PIN — please try again.');
    if (u.role !== role) throw new Error(`This account is registered as a ${u.role} — switch the role tab.`);
    u.lastLogin = nowISO(); write(s); localStorage.setItem(SKEY, u.id);
    return { ...u };
  },

  async logout() {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(SKEY);
  },

  /* ---------------- people ---------------- */
  async getUser(id) {
    if (supabase) {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      return data ? { id: data.id, fullName: data.full_name, role: data.role, specialty: data.specialty } : null;
    }
    return read().users.find((u) => u.id === id) || null;
  },
  async getPatients() {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*, patient_illnesses(illness)').eq('role', 'patient').order('created_at', { ascending: false });
      fail(error); return (data || []).map(normP);
    }
    return read().users.filter((u) => u.role === 'patient').map((u) => ({ ...u })).reverse();
  },

  /* ---------------- moods ---------------- */
  async getMoods(pid) {
    if (supabase) {
      const { data, error } = await supabase.from('moods').select('*').eq('patient_id', pid).order('created_at');
      fail(error); return (data || []).map((m) => ({ id: m.id, patientId: pid, value: m.value, note: m.note || '', at: m.created_at }));
    }
    return read().moods.filter((m) => m.patientId === pid).sort((a, b) => (a.at < b.at ? -1 : 1));
  },
  async addMood(pid, value, note) {
    if (supabase) { fail((await supabase.from('moods').insert({ patient_id: pid, value, note: note || null })).error); return; }
    const s = read(); s.moods.push({ id: uid(), patientId: pid, value, note: note || '', at: nowISO() }); write(s);
  },

  /* ---------------- chat ---------------- */
  async getMessages(pid, tid) {
    if (supabase) {
      const { data, error } = await supabase.from('messages').select('*').eq('patient_id', pid).eq('therapist_id', tid).order('created_at');
      fail(error); return (data || []).map((m) => ({ id: m.id, patientId: pid, therapistId: tid, senderId: m.sender_id, body: m.body, at: m.created_at }));
    }
    return read().messages.filter((m) => m.patientId === pid && m.therapistId === tid).sort((a, b) => (a.at < b.at ? -1 : 1));
  },
  async sendMessage({ patientId, therapistId, senderId, body }) {
    if (supabase) { fail((await supabase.from('messages').insert({ patient_id: patientId, therapist_id: therapistId, sender_id: senderId, body })).error); return; }
    const s = read(); s.messages.push({ id: uid(), patientId, therapistId, senderId, body, at: nowISO() }); write(s);
  },

  /* ---------------- scheduler ---------------- */
  async getSessions(pid) {
    if (supabase) {
      let q = supabase.from('sessions').select('*').order('date');
      if (pid) q = q.eq('patient_id', pid);
      const { data, error } = await q; fail(error);
      return (data || []).map((x) => ({ id: x.id, patientId: x.patient_id, therapistId: x.therapist_id, date: x.date, time: x.time, kind: x.kind, duration: x.duration, note: x.note || '', status: x.status }));
    }
    return read().sessions.filter((x) => !pid || x.patientId === pid);
  },
  async addSession(o) {
    if (supabase) { fail((await supabase.from('sessions').insert({ patient_id: o.patientId, therapist_id: o.therapistId, date: o.date, time: o.time, kind: o.kind, duration: o.duration, note: o.note || null, status: 'scheduled' })).error); return; }
    const s = read(); s.sessions.push({ id: uid(), ...o, status: 'scheduled' }); write(s);
  },
  async removeSession(id) {
    if (supabase) { fail((await supabase.from('sessions').delete().eq('id', id)).error); return; }
    const s = read(); s.sessions = s.sessions.filter((x) => x.id !== id); write(s);
  },

  /* ---------------- therapist notes ---------------- */
  async getNotes(pid) {
    if (supabase) {
      const { data, error } = await supabase.from('progress_notes').select('*').eq('patient_id', pid).order('created_at', { ascending: false });
      fail(error); return (data || []).map((n) => ({ id: n.id, patientId: pid, therapistId: n.therapist_id, title: n.title, category: n.category, body: n.body, createdAt: n.created_at, updatedAt: n.updated_at }));
    }
    return read().notes.filter((n) => n.patientId === pid).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async saveNote(n) {
    if (supabase) {
      if (n.id) fail((await supabase.from('progress_notes').update({ title: n.title, category: n.category, body: n.body, updated_at: nowISO() }).eq('id', n.id)).error);
      else fail((await supabase.from('progress_notes').insert({ patient_id: n.patientId, therapist_id: n.therapistId, title: n.title, category: n.category, body: n.body, updated_at: nowISO() })).error);
      return;
    }
    const s = read();
    if (n.id) {
      const e = s.notes.find((x) => x.id === n.id);
      if (e) Object.assign(e, { title: n.title, category: n.category, body: n.body, updatedAt: nowISO() });
    } else {
      s.notes.push({ id: uid(), patientId: n.patientId, therapistId: n.therapistId, title: n.title, category: n.category, body: n.body, createdAt: nowISO(), updatedAt: nowISO() });
    }
    write(s);
  },

  /* ---------------- journal + activity ---------------- */
  async getJournal(pid) {
    if (supabase) {
      const { data, error } = await supabase.from('journal_entries').select('*').eq('patient_id', pid).order('created_at', { ascending: false });
      fail(error); return (data || []).map((j) => ({ id: j.id, body: j.body, at: j.created_at }));
    }
    return read().journal.filter((j) => j.patientId === pid).sort((a, b) => (a.at < b.at ? 1 : -1));
  },
  async addJournal(pid, body) {
    if (supabase) { fail((await supabase.from('journal_entries').insert({ patient_id: pid, body })).error); return; }
    const s = read(); s.journal.push({ id: uid(), patientId: pid, body, at: nowISO() }); write(s);
  },
  async logActivity(pid, kind) {
    if (supabase) { await supabase.from('activity_log').insert({ patient_id: pid, kind }); return; }
    const s = read(); s.activity.push({ id: uid(), patientId: pid, kind, at: nowISO() }); write(s);
  },
  async getActivity(pid) {
    if (supabase) {
      const { data, error } = await supabase.from('activity_log').select('*').eq('patient_id', pid);
      fail(error); return (data || []).map((a) => ({ kind: a.kind, at: a.created_at }));
    }
    return read().activity.filter((a) => a.patientId === pid);
  },
};