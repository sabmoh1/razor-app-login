
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search, AlertTriangle } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants for Icons ---
const GOLD_WIN = "https://iili.io/ChkCcMP.jpg"; 
const GOLD_LOSE = "https://iili.io/ChkChtp.jpg";

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "INTERCEPTING DATA...", icon: Search },
    { text: "DECRYPTING PATH...", icon: Cpu },
    { text: "SYNCING TERMINAL...", icon: Zap },
    { text: "DONE", icon: ShieldCheck }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-white font-bold">
      <div className="w-full max-w-xs space-y-8 text-center">
        <Loader2 className="h-12 w-12 text-yellow-500 animate-spin mx-auto mb-4" />
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 justify-center transition-all ${step >= i ? "opacity-100" : "opacity-20"}`}>
               <span className="text-xs tracking-tighter uppercase">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function WildWestTerminal() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [status, setStatus] = useState<"live" | "wait">("wait");
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPathVisible, setIsPathVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
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

  const updateUI = useCallback((newState: any) => {
    stateRef.current = newState;
    setGameData(newState);
    if (!newState) {
        setIsPathVisible(false);
        setStatus("wait");
    } else {
        setStatus("live");
    }
  }, []);

  useEffect(() => {
    document.title = "WILD WEST — Terminal V1";
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/wildwest');
      return;
    }
    setUserId(storedUserId);

    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/wildwest/current_game.json";
    let pollInterval = setInterval(async () => {
      try {
        const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        updateUI(data);
      } catch (e) { setStatus("wait"); }
    }, 2000);

    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/wildwest');
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [router, updateUI]);

  const handleStartAnalysis = () => {
    setErrorMsg(null);
    if (!gameData) {
      setErrorMsg("NO DATA DETECTED");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setIsAnalyzing(true);
  };

  return (
    <KillSwitch pageName="wildwest">
      <style jsx global>{`
          :root { --gold: #FFD700; --bg: #050505; }
          body {
            background: var(--bg);
            color: white;
            font-family: 'Orbitron', sans-serif;
            overflow: hidden;
            height: 100vh;
          }
          .terminal-container {
            max-width: 450px;
            margin: 0 auto;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 8px 12px;
            background: radial-gradient(circle at top, #111 0%, #050505 100%);
          }
          .grid-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column-reverse;
            gap: 2px;
            padding: 4px 0;
            overflow: hidden;
            position: relative;
          }
          .row {
            display: grid;
            gap: 3px;
            height: 9.5%; /* Precision for 10 rows with gap */
          }
          .cell {
            background: rgba(255,215,0,0.02);
            border: 1px solid rgba(255,215,0,0.05);
            border-radius: 4px;
            display: flex;
            items-center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            transition: all 0.3s ease;
          }
          .cell.active { border-color: rgba(255,215,0,0.15); background: rgba(255,215,0,0.04); }
          .cell-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .btn-main {
             background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%);
             color: black;
             font-weight: 900;
             padding: 12px 24px;
             border-radius: 8px;
             font-size: 14px;
             letter-spacing: 1px;
             text-transform: uppercase;
             box-shadow: 0 0 15px rgba(255,215,0,0.3);
             z-index: 60;
          }
          .btn-main:active { transform: scale(0.95); }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && (
          <AnalysisOverlay onComplete={() => {
            setIsAnalyzing(false);
            setIsPathVisible(true);
          }} />
        )}
      </AnimatePresence>

      <div className="terminal-container">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <User size={12} className="text-yellow-500" />
            <span className="text-[10px] font-bold">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-yellow-500 animate-pulse shadow-[0_0_8px_#FFD700]' : 'bg-gray-600'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{status === 'live' ? 'READY' : 'WAIT'}</span>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mb-2">
            <h1 className="text-sm font-black text-yellow-500 tracking-[0.2em]">WILD WEST TERMINAL</h1>
            <div className="h-px w-20 bg-yellow-500/20 mx-auto mt-1" />
        </div>

        {/* Main Grid Area */}
        <div className="grid-wrapper">
          {/* Analysis Trigger Overlay */}
          {!isPathVisible && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-xl">
               {errorMsg ? (
                 <motion.div 
                    initial={{ scale: 0.8 }} 
                    animate={{ scale: 1 }} 
                    className="flex flex-col items-center text-red-500 mb-4"
                 >
                    <AlertTriangle size={32} />
                    <span className="text-[10px] mt-2 font-black tracking-widest">{errorMsg}</span>
                 </motion.div>
               ) : (
                 <button onClick={handleStartAnalysis} className="btn-main">START ANALYSIS</button>
               )}
            </div>
          )}

          {/* 10 Levels Grid */}
          {Array.from({ length: 10 }).map((_, rowIndex) => {
            const correctCol = gameData?.correct ? gameData.correct[rowIndex] : -1;
            const mode = gameData?.mode || 2;
            
            return (
              <div 
                key={rowIndex} 
                className="row"
                style={{ gridTemplateColumns: `repeat(${mode}, 1fr)` }}
              >
                {Array.from({ length: mode }).map((_, colIndex) => (
                  <div key={colIndex} className={`cell ${isPathVisible ? 'active' : ''}`}>
                    {isPathVisible && gameData && (
                      <Image 
                        src={correctCol === colIndex ? GOLD_WIN : GOLD_LOSE} 
                        alt="Result" 
                        fill
                        className="cell-img"
                        unoptimized
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center pt-3 border-t border-white/5 mt-2 mb-1">
          <div className="flex items-center gap-2 text-white/40">
            <Clock size={14} />
            <span className="text-xs font-black font-mono">{timeLeft}</span>
          </div>
          <button 
            onClick={() => { sessionStorage.clear(); router.push('/wildwest'); }}
            className="text-[10px] font-black text-gray-500 flex items-center gap-1 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            <LogOut size={12} /> Log Off
          </button>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function WildWestPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen w-screen" />}>
            <WildWestTerminal />
        </Suspense>
    );
}
