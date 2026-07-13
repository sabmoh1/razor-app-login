
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { User, Cpu, Clock, Hash } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<string>("—");
  const [publishedAt, setPublishedAt] = useState<string>("—");
  const [ago, setAgo] = useState<string>("—");
  const [crashValue, setCrashValue] = useState<string>("0.00");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  const lastPublishedMs = useRef<number | null>(null);

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

  const fmtTime = (v: any) => {
    if (v == null) return "—";
    let ms: number | null = null;
    if (typeof v === "number") ms = v < 1e12 ? v * 1000 : v;
    else if (typeof v === "string") {
      const n = Number(v);
      ms = Number.isFinite(n) ? (n < 1e12 ? n * 1000 : n) : Date.parse(v);
    }
    if (!ms || Number.isNaN(ms)) return String(v);
    const d = new Date(ms);
    return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const doGlitchThenSet = useCallback((newVal: any) => {
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    if (!crashEl || !lastRawEl) return;

    crashEl.classList.add('glitch-v2');
    setTimeout(() => {
      const prev = crashEl.innerText;
      if (prev && prev.trim() !== '' && prev !== '0.00') {
        lastRawEl.innerText = prev;
      }
      const t = (newVal === undefined || newVal === null) ? '0.00' : Number(newVal).toFixed(2);
      setCrashValue(t);
      crashEl.setAttribute('data-text', t);
    }, 200);
    setTimeout(() => crashEl.classList.remove('glitch-v2'), 500);
  }, []);

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);

    // Firebase RTDB Logic for Razor V2
    const currentPredRef = ref(database, 'predictions/current');
    const unsubscribe = onValue(currentPredRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.value != null) doGlitchThenSet(data.value);
        if (data.roundId) setRoundId(data.roundId);
        if (data.publishedAt) {
          setPublishedAt(fmtTime(data.publishedAt));
          lastPublishedMs.current = (typeof data.publishedAt === "number") 
            ? (data.publishedAt < 1e12 ? data.publishedAt * 1000 : data.publishedAt) 
            : Date.parse(data.publishedAt);
        }
      }
    });

    // Session Timer
    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const timerEl = document.getElementById('v2-timer');
        if (timerEl) {
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;
          timerEl.innerText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/');
      }
    }, 1000);

    // Matrix background V2 (Electric White)
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        let cols = Math.floor(W / 15) + 1;
        let ypos = Array(cols).fill(0);
        const letters = '01・〇●■▲▼◆RAZORV2';
        const matrixInterval = setInterval(() => {
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(0, 0, W, H);
          ctx.font = '14px monospace';
          ypos.forEach((y, ind) => {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            const x = ind * 15;
            ctx.fillStyle = 'rgba(255, 255, 255,' + (0.1 + Math.random() * 0.3) + ')';
            ctx.fillText(text, x, y);
            if (y > H + Math.random() * 800) ypos[ind] = 0;
            else ypos[ind] = y + 15;
          });
        }, 50);
        return () => {
            clearInterval(matrixInterval);
            unsubscribe();
            clearInterval(timerInterval);
        };
      }
    }
    return () => {
        unsubscribe();
        clearInterval(timerInterval);
    };
  }, [router, doGlitchThenSet]);

  useEffect(() => {
    const agoInterval = setInterval(() => {
      if (lastPublishedMs.current == null) { setAgo("—"); return; }
      const s = Math.max(0, Math.round((Date.now() - lastPublishedMs.current) / 1000));
      setAgo(s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s");
    }, 1000);
    return () => clearInterval(agoInterval);
  }, []);

  return (
    <>
      <Head>
        <title>RAZOR V2 — OBSIDIAN</title>
      </Head>
      <style jsx global>{`
          :root {
            --v2-bg: #030303;
            --v2-accent: #ffffff;
            --v2-glass: rgba(255, 255, 255, 0.03);
            --v2-border: rgba(255, 255, 255, 0.1);
            --v2-glow: 0 0 15px rgba(255, 255, 255, 0.4);
          }
          body {
            background-color: var(--v2-bg);
            color: #ffffff;
            font-family: 'Orbitron', sans-serif;
            overflow: hidden;
          }
          canvas#v2-matrix { position: fixed; inset: 0; z-index: 0; opacity: 0.5; }
          .v2-wrapper {
            position: relative;
            z-index: 10;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .v2-header {
            position: absolute;
            top: 30px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 40px;
          }
          .v2-user-badge {
            background: var(--v2-glass);
            border: 1px solid var(--v2-border);
            padding: 10px 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: blur(10px);
          }
          .v2-main-display {
            background: var(--v2-glass);
            border: 1px solid var(--v2-border);
            width: min(500px, 90vw);
            aspect-ratio: 1;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: inset 0 0 50px rgba(255,255,255,0.02);
            position: relative;
          }
          .v2-main-display::after {
            content: '';
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.05);
            animation: pulse-ring 4s infinite;
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.2; }
            100% { transform: scale(1); opacity: 0.5; }
          }
          .v2-value {
            font-size: 7rem;
            font-weight: 900;
            letter-spacing: -2px;
            text-shadow: var(--v2-glow);
          }
          .v2-label-small {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 5px;
            color: rgba(255,255,255,0.4);
            margin-bottom: -10px;
          }
          .v2-info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 40px;
            width: min(600px, 95vw);
          }
          .v2-info-card {
            background: var(--v2-glass);
            border: 1px solid var(--v2-border);
            padding: 15px;
            border-radius: 4px;
            text-align: center;
            backdrop-filter: blur(5px);
          }
          .v2-info-card label {
            display: block;
            font-size: 0.6rem;
            color: rgba(255,255,255,0.4);
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .v2-info-card span {
            font-weight: 700;
            font-size: 0.9rem;
            word-break: break-all;
          }
          .v2-footer-meta {
            margin-top: 30px;
            display: flex;
            gap: 30px;
            color: rgba(255,255,255,0.3);
            font-size: 0.8rem;
          }
          .glitch-v2 {
            animation: glitch-anim 0.3s cubic-bezier(.25,.46,.45,.94) both infinite;
          }
          @keyframes glitch-anim {
            0% { transform: translate(0); text-shadow: -2px 0 #fff, 2px 0 #000; }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
          #v2-timer { font-family: monospace; font-weight: bold; font-size: 1.2rem; letter-spacing: 2px; }
        `}</style>

      <canvas id="v2-matrix" ref={canvasRef}></canvas>

      <div className="v2-wrapper">
        <div className="v2-header">
          <div className="v2-user-badge">
            <User size={16} />
            <span style={{fontSize: '0.8rem', letterSpacing: '1px'}}>{userId}</span>
          </div>
          <div className="v2-user-badge">
            <Clock size={16} />
            <span id="v2-timer">00:00:00</span>
          </div>
        </div>

        <div className="v2-main-display">
          <div className="v2-label-small">Multiplier</div>
          <div className="v2-value" ref={crashValueRef}>{crashValue}</div>
          <div style={{color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', marginTop: '10px'}}>
            Last: <span ref={lastRawRef}>—</span>
          </div>
        </div>

        <div className="v2-info-grid">
          <div className="v2-info-card">
            <label><Hash size={10} style={{display: 'inline', marginRight: '5px'}}/> Round</label>
            <span>{roundId}</span>
          </div>
          <div className="v2-info-card">
            <label><Cpu size={10} style={{display: 'inline', marginRight: '5px'}}/> Published</label>
            <span>{publishedAt}</span>
          </div>
          <div className="v2-info-card">
            <label><Clock size={10} style={{display: 'inline', marginRight: '5px'}}/> Ago</label>
            <span>{ago}</span>
          </div>
        </div>

        <div className="v2-footer-meta">
          <span>RAZOR V2.0.4</span>
          <span>SYSTEM: ACTIVE</span>
          <span>ENCRYPTION: AES-256</span>
        </div>
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
