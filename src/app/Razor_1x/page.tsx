
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Loader2, Search, Cpu, Zap, ShieldCheck } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import { motion, AnimatePresence } from 'framer-motion';

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "INTERCEPTING DATA STREAM...", icon: Search },
    { text: "DECRYPTING HASH VALUES...", icon: Cpu },
    { text: "ESTABLISHING SECURE UPLINK...", icon: Zap },
    { text: "ANALYSIS COMPLETE", icon: ShieldCheck }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 600);
        return prev;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 text-white font-bold">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="relative h-20 w-20 mx-auto">
            <Loader2 className="h-20 w-20 text-white animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full animate-ping" />
            </div>
        </div>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 justify-center transition-all duration-500 ${step >= i ? "opacity-100 scale-100" : "opacity-10 scale-95"}`}>
               <span className="text-[10px] tracking-[0.2em] uppercase font-black">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [crashValue, setCrashValue] = useState<string>("0.00");
  const [lastRaw, setLastRaw] = useState<string>("—");
  const [status, setStatus] = useState<"live" | "wait">("wait");
  const [timeLeft, setTimeLeft] = useState<string>("000 : 00 : 00");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isResultVisible, setIsResultVisible] = useState(false);
  
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

  useEffect(() => {
    document.title = "RAZOR — Predictor V2";
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/');
      return;
    }
    setUserId(storedUserId);

    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/predictions/current.json";
    let pollInterval = setInterval(async () => {
      try {
        const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        stateRef.current = data;
        setStatus("live");
      } catch (e) { setStatus("wait"); }
    }, 2000);

    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setTimeLeft(`${String(h).padStart(3, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/');
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [router]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
  };

  const onAnalysisComplete = () => {
    setIsAnalyzing(false);
    setIsResultVisible(true);
    
    // Logic: Use DB value if exists, otherwise generate random
    let finalVal = "0.00";
    if (stateRef.current && stateRef.current.value) {
      finalVal = Number(stateRef.current.value).toFixed(2);
    } else {
      // Random fallback between 1.10 and 3.50
      finalVal = (Math.random() * (3.5 - 1.1) + 1.1).toFixed(2);
    }
    
    setLastRaw(prev => (prev !== finalVal && crashValue !== "0.00" ? crashValue : prev));
    setCrashValue(finalVal);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

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
          .dial::before { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 1px solid var(--ring); box-shadow: inset 0 0 30px rgba(255,255,255,0.03); }
          .dial::after { content: ""; position: absolute; inset: -2px; border-radius: 50%; background: conic-gradient(from 0deg, transparent 0deg, var(--ring-glow) 30deg, transparent 90deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px)); animation: spin 5s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .value { position: relative; font-size: 72px; font-family: var(--font-accent); text-shadow: 0 0 30px rgba(255,255,255,0.6); }
          .value::after { content: "x"; font-size: 28px; vertical-align: super; margin-left: 5px; opacity: 0.6; }
          .btn-analyze {
            background: white;
            color: black;
            font-weight: 900;
            padding: 18px 40px;
            border-radius: 15px;
            letter-spacing: 2px;
            text-transform: uppercase;
            box-shadow: 0 10px 30px rgba(255,255,255,0.2);
            transition: all 0.3s;
            font-family: 'Orbitron', sans-serif;
            border: none;
            cursor: pointer;
          }
          .btn-analyze:active { transform: scale(0.95); }
          .footer { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 10px; }
          .timer { font-size: 18px; letter-spacing: 2px; font-weight: bold; }
          .lastraw { text-align: right; }
          .lastraw .label { font-size: 10px; color: var(--muted); margin-bottom: 5px; display: block; }
          .lastraw .val { font-size: 16px; font-weight: bold; font-family: var(--font-accent); }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && <AnalysisOverlay onComplete={onAnalysisComplete} />}
      </AnimatePresence>

      <div className="app">
        <header className="topbar">
          <div className="user-chip">
            <User size={14} />
            <span>{userId}</span>
          </div>
          <div className="status">
            <span className="dot"></span>
            <span>{status === 'live' ? 'READY' : 'WAIT'}</span>
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
            <div className="value">{isResultVisible ? crashValue : "0.00"}</div>
          </div>
          {!isResultVisible && (
            <button onClick={handleStartAnalysis} className="btn-analyze">Start Analysis</button>
          )}
          {isResultVisible && (
             <button onClick={() => setIsResultVisible(false)} className="text-[10px] text-white/30 uppercase tracking-[0.4em] hover:text-white transition-all">Reset Analysis</button>
          )}
        </div>

        <footer className="footer">
          <div className="timer">{timeLeft}</div>
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
