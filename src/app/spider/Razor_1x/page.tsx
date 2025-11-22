
"use client";

import { useEffect, useRef, Suspense } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";

function WelcomeContent() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spiderCanvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  const statusDotRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
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

    if (!validity) {
      router.push('/spider/login');
      return;
    }
    
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
        // Not valid JSON
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

    const connectWebSocket = (url: string) => {
        if (wsRef.current) wsRef.current.close();
        wsRef.current = new WebSocket(url);
        wsRef.current.onopen = () => { 
            setStatusIndicator(true); 
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        };
        wsRef.current.onmessage = (ev) => setCrashText(ev.data);
        wsRef.current.onclose = () => { 
            wsRef.current = null;
            setStatusIndicator(false); 
            if (totalSeconds > 0 && !reconnectTimeoutRef.current) {
                reconnectTimeoutRef.current = setTimeout(initializeWebSocket, 1200);
            }
        };
        wsRef.current.onerror = () => { 
            setStatusIndicator(false); 
            wsRef.current?.close();
        };
    }
    
    const initializeWebSocket = async () => {
        try {
            const snapshot = await get(ref(database, 'websocket_url'));
            if (snapshot.exists()) {
                connectWebSocket(snapshot.val());
            } else {
                setStatusIndicator(false);
            }
        } catch (error) {
            console.error("Error fetching WebSocket URL:", error);
            setStatusIndicator(false);
        }
    }

    // --- Matrix background script ---
    const matrixCanvas = canvasRef.current;
    let matrixInterval: NodeJS.Timeout;
    if (matrixCanvas) {
        const ctx = matrixCanvas.getContext('2d');
        if (ctx) {
            let W = matrixCanvas.width = window.innerWidth;
            let H = matrixCanvas.height = window.innerHeight;
            let cols = Math.floor(W / 10) + 1;
            let ypos = Array(cols).fill(0);
            const letters = '01・〇●■▲▼◆abcdefghijklmnopqrstuvwxyz0123456789';

            const matrixResize = () => {
                W = matrixCanvas.width = window.innerWidth;
                H = matrixCanvas.height = window.innerHeight;
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
                    ctx.fillStyle = 'rgba(255,0,60,'+ (0.18 + Math.random()*0.6) +')'; // RED
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

    // --- Hanging spiders animation ---
    const spiderCanvas = spiderCanvasRef.current;
    let spiderInterval: NodeJS.Timeout;
    if (spiderCanvas) {
      const ctx = spiderCanvas.getContext('2d');
      if (ctx) {
        let W = spiderCanvas.width = window.innerWidth;
        let H = spiderCanvas.height = window.innerHeight;
        
        class Spider {
          x: number;
          y: number;
          threadLength: number;
          maxThreadLength: number;
          speed: number;
          direction: number;

          constructor() {
            this.x = Math.random() * W;
            this.y = -10;
            this.maxThreadLength = 100 + Math.random() * (H * 0.6);
            this.threadLength = 0;
            this.speed = 0.5 + Math.random() * 1.5;
            this.direction = 1; // 1 for down, -1 for up
          }
          
          draw() {
            if(!ctx) return;
            // Thread
            ctx.beginPath();
            ctx.moveTo(this.x, 0);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = 'rgba(255, 0, 60, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            
            // Spider body
            ctx.fillStyle = 'rgba(255, 0, 60, 0.9)';
            ctx.font = '12px monospace';
            ctx.fillText("╭(🕷)╮", this.x - 12, this.y + 10);
          }
          
          update() {
            this.y += this.speed * this.direction;
            this.threadLength = this.y;
            
            if (this.threadLength > this.maxThreadLength) this.direction = -1;
            if (this.y < -20) {
              // Reset
              this.x = Math.random() * W;
              this.y = -10;
              this.direction = 1;
              this.maxThreadLength = 100 + Math.random() * (H * 0.6);
            }
          }
        }

        const hangingSpiders = [new Spider(), new Spider(), new Spider()];

        const resizeSpiderCanvas = () => {
          W = spiderCanvas.width = window.innerWidth;
          H = spiderCanvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeSpiderCanvas);

        const animateSpiders = () => {
          ctx.clearRect(0,0,W,H);
          hangingSpiders.forEach(s => {
            s.update();
            s.draw();
          });
        }
        spiderInterval = setInterval(animateSpiders, 50);

        (window as any).__spiderCleanup = () => {
            window.removeEventListener('resize', resizeSpiderCanvas);
            clearInterval(spiderInterval);
        };
      }
    }


    // --- Timer script ---
    let totalSeconds = parseValidityToSeconds(validity);
    const handleSessionEnd = () => {
      if (wsRef.current) wsRef.current.close();
      if (timerEl) timerEl.innerText = 'EXPIRED';
      sessionStorage.removeItem('razor_session_validity');
      router.push('/spider/login');
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

    initializeWebSocket();

    return () => {
      if ((window as any).__matrixCleanup) (window as any).__matrixCleanup();
      if ((window as any).__spiderCleanup) (window as any).__spiderCleanup();
      clearInterval(timerInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>SPIDER BET — Crimson Matrix</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
          :root{
            --bg:#000;
            --neon-red:#ff003c;
            --neon-white:#e6fff8;
            --neon-gray:#666;
            --accent:#ff005a;
          }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family: 'Orbitron', sans-serif;background:var(--bg);color:var(--neon-white);-webkit-font-smoothing:antialiased;overflow-x:hidden}
          canvas#matrix{position:fixed;inset:0;z-index:0;display:block}
          canvas#spider-canvas{position:fixed;inset:0;z-index:1;display:block;pointer-events:none;}
          .wrap{position:relative;z-index:3;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
          .panel{
            width:min(920px,94%);max-width:920px;margin:0 auto;
            background: transparent;
            border-radius:14px;padding:28px;
            display:flex;flex-direction:column;gap:18px;align-items:center;overflow:visible;
          }
          .brand{display:flex;flex-direction:column;align-items:center;gap:6px}
          .brand .logo-text{font-size:1.1rem;color:var(--neon-white);font-weight:900;letter-spacing:2px;cursor:default}
          #crashValue, .brand h1, .status-dot.connected {
            text-shadow:
              0 0 5px var(--neon-red),
              0 0 10px var(--neon-red),
              0 0 20px var(--neon-red),
              0 0 40px var(--neon-red),
              0 0 80px rgba(255,0,60,0.5);
          }
          .brand h1{
            font-size:2rem;margin:0;color:var(--neon-red);letter-spacing:4px;font-weight:900;
          }
          .display-circle{
            width:420px;height:420px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;
            background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45));
            border:1px solid rgba(255,0,60,0.04);
            overflow:hidden;
          }
          #crashValue{
            font-size:6rem;font-weight:900;color:var(--neon-red);
            letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease;
            text-align:center;white-space:nowrap;
            -webkit-font-smoothing:antialiased;
          }
          #crashValue.glitch{animation:glitchShort .55s linear}
          @keyframes glitchShort{
            0% { transform: translateY(0) skewX(0deg); opacity:1; filter:brightness(1); }
            20% { transform: translateY(-6px) skewX(-2deg); opacity:0.85; filter:brightness(0.9); }
            40% { transform: translateY(6px) skewX(2deg); opacity:0.9; filter:brightness(1.05); }
            60% { transform: translateY(-3px) skewX(-1deg); opacity:0.95; filter:brightness(0.98); }
            100% { transform: translateY(0) skewX(0deg); opacity:1; filter:brightness(1); }
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
            position: fixed; top: 15px; right: 20px; display: flex; align-items: center; gap: 8px;
            font-family: 'Orbitron', monospace; font-size: 16px; color: white; z-index: 9999;
          }
          .status-dot{
            width:14px;height:14px;border-radius:50%; background:var(--neon-gray);
            box-shadow:0 0 6px rgba(0,0,0,0.6) inset; transition:all .28s ease;
          }
          .status-dot.connected{ background:var(--neon-red); }
          #username { text-decoration: none; color: var(--neon-white); }
        `}</style>
      <canvas id="matrix" ref={canvasRef}></canvas>
      <canvas id="spider-canvas" ref={spiderCanvasRef}></canvas>
      <div className="connection-status">
        <div id="statusDot" className="status-dot" ref={statusDotRef}></div>
        <span id="statusText" ref={statusTextRef}>Disconnected</span>
      </div>
      <div className="wrap">
        <div className="panel">
          <div className="brand">
            <div className="logo-text">1XBET</div>
            <h1 className="neon-label">SPIDER BET</h1>
          </div>
            <a id="username" target="_blank" rel="noopener noreferrer">Telegram : @Razor_1x</a>
          <div className="display-circle" aria-hidden="false">
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
    </>
  );
}

export default function SpiderWelcomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
