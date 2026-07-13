
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [status, setStatus] = useState<"live" | "wait" | "err">("wait");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
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

  const doGlitchThenSet = useCallback((newVal: any) => {
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    if (!crashEl || !lastRawEl) return;
    crashEl.classList.add('glitch');
    setTimeout(() => {
      const prev = crashEl.innerText;
      if (prev && prev.trim() !== '' && prev !== '0.00') lastRawEl.innerText = prev;
      const t = (newVal === undefined || newVal === null) ? '0.00' : Number(newVal).toFixed(2);
      crashEl.innerText = t;
      crashEl.setAttribute('data-text', t);
    }, 220);
    setTimeout(() => crashEl.classList.remove('glitch'), 560);
  }, []);

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

    const onDataReceived = (newState: any) => {
      stateRef.current = newState;
      if (newState && newState.value != null) {
        doGlitchThenSet(newState.value);
      }
    };

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
          onDataReceived(stateRef.current);
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
          onDataReceived(data);
          setStatus("live");
        } catch (e) { setStatus("err"); }
      }, 2000);
    };

    startSSE();

    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const timerEl = document.getElementById('timer');
        if (timerEl) {
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          timerEl.innerText = `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
        }
      } else {
        clearInterval(timerInterval);
        router.push('/');
      }
    }, 1000);

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [router, doGlitchThenSet]);

  return (
    <KillSwitch pageName="razor">
      <Head>
        <title>RAZOR — Neon Matrix</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
          :root{ --bg:#000; --neon-green:#00ff6a; --neon-white:#e6fff8; --neon-gray:#666; --accent:#00ffd1; }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family: 'Orbitron', sans-serif;background:var(--bg);color:var(--neon-white);-webkit-font-smoothing:antialiased;overflow-x:hidden}
          body, .font-orbitron, .timer-big, .last-box .value, .last-box .label, #crashValue { font-family: 'Orbitron', sans-serif !important; font-weight: 900 !important; }
          .wrap{position:relative;z-index:3;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
          .panel{ width:min(920px,94%);max-width:920px;margin:0 auto; background: transparent; border-radius:14px;padding:28px; display:flex;flex-direction:column;gap:18px;align-items:center;overflow:visible; }
          .brand h1{ font-size:2rem;margin:0;color:var(--neon-green);letter-spacing:4px;font-weight:900; }
          .display-circle{ width:420px;height:420px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative; background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45)); border:1px solid rgba(0,255,120,0.04); overflow:hidden; }
          #crashValue{ font-size:6rem;font-weight:900;color:var(--neon-white); letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease; text-align:center;white-space:nowrap; -webkit-font-smoothing:antialiased; }
          .timer-big{ font-weight:800;color:var(--neon-white); background:transparent;padding:8px 12px;border-radius:10px; font-size:1.05rem;letter-spacing:0.6px;text-align:center; border:1px solid rgba(255,255,255,0.02); }
          .last-box{ background:transparent;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.02);min-width:140px;text-align:center }
          .status-dot{ width:14px;height:14px;border-radius:50%; background:var(--neon-gray); transition:all .28s ease; }
          .status-dot.connected{ background:var(--neon-green); box-shadow: 0 0 10px var(--neon-green); }
      `}</style>
      
       <div className="user-id-display" style={{position: 'absolute', top: 15, left: 20, display: 'flex', alignItems: 'center', gap: 8}}>
        <User size={16} color="var(--neon-green)" />
        <span>{userId}</span>
      </div>
      <div style={{position: 'absolute', top: 15, right: 20, display: 'flex', alignItems: 'center', gap: 8}}>
        <div className={`status-dot ${status === 'live' ? 'connected' : ''}`}></div>
        <span>{status === 'live' ? 'Connected' : 'Connecting...'}</span>
      </div>

      <div className="wrap">
        <div className="panel">
          <div className="brand">
            <h1 className="neon-label">RAZOR</h1>
          </div>
          <div className="display-circle">
            <div id="crashValue" ref={crashValueRef}>0.00</div>
          </div>
          <div className="meta-row" style={{display: 'flex', gap: 18, marginTop: 18}}>
            <div className="timer-big" id="timer">00 : 00 : 00</div>
            <div className="last-box">
              <div className="label">LastRaw</div>
              <div className="value" id="lastRaw" ref={lastRawRef}>-</div>
            </div>
          </div>
        </div>
      </div>
    </KillSwitch>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
