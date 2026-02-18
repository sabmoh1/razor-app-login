"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { User, Settings } from 'lucide-react';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isInitialWait, setIsInitialWait] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  
  const doGlitchThenSet = useCallback((newVal: any) => {
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    if (!crashEl || !lastRawEl) return;

    crashEl.classList.add('glitch');
    setTimeout(() => {
      const prev = crashEl.innerText;
      if (prev && prev.trim() !== '' && prev !== '0.00') {
        lastRawEl.innerText = prev;
      }
      const t = (newVal === undefined || newVal === null) ? '0.00' : String(newVal);
      crashEl.innerText = t;
      crashEl.setAttribute('data-text', t);
    }, 220);
    setTimeout(() => crashEl.classList.remove('glitch'), 560);
  }, []);

  // Load user ID and predictions from session/local storage
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const validity = sessionStorage.getItem('razor_session_validity'); // We still check this to ensure login was valid

    if (!storedUserId || !validity) {
      router.push('/b16vip');
      return;
    }
    setUserId(storedUserId);

    try {
      const savedPredictions = localStorage.getItem('b16vip_predictions');
      if (savedPredictions) {
        setPredictions(JSON.parse(savedPredictions));
      }
    } catch (e) {
      console.error("Failed to parse predictions from localStorage", e);
    }
  }, [router]);

  // Handle the initial 10-second wait before showing the first prediction
  useEffect(() => {
    if (predictions.length > 0 && isInitialWait) {
      const initialTimeout = setTimeout(() => {
        setCurrentIndex(0);
        doGlitchThenSet(predictions[0]);
        setIsInitialWait(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(initialTimeout);
    }
  }, [predictions, isInitialWait, doGlitchThenSet]);

  // Handle screen clicks to show next prediction
  const handleScreenClick = useCallback(() => {
    if (isInitialWait || predictions.length === 0) return;

    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % predictions.length;
      doGlitchThenSet(predictions[nextIndex]);
      return nextIndex;
    });
  }, [isInitialWait, predictions, doGlitchThenSet]);

  // Admin panel access trigger
  const handleAdminTriggerClick = () => {
    router.push('/b16vip/admin');
  };

  // Dummy timer and matrix effect to replicate the original look
  useEffect(() => {
    const timerEl = timerRef.current;
    let seconds = 0;
    const timerInterval = setInterval(() => {
      seconds++;
      const h = Math.floor(seconds/3600);
      const m = Math.floor((seconds%3600)/60);
      const s = seconds%60;
      if(timerEl) timerEl.innerText = `${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`;
    }, 1000);

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
                    ctx.fillStyle = 'rgba(0,191,255,'+ (0.18 + Math.random()*0.6) +')';
                    ctx.fillText(text, x, y);
                    if(y > H + Math.random()*700) {
                        ypos[ind] = 0;
                    } else {
                        ypos[ind] = y + 12 + Math.random()*8;
                    }
                });
            };
            matrixInterval = setInterval(drawMatrix, 40);
            
             const cleanup = () => {
                window.removeEventListener('resize', matrixResize);
                clearInterval(matrixInterval);
                clearInterval(timerInterval);
             };

            (window as any).__b16vipCleanup = cleanup;
        }
    }
    
    return () => {
        if ((window as any).__b16vipCleanup) {
          (window as any).__b16vipCleanup();
        } else {
            clearInterval(timerInterval);
        }
    };
  }, []);

  return (
    <>
      <Head>
        <title>B16VIP — Terminal</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{\`
          :root{ --bg:#000; --neon-primary:#00bfff; --neon-white:#e6fff8; --neon-gray:#666; --accent:#00bfff; }
          *{box-sizing:border-box}
          html,body{height:100%;margin:0;font-family: 'Orbitron', sans-serif;background:var(--bg);color:var(--neon-white);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
          body, .font-orbitron, .timer-big, .last-box .value, .last-box .label, #crashValue { font-family: 'Orbitron', sans-serif !important; font-weight: 900 !important; }
          .brand .logo-text, .brand h1, #username { font-family: 'Orbitron', sans-serif !important; font-weight: 900 !important; }
          canvas#matrix{position:fixed;inset:0;z-index:0;display:block}
          .wrap{position:relative;z-index:3;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px; cursor: pointer;}
          .header-controls { position: absolute; top: 15px; width: 100%; display: flex; justify-content: space-between; padding: 0 20px; z-index: 9999; }
          .panel{ width:min(920px,94%);max-width:920px;margin:0 auto; background: transparent; border-radius:14px;padding:28px; display:flex;flex-direction:column;gap:18px;align-items:center;overflow:visible; margin-top: 60px;}
          .brand{display:flex;flex-direction:column;align-items:center;gap:6px}
          .brand .logo-text{font-size:1.1rem;color:var(--neon-white);font-weight:900;letter-spacing:2px;cursor:default}
          #crashValue { color: var(--neon-primary); text-shadow: 0 0 8px var(--neon-primary); }
          .brand h1{ font-size:2rem;margin:0;color:var(--neon-primary);letter-spacing:4px;font-weight:900; text-shadow: 0 0 5px var(--neon-primary), 0 0 10px var(--neon-primary), 0 0 15px var(--neon-primary), 0 0 20px var(--neon-primary); }
          .display-circle{ width:420px;height:420px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative; background: radial-gradient(ellipse at center, rgba(0,0,0,0.18), rgba(0,0,0,0.45)); border:1px solid rgba(0,191,255,0.04); overflow:hidden; }
          #crashValue{ font-size:6rem;font-weight:900; letter-spacing: 1px;transition:transform .18s ease, opacity .18s ease; text-align:center;white-space:nowrap; -webkit-font-smoothing:antialiased; }
          #crashValue.glitch{ animation: glitch-taz-taz 0.5s linear; }
          @keyframes glitch-taz-taz {
            0% { clip-path: inset(3% 0 94% 0); transform: translate(-10px, -5px); opacity: 0.8; }
            20% { clip-path: inset(80% 0 3% 0); transform: translate(10px, 5px); }
            40% { clip-path: inset(45% 0 45% 0); transform: translate(-5px, 0); opacity: 0.7; }
            60% { clip-path: inset(90% 0 5% 0); transform: translate(5px, 0); }
            80% { clip-path: inset(5% 0 88% 0); transform: translate(-10px, -5px); opacity: 0.9; }
            100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); opacity: 1; }
          }
          .meta-row{display:flex;gap:18px;align-items:center;justify-content:center;width:100%;flex-wrap:wrap;}
          .timer-big{font-weight:800;color:var(--neon-white);background:transparent;padding:8px 12px;border-radius:10px;font-size:1.05rem;letter-spacing:0.6px;text-align:center;border:1px solid rgba(255,255,255,0.02);}
          .last-box{background:transparent;padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.02);min-width:140px;text-align:center}
          .last-box .label{font-size:0.82rem;color:rgba(230,255,248,0.6)}
          .last-box .value{font-weight:700;color:var(--neon-white);font-size:1.05rem}
          .user-id-display { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', monospace; font-size: 16px; color: white; background: rgba(0,0,0,0.3); padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(0,191,255,0.1); cursor: pointer; }
      \`}</style>

      <canvas id="matrix" ref={canvasRef}></canvas>

       <div className="header-controls">
         <div className="user-id-display" onClick={handleAdminTriggerClick}>
          <User size={16} color="var(--neon-primary)" />
          <span>{userId}</span>
        </div>
        <div className="connection-status" style={{visibility: 'hidden'}}>
        </div>
       </div>

      <div className="wrap" onClick={handleScreenClick}>
        <div className="panel">
          <div className="brand">
            <h1 className="neon-label">B16VIP</h1>
          </div>
            <a id="username" target="_blank" rel="noopener noreferrer">Prediction System</a>
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

export default function B16VipWelcomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
