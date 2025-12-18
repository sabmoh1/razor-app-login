
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 60 * 60; // Default to 1 hour
    const value = parseInt(validity.slice(0, -1));
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 60 * 60;

    switch (unit) {
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 60 * 60;
    }
  };

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/sigma');
      return;
    }

    setUserId(storedUserId);
    
    // --- Refs for UI elements ---
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    const statusDot = statusDotRef.current;
    const statusText = statusTextRef.current;
    const timerEl = timerRef.current;
    const usernameButton = usernameButtonRef.current;

    // --- Utility functions for UI ---
    function doGlitchThenSet(newVal: any){
      if (!crashEl || !lastRawEl) return;
      crashEl.classList.add('glitch');
      setTimeout(()=>{
        const prev = crashEl.innerText;
        if(prev && prev.trim() !== '') lastRawEl.innerText = prev;
        const t = (newVal===undefined||newVal===null) ? '' : String(newVal);
        crashEl.innerText = t;
        crashEl.setAttribute('data-text', t);
      }, 220);
      setTimeout(()=> crashEl.classList.remove('glitch'), 560);
    }

    function setCrashText(data: string) {
      try {
        const jsonStart = data.indexOf('{');
        const jsonEnd = data.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) return;

        const jsonString = data.substring(jsonStart, jsonEnd + 1);
        
        const parsed = JSON.parse(jsonString);
        if (parsed && typeof parsed.oncrash !== 'undefined') {
          doGlitchThenSet(parsed.oncrash);
        }
      } catch (e) {
        // The data was not valid JSON, do nothing to prevent errors
      }
    }

    function setStatusIndicator(connected: boolean){
      if (!statusDot || !statusText) return;
      if(connected){
        statusDot.classList.add('connected');
        statusText.textContent = "connected ";
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = "disconnected";
      }
    }

    // --- WebSocket Connection Logic ---
    const connectWebSocket = (url: string) => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        wsRef.current = new WebSocket(url);
        
        wsRef.current.onopen = () => { 
            setStatusIndicator(true); 
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        wsRef.current.onmessage = (ev) => {
            setCrashText(ev.data);
        };

        wsRef.current.onclose = () => { 
            wsRef.current = null;
            setStatusIndicator(false); 
            // Only try to reconnect if the session is still valid
            if (totalSeconds > 0) {
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(initializeWebSocket, 1200);
                }
            }
        };

        wsRef.current.onerror = () => { 
            setStatusIndicator(false); 
            wsRef.current?.close(); // This will trigger onclose and the reconnect logic
        };
    }
    
    const initializeWebSocket = async () => {
        try {
            const snapshot = await get(ref(database, 'websocket_url'));
            if (snapshot.exists()) {
                const WS_URL = snapshot.val();
                connectWebSocket(WS_URL);
            } else {
                setStatusIndicator(false);
            }
        } catch (error) {
            console.error("Error fetching WebSocket URL:", error);
            setStatusIndicator(false);
        }
    }

    // --- Matrix background script ---
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
                    ctx.fillStyle = 'rgba(0,191,255,'+ (0.18 + Math.random()*0.6) +')'; // BLUE
                    ctx.fillText(text, x, y);
                    if(y > H + Math.random()*700) {
                    ypos[ind] = 0;
                    } else {
                    ypos[ind] = y + 12 + Math.random()*8;
                    }
                });
            };
            matrixInterval = setInterval(drawMatrix, 40);

            // Cleanup for matrix
            // Note: Other cleanup is in the main return
            const mainCleanup = () => {
                window.removeEventListener('resize', matrixResize);
                clearInterval(matrixInterval);
            };
            // This is a bit unusual, but we need to return it from the outer useEffect
            // We'll call it in the main cleanup function
            (window as any).__matrixCleanup = mainCleanup;
        }
    }


    // --- Timer script ---
    let totalSeconds = parseValidityToSeconds(validity);
    
    const handleSessionEnd = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerEl) timerEl.innerText = 'EXPIRED';
      
      sessionStorage.removeItem('razor_session_validity');
      sessionStorage.removeItem('razor_user_id');
      router.push('/sigma');
    }

    function updateTimer(){
      if (!timerEl) return;
      const h = Math.floor(totalSeconds/3600);
      const m = Math.floor((totalSeconds%3600)/60);
      const s = totalSeconds%60;
      timerEl.innerText = `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
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

    // --- username button script ---
    if (usernameButton) {
        const handleUsernameClick = (event: MouseEvent) => {
            event.stopPropagation();
            usernameButton.classList.add("active");
        };

        const handleDocumentClick = () => {
            usernameButton.classList.remove("active");
        };

        const handleUsernameMouseDown = (event: MouseEvent) => {
            event.stopPropagation();
        };

        usernameButton.addEventListener("click", handleUsernameClick);
        document.addEventListener("click", handleDocumentClick);
        usernameButton.addEventListener("mousedown", handleUsernameMouseDown);

        // This is a bit unusual, but we need to return it from the outer useEffect
        (window as any).__usernameCleanup = () => {
            usernameButton.removeEventListener("click", handleUsernameClick);
            document.removeEventListener("click", handleDocumentClick);
            usernameButton.removeEventListener("mousedown", handleUsernameMouseDown);
        }
    }

    // --- Initial connection ---
    initializeWebSocket();

    // --- Main Cleanup function ---
    return () => {
      if ((window as any).__matrixCleanup) {
          (window as any).__matrixCleanup();
      }
      clearInterval(timerInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect logic on manual close
        wsRef.current.close();
        wsRef.current = null;
      }
      if ((window as any).__usernameCleanup) {
          (window as any).__usernameCleanup();
      }
    };
  }, [router]);

  return (
    <KillSwitch pageName="sigma">
      <Head>
        <title>SIGMA — Neon Matrix</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
          :root{
            --bg:#000;
            --neon-blue:#00bfff;
            --neon-white:#e6fff8;
            --neon-gray:#666;
            --accent:#00e5ff;
          }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family: 'Orbitron', sans-serif;background:var(--bg);color:var(--neon-white);-webkit-font-smoothing:antialiased;overflow-x:hidden}
          body, .font-orbitron, .timer-big, .last-box .value, .last-box .label, #crashValue {
             font-family: 'Orbitron', sans-serif !important;
             font-weight: 900 !important;
          }
          .brand .logo-text, .brand h1, #username {
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
          .brand .logo-text{font-size:1.1rem;color:var(--neon-white);font-weight:900;letter-spacing:2px;cursor:default}
          #crashValue {
            color: var(--neon-white);
            text-shadow: 0 0 8px var(--neon-blue);
          }
          .brand h1, .status-dot.connected {
            text-shadow:
              0 0 5px var(--neon-blue),
              0 0 10px var(--neon-blue),
              0 0 15px var(--neon-blue),
              0 0 20px var(--neon-blue);
          }
          .brand h1{
            font-size:2rem;margin:0;color:var(--neon-blue);letter-spacing:4px;font-weight:900;
          }
          .display-circle{
            width:420px;height:420px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45));
            border:1px solid rgba(0,191,255,0.04);
            overflow:hidden;
          }
          #crashValue{
            font-size:6rem;font-weight:900;
            letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease;
            text-align:center;white-space:nowrap;
            -webkit-font-smoothing:antialiased;
          }
          #crashValue.small{font-size:2.2rem}
          #crashValue.glitch{
            animation: glitch-taz-taz 0.5s linear;
          }
          @keyframes glitch-taz-taz {
            0% {
              clip-path: inset(3% 0 94% 0);
              transform: translate(-10px, -5px);
              opacity: 0.8;
            }
            20% {
              clip-path: inset(80% 0 3% 0);
              transform: translate(10px, 5px);
            }
            40% {
              clip-path: inset(45% 0 45% 0);
              transform: translate(-5px, 0);
              opacity: 0.7;
            }
            60% {
              clip-path: inset(90% 0 5% 0);
              transform: translate(5px, 0);
            }
            80% {
              clip-path: inset(5% 0 88% 0);
              transform: translate(-10px, -5px);
              opacity: 0.9;
            }
            100% {
              clip-path: inset(0 0 0 0);
              transform: translate(0, 0);
              opacity: 1;
            }
          }
          .meta-row{
            display:flex;gap:18px;align-items:center;
            justify-content:center;
            width:100%;
            flex-wrap:wrap;
          }
          .timer-big{
            font-weight:800;color:var(--neon-white);
            background:transparent;padding:8px 12px;border-radius:10px;
            font-size:1.05rem;letter-spacing:0.6px;text-align:center;
            border:1px solid rgba(255,255,255,0.02);
          }
          .last-box{
            background:transparent;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.02);min-width:140px;text-align:center
          }
          .last-box .label{font-size:0.82rem;color:rgba(230,255,248,0.6)}
          .last-box .value{font-weight:700;color:var(--neon-white);font-size:1.05rem}
          .connection-status {
            position: fixed;
            top: 15px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Orbitron', monospace;
            font-size: 16px;
            color: white;
            z-index: 9999;
          }
           .user-id-display {
            position: fixed;
            top: 15px;
            left: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Orbitron', monospace;
            font-size: 16px;
            color: white;
            z-index: 9999;
            background: rgba(0,0,0,0.3);
            padding: 5px 10px;
            border-radius: 8px;
            border: 1px solid rgba(0,191,255,0.1);
          }
          .status-dot{
            width:14px;height:14px;border-radius:50%;
            background:var(--neon-gray);
            box-shadow:0 0 6px rgba(0,0,0,0.6) inset;
            transition:all .28s ease;
          }
          .status-dot.connected{
            background:var(--neon-blue);
          }
          footer{display:none}
          @media (max-width:900px){
            .panel{padding:18px}
            .display-circle{width:320px;height:320px}
            #crashValue{font-size:4rem}
            .meta-row{gap:10px}
          }
          #username {
            text-decoration: none;
            color: var(--neon-white);
            white-space: nowrap;
            font-size: 0.9rem;
          }
          #username.active {
             /* Add styles for active state if needed */
          }
        `}</style>
      <canvas id="matrix" ref={canvasRef}></canvas>
      <div className="user-id-display">
        <User size={16} color="var(--neon-blue)" />
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
            <h1 className="neon-label">SIGMA</h1>
          </div>
            <a id="username" ref={usernameButtonRef} target="_blank" rel="noopener noreferrer">Telegram : @sigma_betting_dz</a>
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

export default function SigmaWelcomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
