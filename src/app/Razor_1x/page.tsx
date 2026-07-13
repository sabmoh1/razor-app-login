
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [crashValue, setCrashValue] = useState<string>("0.00");
  const [lastRaw, setLastRaw] = useState<string>("—");
  const [status, setStatus] = useState<"live" | "wait" | "err">("wait");
  
  const stateRef = useRef<any>(null);

  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 11 * 60;
    const value = parseInt(validity.slice(0, -1));
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 11 * 60;
    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return value * 60;
    }
  };

  const applyAtPath = (root: any, path: string, data: any) => {
    if (path === "/" || path === "") return data;
    const parts = path.split("/").filter(Boolean);
    if (root === null || typeof root !== "object") root = {};
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (typeof node[k] !== "object" || node[k] === null) node[k] = {};
      node = node[k];
    }
    const last = parts[parts.length - 1];
    if (data === null) delete node[last]; else node[last] = data;
    return root;
  };

  const updateUI = useCallback((newState: any) => {
    if (newState && newState.value != null) {
      const newVal = Number(newState.value).toFixed(2);
      setLastRaw(prev => (prev !== newVal && crashValue !== "0.00" ? crashValue : prev));
      setCrashValue(newVal);
      
      // Trigger Flip Animation
      const valEl = document.getElementById('value-display');
      if (valEl) {
        valEl.classList.remove('flip');
        void valEl.offsetWidth;
        valEl.classList.add('flip');
      }
    }
  }, [crashValue]);

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);

    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/predictions/current.json";
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const startSSE = () => {
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.onopen = () => setStatus("live");
        
        const handleEvent = (ev: MessageEvent) => {
          let payload;
          try { payload = JSON.parse(ev.data); } catch (_) { return; }
          if (!payload || typeof payload !== "object") return;
          const path = payload.path != null ? payload.path : "/";
          const data = payload.data;
          stateRef.current = applyAtPath(stateRef.current, path, data);
          updateUI(stateRef.current);
        };

        eventSource.addEventListener('put', handleEvent as any);
        eventSource.addEventListener('patch', handleEvent as any);
        eventSource.onerror = () => {
          eventSource?.close();
          startPolling();
        };
      } catch (e) {
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          stateRef.current = data;
          updateUI(data);
          setStatus("live");
        } catch (e) { setStatus("err"); }
      }, 2000);
    };

    startSSE();

    // Session Timer
    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          timerEl.innerText = `${String(h).padStart(3, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
        }
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/');
      }
    }, 1000);

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [router, updateUI]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>RAZOR — Predictor V2</title>
        <link href="https://fonts.googleapis.com/css2?family=Acme&family=Amiri:wght@400;700&family=Sedgwick+Ave&display=swap" rel="stylesheet" />
      </Head>
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
          body::after {
            content: "";
            position: fixed;
            inset: 0;
            background: radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.05), transparent 70%);
            pointer-events: none;
            z-index: 0;
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
          .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .user-chip {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid var(--muted-2);
            border-radius: 12px;
            padding: 8px 15px;
            font-size: 13px;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
          }
          .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--green);
            font-weight: bold;
            text-transform: uppercase;
          }
          .status .dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: var(--green);
            box-shadow: 0 0 10px var(--green);
            animation: blink 1.6s ease-in-out infinite;
          }
          @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
          .logout {
            width: 40px; height: 40px;
            border: 1px solid var(--muted-2);
            border-radius: 10px;
            background: rgba(0,0,0,0.6);
            color: var(--fg);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          .logout:active { transform: scale(0.9); }
          .brand { text-align: center; margin-top: 20px; }
          .brand .sub-top { font-size: 14px; letter-spacing: 5px; opacity: 0.7; }
          .brand .title { 
            font-size: 56px; 
            font-family: var(--font-accent);
            margin: 5px 0;
            text-shadow: 0 0 20px rgba(255,255,255,0.4);
          }
          .brand .telegram { font-size: 11px; letter-spacing: 2px; color: var(--muted); }
          .stage {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dial {
            position: relative;
            width: 320px;
            height: 320px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .dial::before {
            content: "";
            position: absolute; inset: 0;
            border-radius: 50%;
            border: 1px solid var(--ring);
            box-shadow: inset 0 0 30px rgba(255,255,255,0.03);
          }
          .dial::after {
            content: "";
            position: absolute; inset: -2px;
            border-radius: 50%;
            background: conic-gradient(from 0deg, transparent 0deg, var(--ring-glow) 30deg, transparent 90deg);
            -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
            animation: spin 5s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .value {
            position: relative;
            font-size: 72px;
            font-family: var(--font-accent);
            text-shadow: 0 0 30px rgba(255,255,255,0.6);
          }
          .value.flip { animation: flip 0.4s ease; }
          @keyframes flip {
            0% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(-10px); opacity: 0.3; }
            100% { transform: translateY(0); opacity: 1; }
          }
          .value::after { content: "x"; font-size: 28px; vertical-align: super; margin-left: 5px; opacity: 0.6; }
          .footer {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            padding-bottom: 10px;
          }
          .timer { font-size: 18px; letter-spacing: 2px; font-weight: bold; }
          .lastraw { text-align: right; }
          .lastraw .label { font-size: 10px; color: var(--muted); margin-bottom: 5px; display: block; }
          .lastraw .val { font-size: 16px; font-weight: bold; font-family: var(--font-accent); }
      `}</style>

      <div className="app">
        <header className="topbar">
          <div className="user-chip">
            <User size={14} />
            <span>{userId}</span>
          </div>
          <div className="status">
            <span className="dot"></span>
            <span>{status === 'live' ? 'ACTIVE' : 'READY'}</span>
          </div>
          <button className="logout" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </header>

        <div className="brand">
          <div className="sub-top">OFFICIAL TERMINAL</div>
          <div className="title">RAZOR</div>
          <div className="telegram">TELEGRAM : @RAZOR_1X</div>
        </div>

        <div className="stage">
          <div className="dial">
            <div className="value" id="value-display">{crashValue}</div>
          </div>
        </div>

        <footer className="footer">
          <div className="timer" id="timer-display">000 : 00 : 00</div>
          <div className="lastraw">
            <span className="label">LAST RAW</span>
            <span className="val">{lastRaw}</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function RazorV2Page() {
  return (
    <Suspense fallback={<div className="bg-black h-screen w-screen"></div>}>
      <WelcomeContent />
    </Suspense>
  );
}
