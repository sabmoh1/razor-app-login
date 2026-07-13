
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { User } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const usernameButtonRef = useRef<HTMLAnchorElement>(null);
  const lastValueRef = useRef<string | null>(null);

  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 60 * 60; 
    const value = parseInt(validity.slice(0, -1));
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 60 * 60;
    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return 60 * 60;
    }
  };

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);
    
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    const statusDot = statusDotRef.current;
    const statusText = statusTextRef.current;
    const timerEl = timerRef.current;
    const usernameButton = usernameButtonRef.current;

    function doGlitchThenSet(newVal: any){
      if (!crashEl || !lastRawEl) return;
      crashEl.classList.add('glitch');
      setTimeout(()=>{
        const prev = crashEl.innerText;
        if(prev && prev.trim() !== '' && prev !== '0.00') lastRawEl.innerText = prev;
        const t = (newVal===undefined||newVal===null) ? '0.00' : String(newVal);
        crashEl.innerText = t;
        crashEl.setAttribute('data-text', t);
      }, 220);
      setTimeout(()=> crashEl.classList.remove('glitch'), 560);
    }

    function setStatusIndicator(status: 'live' | 'wait' | 'err', text: string){
      if (!statusDot || !statusText) return;
      statusDot.className = `status-dot ${status === 'live' ? 'connected' : ''}`;
      statusText.textContent = text;
    }

    // --- New Data Reception Logic (SSE & Polling) ---
    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/predictions/current.json";
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const handleData = (data: any) => {
      if (data && data.value) {
        const val = String(data.value);
        if (lastValueRef.current !== val) {
          doGlitchThenSet(val);
          lastValueRef.current = val;
        }
      }
    };

    const startSSE = () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.addEventListener('put', (e) => {
          const payload = JSON.parse(e.data);
          handleData(payload.data);
          setStatusIndicator('live', 'connected (live)');
        });
        eventSource.addEventListener('patch', (e) => {
          const payload = JSON.parse(e.data);
          handleData(payload.data);
          setStatusIndicator('live', 'connected (live)');
        });
        eventSource.onopen = () => setStatusIndicator('live', 'connected (live)');
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
      setStatusIndicator('wait', 'reconnecting...');
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          handleData(data);
          setStatusIndicator('live', 'connected (polling)');
        } catch (e) {
          setStatusIndicator('err', 'connection error');
        }
      }, 2000);
    };

    startSSE();

    // Matrix background
    const canvas = canvasRef.current;
    let matrixInterval: NodeJS.Timeout;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            let W = canvas.width = window.innerWidth;
            let H = canvas.height = window.innerHeight;
            let cols = Math.floor(W / 10) + 1;
            let ypos = Array(cols).fill(0);
            const letters = '01・〇●■▲▼◆abcdefghijklmnopqrstuvwxyz0123456789';
            const matrixResize = () => {
                W = canvas.width = window.innerWidth;
                H = canvas.height = window.innerHeight;
                cols = Math.floor(W / 10) + 1;
                ypos = Array(cols).fill(0);
            };
            window.addEventListener('resize', matrixResize);
            const drawMatrix = () => {
                ctx.fillStyle = 'rgba(0,0,0,0.22)';
                ctx.fillRect(0,0,W,H);
                ctx.font = '12px monospace';
                ypos.forEach((y, ind) => {
                    const text = letters.charAt(Math.floor(Math.random() * letters.length));
                    const x = ind * 10;
                    ctx.fillStyle = 'rgba(0,255,120,'+ (0.18 + Math.random()*0.6) +')';
                    ctx.fillText(text, x, y);
                    if(y > H + Math.random()*700) ypos[ind] = 0;
                    else ypos[ind] = y + 12 + Math.random()*8;
                });
            };
            matrixInterval = setInterval(drawMatrix, 40);
            (window as any).__matrixCleanup = () => {
                window.removeEventListener('resize', matrixResize);
                clearInterval(matrixInterval);
            };
        }
    }

    let totalSeconds = parseValidityToSeconds(validity);
    const handleSessionEnd = () => {
      sessionStorage.removeItem('razor_session_validity');
      sessionStorage.removeItem('razor_user_id');
      router.push('/');
    }
    function updateTimer(){
      if (!timerEl) return;
      const h = Math.floor(totalSeconds/3600);
      const m = Math.floor((totalSeconds%3600)/60);
      const s = totalSeconds%60;
      timerEl.innerText = `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
    }
    const timerInterval = setInterval(() => { 
      if (totalSeconds > 0) { totalSeconds--; updateTimer(); }
      else { clearInterval(timerInterval); handleSessionEnd(); }
    }, 1000);
    updateTimer();

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(timerInterval);
      if ((window as any).__matrixCleanup) (window as any).__matrixCleanup();
    };
  }, [router]);

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
          .brand .logo-text, .brand h1, #username { font-family: 'Orbitron', sans-serif !important; font-weight: 900 !important; }
          canvas#matrix{position:fixed;inset:0;z-index:0;display:block}
          .wrap{position:relative;z-index:3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
          .panel{ width:min(920px,94%);max-width:920px;margin:0 auto; background: transparent; border-radius:14px;padding:28px; display:flex;flex-direction:column;gap:18px;align-items:center;overflow:visible; }
          .brand{display:flex;flex-direction:column;align-items:center;gap:6px}
          .brand .logo-text{font-size:1.1rem;color:var(--neon-white);font-weight:900;letter-spacing:2px;cursor:default}
          #crashValue { color: var(--neon-white); text-shadow: 0 0 8px var(--neon-green); }
          .brand h1, .status-dot.connected { text-shadow: 0 0 5px var(--neon-green), 0 0 10px var(--neon-green), 0 0 15px var(--neon-green), 0 0 20px var(--neon-green); }
          .brand h1{ font-size:2rem;margin:0;color:var(--neon-green);letter-spacing:4px;font-weight:900; }
          .display-circle{ width:420px;height:420px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative; background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45)); border:1px solid rgba(0,255,120,0.04); overflow:hidden; }
          #crashValue{ font-size:6rem;font-weight:900;color:var(--neon-white); letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease; text-align:center;white-space:nowrap; -webkit-font-smoothing:antialiased; }
          #crashValue.small{font-size:2.2rem}
          #crashValue.glitch{animation:glitchShort .55s linear}
          @keyframes glitchShort{
            0% { transform: translateY(0) skewX(0deg); opacity:1; filter:brightness(1); }
            20% { transform: translateY(-6px) skewX(-2deg); opacity:0.85; filter:brightness(0.9); }
            40% { transform: translateY(6px) skewX(2deg); opacity:0.9; filter:brightness(1.05); }
            60% { transform: translateY(-3px) skewX(-1deg); opacity:0.95; filter:brightness(0.98); }
            100% { transform: translateY(0) skewX(0deg); opacity:1; filter:brightness(1); }
          }
          .meta-row{ display:flex;gap:18px;align-items:center; justify-content:center; width:100%; flex-wrap:wrap; }
          .timer-big{ font-weight:800;color:var(--neon-white); background:transparent;padding:8px 12px;border-radius:10px; font-size:1.05rem;letter-spacing:0.6px;text-align:center; border:1px solid rgba(255,255,255,0.02); }
          .last-box{ background:transparent;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.02);min-width:140px;text-align:center }
          .last-box .label{font-size:0.82rem;color:rgba(230,255,248,0.6)}
          .last-box .value{font-weight:700;color:var(--neon-white);font-size:1.05rem}
          .connection-status { position: fixed; top: 15px; right: 20px; display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', monospace; font-size: 16px; color: white; z-index: 9999; }
           .user-id-display { position: fixed; top: 15px; left: 20px; display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', monospace; font-size: 16px; color: white; z-index: 9999; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(0,255,120,0.1); }
          .status-dot{ width:14px;height:14px;border-radius:50%; background:var(--neon-gray); box-shadow:0 0 6px rgba(0,0,0,0.6) inset; transition:all .28s ease; }
          .status-dot.connected{ background:var(--neon-green); }
          footer{display:none}
          @media (max-width:900px){ .panel{padding:18px} .display-circle{width:320px;height:320px} #crashValue{font-size:4rem} .meta-row{gap:10px} }
          #username { text-decoration: none; color: var(--neon-white); }
        `}</style>
      
       <div className="user-id-display">
        <User size={16} color="var(--neon-green)" />
        <span>{userId}</span>
      </div>
      <div className="connection-status">
        <div id="statusDot" className="status-dot" ref={statusDotRef}></div>
        <span id="statusText" ref={statusTextRef}>Disconnected</span>
      </div>
      <div className="wrap">
        <div className="panel">
          <div className="brand">
            <div className="logo-text">1XBET</div>
            <h1 className="neon-label">RAZOR</h1>
          </div>
            <a id="username" ref={usernameButtonRef} target="_blank" rel="noopener noreferrer">Telegram : @Razor_1x</a>
          <div className="display-circle" aria-hidden="false">
            <div className="inner-ring" style={{position: 'absolute', inset: '18px', borderRadius: '50%', pointerEvents: 'none', mixBlendMode: 'overlay'}}></div>
            <div id="crashValue" ref={crashValueRef} data-text="0.00">0.00</div>
          </div>
          <div className="meta-row">
            <div className="timer-big" id="timer" ref={timerRef}>00 : 00 : 00</div>
            <div className="last-box" aria-hidden="false">
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
