import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DB, isLive } from './lib/db';
import { sound } from './lib/soundEngine';
import { Orbs, Logo } from './components/ui';
import { Landing, Login, Signup } from './pages/Public';
import PatientDashboard from './pages/PatientDashboard';
import TherapistDashboard from './pages/TherapistDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    DB.restore()
      .then((u) => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  const logout = async () => {
    sound.stop();
    await DB.logout();
    setUser(null);
    setView('landing');
  };

  if (booting) {
    return (
      <div className="boot">
        <Orbs />
        <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity }} style={{ position: 'relative', zIndex: 1 }}>
          <Logo />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app">
      <Orbs />
      <div className="page">
        <AnimatePresence mode="wait">
          {user ? (
            <motion.div key={user.role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              {user.role === 'patient'
                ? <PatientDashboard user={user} onLogout={logout} />
                : <TherapistDashboard user={user} onLogout={logout} />}
            </motion.div>
          ) : (
            <motion.div key={view} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
              {view === 'landing' && <Landing go={setView} />}
              {view === 'login' && <Login go={setView} onAuth={setUser} />}
              {view === 'signup' && <Signup go={setView} onAuth={setUser} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="footer">
        Mindful Space 🌿 — {isLive ? 'connected to Supabase' : 'demo mode (local data)'} · a wellbeing companion, not a substitute for professional care.<br />
        If you are in immediate danger or crisis, please contact your local emergency number or a crisis helpline. You matter. 💚
      </footer>
    </div>
  );
}