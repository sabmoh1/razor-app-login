
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Activity, Clock } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import { motion } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue, update, remove, get } from 'firebase/database';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [crashValue, setCrashValue] = useState<string>("0.00");
  const [lastRaw, setLastRaw] = useState<string>("—");
  const [status, setStatus] = useState<"live" | "wait">("wait");
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  
  const lastValueRef = useRef<string>("0.00");
  const lastChangeTimeRef = useRef<number>(Date.now());
  const useScheduleRef = useRef<boolean>(false);
  const expiresAtRef = useRef<number>(0);

  const saveRemainingTime = useCallback(async () => {
    const game = sessionStorage.getItem('razor_game_key');
    const keyId = sessionStorage.getItem('razor_db_key_id');
    const expiresAt = expiresAtRef.current;
    
    if (game && keyId && expiresAt > 0) {
      const remaining = Math.max(0, expiresAt - Date.now());
      const keyRef = ref(database, `passwords/${game}/${keyId}`);
      
      try {
        const snapshot = await get(keyRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            // AUTO-PURGE: Delete if time up or uses up
            if (remaining <= 0 || (data.uses !== undefined && data.uses <= 0)) {
                await remove(keyRef);
            } else {
                await update(keyRef, { remainingTime: remaining });
            }
        }
      } catch (e) {
        console.error("Auto-Purge/Save failed:", e);
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await saveRemainingTime();
    sessionStorage.clear();
    router.push('/');
  }, [router, saveRemainingTime]);

  useEffect(() => {
    document.title = "RAZOR — Predictor V2";
    const storedExpiresAt = parseInt(sessionStorage.getItem('razor_expires_at') || '0');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!storedExpiresAt || !storedUserId || storedExpiresAt <= Date.now()) {
      handleLogout();
      return;
    }

    setUserId(storedUserId);
    expiresAtRef.current = storedExpiresAt;

    // Real-time Database Listeners
    const currentRef = ref(database, 'predictions/current');
    const scheduleRef = ref(database, 'predictions/crash/schedule');

    const handleUpdate = (val: any) => {
        if (val) {
            const currentVal = Number(val).toFixed(2);
            if (currentVal !== lastValueRef.current) {
                setLastRaw(lastValueRef.current === "0.00" ? "—" : lastValueRef.current);
                setCrashValue(currentVal);
                lastValueRef.current = currentVal;
                lastChangeTimeRef.current = Date.now();
                useScheduleRef.current = false;
                setStatus("live");
            }
        }
    };

    const unsubPrimary = onValue(currentRef, (snap) => {
        const val = snap.val()?.value || snap.val();
        handleUpdate(val);
    });

    const unsubSchedule = onValue(scheduleRef, (snap) => {
        if (useScheduleRef.current) {
            const data = snap.val();
            if (data) {
                const keys = Object.keys(data).sort();
                const latestKey = keys[keys.length - 1];
                const val = data[latestKey]?.value || data[latestKey];
                handleUpdate(val);
            }
        }
    });

    const stagnationInterval = setInterval(() => {
        if (Date.now() - lastChangeTimeRef.current > 120000) {
            useScheduleRef.current = true;
        }
    }, 5000);

    // Session Timer
    const timerInterval = setInterval(() => {
      const remaining = expiresAtRef.current - Date.now();
      if (remaining > 0) {
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        handleLogout();
      }
    }, 1000);

    // Save on browser close
    window.addEventListener('beforeunload', saveRemainingTime);

    return () => {
      unsubPrimary();
      unsubSchedule();
      clearInterval(stagnationInterval);
      clearInterval(timerInterval);
      window.removeEventListener('beforeunload', saveRemainingTime);
    };
  }, [handleLogout, saveRemainingTime]);

  return (
    <KillSwitch pageName="razor">
      <style jsx global>{`
          :root {
            --bg: #000000;
            --fg: #ffffff;
            --muted: #6b6b6b;
            --muted-2: #454545;
            --green: #34d058;
            --ring: rgba(255, 255, 255, 0.10);
            --ring-glow: rgba(255, 255, 255, 0.4);
            --font-main: 'Acme', sans-serif;
            --font-accent: 'Sedgwick Ave', cursive;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
          body {
            height: 100vh;
            background: black url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif') no-repeat center center fixed;
            background-size: cover;
            color: var(--fg);
            font-family: var(--font-main);
            overflow: hidden;
            position: relative;
          }
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: grayscale(1) brightness(2.5);
            z-index: -1;
          }
          .app {
            position: relative;
            z-index: 10;
            max-width: 600px;
            margin: 0 auto;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 25px;
          }
          .topbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
          .user-chip {
            display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--muted-2); border-radius: 12px; padding: 8px 15px; font-size: 13px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
          }
          .status { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; color: var(--green); font-weight: bold; text-transform: uppercase; }
          .status .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px var(--green); animation: blink 1.6s ease-in-out infinite; }
          @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
          .logout { width: 40px; height: 40px; border: 1px solid var(--muted-2); border-radius: 10px; background: rgba(0,0,0,0.6); color: var(--fg); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
          .brand { text-align: center; margin-top: 20px; }
          .brand .sub-top { font-size: 14px; letter-spacing: 5px; opacity: 0.7; }
          .brand .title { font-size: 56px; font-family: var(--font-accent); margin: 5px 0; text-shadow: 0 0 20px rgba(255,255,255,0.4); }
          .stage { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
          .dial { position: relative; width: 320px; height: 320px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .dial::before { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 1px solid var(--ring); box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.03); }
          .dial::after { content: ""; position: absolute; inset: -2px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, var(--ring-glow) 30deg, transparent 90deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px)); animation: spin 5s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .value { position: relative; font-size: 72px; font-family: var(--font-accent); text-shadow: 0 0 30px rgba(255,255,255,0.6); }
          .value::after { content: "x"; font-size: 28px; vertical-align: super; margin-left: 5px; opacity: 0.6; }
          .footer { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 10px; }
          .timer { font-size: 18px; letter-spacing: 2px; font-weight: bold; display: flex; align-items: center; gap: 8px; color: var(--green); }
          .lastraw { text-align: right; }
          .lastraw .label { font-size: 10px; color: var(--muted); margin-bottom: 5px; display: block; }
          .lastraw .val { font-size: 16px; font-weight: bold; font-family: var(--font-accent); }
          .monitoring-tag { font-size: 10px; letter-spacing: 4px; color: rgba(255,255,255,0.3); text-transform: uppercase; font-weight: bold; display: flex; align-items: center; gap: 8px; }
      `}</style>
      
      <div className="app">
        <header className="topbar">
          <div className="user-chip">
            <User size={14} />
            <span>{userId}</span>
          </div>
          <div className="status">
            <span className="dot"></span>
            <span>{status === 'live' ? 'AUTO-SCAN ON' : 'WAIT'}</span>
          </div>
          <button className="logout" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </header>

        <div className="brand">
          <div className="sub-top">OFFICIAL TERMINAL</div>
          <div className="title">RAZOR</div>
        </div>

        <div className="stage">
          <div className="dial">
            <motion.div 
              key={crashValue}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="value"
            >
              {crashValue}
            </motion.div>
          </div>
          
          <div className="monitoring-tag">
             <Activity size={12} className="animate-pulse text-green-500" />
             <span>Monitoring Live Data</span>
          </div>
        </div>

        <footer className="footer">
          <div className="timer">
            <Clock size={16} />
            {timeLeft}
          </div>
          <div className="lastraw">
            <span className="label">LAST RAW</span>
            <span className="val">{lastRaw}</span>
          </div>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function RazorV2Page() {
  return (
    <Suspense fallback={<div className="bg-black h-screen w-screen"></div>}>
      <WelcomeContent />
    </Suspense>
  );
}
