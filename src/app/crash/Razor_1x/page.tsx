
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get, onValue } from "firebase/database";
import { User } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';

type CrashConfig = {
  name: string;
  social_handle: string;
  theme_color: string;
  expires: number;
};

const DEFAULT_CONFIG = {
  name: "CRASH",
  social_handle: "Instagram : nasserbets",
  theme_color: "#00d9a3", // Teal
};

function WelcomeContent() {
  const router = useRouter();
  const [config, setConfig] = useState<Omit<CrashConfig, 'expires'>>(DEFAULT_CONFIG);
  const [userId, setUserId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 3600; // Default to 1 hour
    const value = parseInt(validity.slice(0, -1), 10);
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 3600;

    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return 3600;
    }
  };

  useEffect(() => {
    const configRef = ref(database, 'crash_config');
    const unsubscribeConfig = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.expires > Date.now()) {
        setConfig(data);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    });

    return () => unsubscribeConfig();
  }, []);

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/crash');
      return;
    }

    setUserId(storedUserId);
    
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    const statusDot = statusDotRef.current;
    const statusText = statusTextRef.current;
    const timerEl = timerRef.current;

    function doGlitchThenSet(newVal: any){
      if (!crashEl || !lastRawEl) return;
      crashEl.classList.add('glitch');
      setTimeout(()=>{
        const prev = crashEl.innerText;
        if(prev && prev.trim() !== '' && prev !== "0.00") lastRawEl.innerText = prev;
        const t = (newVal===undefined||newVal===null) ? '0.00' : String(newVal);
        crashEl.innerText = t;
        crashEl.setAttribute('data-text', t);
      }, 220);
      setTimeout(()=> crashEl.classList.remove('glitch'), 560);
    }

    function setCrashText(data: string) {
      try {
        const jsonStart = data.indexOf('{');
        if (jsonStart === -1) return;
        const jsonString = data.substring(jsonStart);
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed.oncrash !== 'undefined') {
          doGlitchThenSet(parsed.oncrash);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    function setStatusIndicator(connected: boolean){
      if (!statusDot || !statusText) return;
      if(connected){
        statusDot.classList.add('connected');
        statusText.textContent = "connected";
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = "disconnected";
      }
    }

    let totalSeconds = parseValidityToSeconds(validity);

    const initializeWebSocket = async () => {
        try {
            const snapshot = await get(ref(database, 'websocket_url'));
            if (!snapshot.exists()) {
                setStatusIndicator(false);
                scheduleReconnect();
                return;
            }
            const WS_URL = snapshot.val();
            connectWebSocket(WS_URL);
        } catch (error) {
            console.error("Error fetching WebSocket URL:", error);
            setStatusIndicator(false);
            scheduleReconnect();
        }
    }
    
    const connectWebSocket = (url: string) => {
        if (wsRef.current) wsRef.current.close();

        wsRef.current = new WebSocket(url);
        wsRef.current.onopen = () => { 
            setStatusIndicator(true); 
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
        wsRef.current.onmessage = (ev) => setCrashText(ev.data);
        wsRef.current.onclose = () => { 
            wsRef.current = null;
            setStatusIndicator(false); 
            scheduleReconnect();
        };
        wsRef.current.onerror = (err) => { 
            console.error('WebSocket Error:', err);
            wsRef.current?.close();
        };
    }

    const scheduleReconnect = () => {
        if (totalSeconds > 0 && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(initializeWebSocket, 2000);
        }
    }

    const handleSessionEnd = () => {
      if (wsRef.current) wsRef.current.close();
      if (timerEl) timerEl.innerText = 'EXPIRED';
      sessionStorage.removeItem('razor_session_validity');
      sessionStorage.removeItem('razor_user_id');
      router.push('/crash');
    }

    function updateTimer(){
      if (!timerEl) return;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      timerEl.innerText = `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }
    
    const timerInterval = setInterval(() => { 
      if (totalSeconds > 0) {
        totalSeconds--; 
        updateTimer(); 
      } else {
        clearInterval(timerInterval);
        handleSessionEnd();
      }
    }, 1000);
    updateTimer();

    initializeWebSocket();

    return () => {
      clearInterval(timerInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [router]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let cols = Math.floor(W / 10) + 1;
    let ypos = Array(cols).fill(0);
    const letters = '01・〇●■▲▼◆CRASH';

    const matrixResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.floor(W / 10) + 1;
      ypos = Array(cols).fill(0);
    };
    window.addEventListener('resize', matrixResize);

    const drawMatrix = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '12px monospace';
      
      const matrixColor = config.theme_color || '#00d9a3';

      ypos.forEach((y, ind) => {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        const x = ind * 10;
        
        // Create a hex color with random alpha for the glow effect
        const alphaHex = Math.floor((0.18 + Math.random() * 0.6) * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = `${matrixColor}${alphaHex}`;
        
        ctx.fillText(text, x, y);
        if (y > H + Math.random() * 700) {
          ypos[ind] = 0;
        } else {
          ypos[ind] = y + 12 + Math.random() * 8;
        }
      });
    };

    const matrixInterval = setInterval(drawMatrix, 40);

    return () => {
      window.removeEventListener('resize', matrixResize);
      clearInterval(matrixInterval);
    };
  }, [config.theme_color]);


  const dynamicGlowStyle = {
    color: config.theme_color,
    textShadow: `
      0 0 5px ${config.theme_color},
      0 0 10px ${config.theme_color},
      0 0 15px ${config.theme_color},
      0 0 20px ${config.theme_color}
    `
  };
  
  const crashValueStyle = {
    color: 'var(--neon-white)',
    textShadow: `0 0 8px ${config.theme_color}`
  };

  const userIdDisplayStyle = {
      borderColor: `${config.theme_color}33`,
  };

  return (
    <KillSwitch pageName="crash">
      <Head>
        <title>{config.name} — Matrix</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
          :root{
            --bg:#000;
            --neon-theme: ${config.theme_color};
            --neon-white:#e6fff8;
            --neon-gray:#666;
            --accent:${config.theme_color};
          }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family: 'Orbitron', sans-serif;background:var(--bg);color:var(--neon-white);-webkit-font-smoothing:antialiased;overflow-x:hidden}
          body, .font-orbitron, .timer-big, .last-box .value, .last-box .label, #crashValue {
             font-family: 'Orbitron', sans-serif !important;
             font-weight: 900 !important;
          }
          canvas#matrix{position:fixed;inset:0;z-index:0;display:block}
          .wrap{position:relative;z-index:3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
          .panel{
            width:min(920px,94%);max-width:920px;margin:0 auto;
            background: transparent;
            border-radius:14px;padding:28px;
            display:flex;flex-direction:column;gap:18px;align-items:center;overflow:visible;
          }
          .brand{display:flex;flex-direction:column;align-items:center;gap:6px}
          .brand h1{font-size:2rem;margin:0;letter-spacing:4px;font-weight:900;}
          .display-circle{
            width:clamp(300px, 80vw, 420px);
            height:clamp(300px, 80vw, 420px);
            border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45));
            border:1px solid ${config.theme_color}1a;
            overflow:hidden;
          }
          #crashValue{
            font-size: clamp(4rem, 15vw, 6rem);
            font-weight:900;
            letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease;
            text-align:center;white-space:nowrap;
            -webkit-font-smoothing:antialiased;
          }
          #crashValue.glitch{
            animation: glitch-taz-taz 0.5s linear;
          }
          @keyframes glitch-taz-taz {
            0% { clip-path: inset(3% 0 94% 0); transform: translate(-10px, -5px); opacity: 0.8; }
            20% { clip-path: inset(80% 0 3% 0); transform: translate(10px, 5px); }
            40% { clip-path: inset(45% 0 45% 0); transform: translate(-5px, 0); opacity: 0.7; }
            60% { clip-path: inset(90% 0 5% 0); transform: translate(5px, 0); }
            80% { clip-path: inset(5% 0 88% 0); transform: translate(-10px, -5px); opacity: 0.9; }
            100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); opacity: 1; }
          }
          .meta-row{display:flex;gap:18px;align-items:center;justify-content:center;width:100%;flex-wrap:wrap;}
          .timer-big, .last-box{background:transparent;padding:8px 12px;border-radius:10px;font-size:1.05rem;text-align:center;border:1px solid rgba(255,255,255,0.05);}
          .last-box{min-width:140px}
          .last-box .label{font-size:0.82rem;color:rgba(230,255,248,0.6)}
          .last-box .value{font-weight:700;color:var(--neon-white);font-size:1.05rem}
          .connection-status, .user-id-display {
            position: fixed; top: 15px; display: flex; align-items: center; gap: 8px; font-size: 16px; color: white; z-index: 9999; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 8px; border: 1px solid;
          }
          .connection-status { right: 20px; border-color: ${config.theme_color}33;}
          .user-id-display { left: 20px; border-color: ${config.theme_color}33;}
          .status-dot{width:14px;height:14px;border-radius:50%;background:var(--neon-gray);box-shadow:0 0 6px rgba(0,0,0,0.6) inset;transition:all .28s ease;}
          .status-dot.connected{background:var(--neon-theme); box-shadow: 0 0 8px var(--neon-theme);}
          #username {text-decoration: none;color: var(--neon-white);white-space: nowrap;font-size: 0.9rem;}
        `}</style>
      <canvas id="matrix" ref={canvasRef}></canvas>
      
      <div className="user-id-display" style={userIdDisplayStyle}>
        <User size={16} color={config.theme_color} />
        <span>{userId}</span>
      </div>
      
      <div className="connection-status">
        <div id="statusDot" className="status-dot" ref={statusDotRef}></div>
        <span id="statusText" ref={statusTextRef}>disconnected</span>
      </div>
      
      <div className="wrap">
        <div className="panel">
          <div className="brand">
            <h1 className="neon-label" style={dynamicGlowStyle}>{config.name}</h1>
          </div>
            <a id="username" target="_blank" rel="noopener noreferrer">{config.social_handle}</a>
          <div className="display-circle" aria-hidden="false">
            <div id="crashValue" ref={crashValueRef} data-text="0.00" style={crashValueStyle}>0.00</div>
          </div>
          <div className="meta-row">
            <div className="timer-big" id="timer" ref={timerRef}>00 : 00 : 00</div>
            <div className="last-box" aria-hidden="false">
              <div className="label">Last Crash</div>
              <div className="value" id="lastRaw" ref={lastRawRef}>-</div>
            </div>
          </div>
        </div>
      </div>
    </KillSwitch>
  );
}

export default function CrashWelcomePage() {
  return (
    <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
