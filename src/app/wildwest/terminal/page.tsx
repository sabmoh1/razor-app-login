
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants for Icons ---
const GOLD_WIN = "https://iili.io/ChkCcMP.jpg"; 
const GOLD_LOSE = "https://iili.io/ChkChtp.jpg";

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "INTERCEPTING DATA STREAM...", icon: Search },
    { text: "DECRYPTING GOLD PATH...", icon: Cpu },
    { text: "SYNCING TERMINAL DATA...", icon: Zap },
    { text: "ANALYSIS COMPLETE", icon: ShieldCheck }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 800);
        return prev;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12 text-center">
        <div className="relative inline-block">
          <div className="h-32 w-32 flex items-center justify-center border-4 border-yellow-500/10 rounded-full">
             <Loader2 className="h-16 w-16 text-yellow-500 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-t-2 border-yellow-400 animate-spin-slow" />
        </div>
        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: step >= i ? 1 : 0.1, x: step >= i ? 0 : -10 }}
              className="flex items-center gap-4 justify-center"
            >
              <s.icon size={20} className={step === i ? "text-yellow-400 animate-pulse" : step > i ? "text-green-500" : "text-gray-600"} />
              <span className={`text-sm font-black tracking-widest ${step === i ? "text-yellow-400" : step > i ? "text-white" : "text-gray-600"}`}>
                {s.text}
              </span>
            </motion.div>
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
    if (newState) {
      setGameData(newState);
      setStatus("live");
      // Reset visibility when new data arrives
      setIsPathVisible(false);
    } else {
      setGameData(null);
      setStatus("wait");
      setIsPathVisible(false);
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
        eventSource.onerror = () => { eventSource?.close(); startPolling(); };
      } catch (e) { startPolling(); }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          stateRef.current = data;
          updateUI(data);
        } catch (e) { setStatus("wait"); }
      }, 2000);
    };

    startSSE();

    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setTimeLeft(`${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/wildwest');
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
    router.push('/wildwest');
  };

  const handleStartAnalysis = () => {
    if (!gameData) return;
    setIsAnalyzing(true);
  };

  return (
    <KillSwitch pageName="wildwest">
      <style jsx global>{`
          :root {
            --gold: #FFD700;
            --bg: #0a0a0a;
            --muted: #444;
          }
          body {
            background: black url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif') no-repeat center center fixed;
            background-size: cover;
            color: white;
            font-family: 'Orbitron', sans-serif;
            overflow: hidden;
          }
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: sepia(0.4) brightness(1.2);
            z-index: -1;
          }
          .terminal {
            max-width: 400px;
            margin: 0 auto;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 10px 15px;
          }
          .grid-container {
            flex: 1;
            display: flex;
            flex-direction: column-reverse;
            gap: 4px;
            padding: 5px 0;
            overflow-y: auto;
          }
          .row {
            display: grid;
            gap: 4px;
            background: rgba(255,255,255,0.02);
            padding: 4px;
            border-radius: 8px;
            border: 1px solid rgba(255,215,0,0.03);
            transition: all 0.3s;
          }
          .row.active { border-color: rgba(255,215,0,0.2); background: rgba(255,215,0,0.03); }
          .cell {
            aspect-ratio: 1/1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.6);
            border-radius: 6px;
            overflow: hidden;
            position: relative;
          }
          .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 5px 12px; border-radius: 20px; font-size: 10px; display: flex; align-items: center; gap: 6px; }
          .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #444; }
          .status-dot.live { background: #FFD700; box-shadow: 0 0 8px #FFD700; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          
          .btn-start {
             background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%);
             color: black;
             font-weight: 900;
             padding: 15px 30px;
             border-radius: 12px;
             letter-spacing: 2px;
             text-transform: uppercase;
             box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
             transition: all 0.3s;
          }
          .btn-start:active { transform: scale(0.95); }
          .btn-start:disabled { opacity: 0.2; filter: grayscale(1); }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && (
          <AnalysisOverlay onComplete={() => {
            setIsAnalyzing(false);
            setIsPathVisible(true);
          }} />
        )}
      </AnimatePresence>

      <div className="terminal">
        <header className="topbar">
          <div className="chip">
            <User size={12} className="text-yellow-500" />
            <span>{userId}</span>
          </div>
          <div className="chip">
            <div className={`status-dot ${status === 'live' ? 'live' : ''}`}></div>
            <span className="text-[9px] tracking-widest uppercase">{status === 'live' ? 'READY' : 'WAIT'}</span>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 transition-colors">
            <LogOut size={14} />
          </button>
        </header>

        <div className="text-center mb-2">
            <h2 className="text-lg font-black text-yellow-500 tracking-wider">WILD WEST GOLD</h2>
            <p className="text-[8px] text-gray-500 tracking-[0.3em] font-bold">V1 OFFICIAL TERMINAL</p>
        </div>

        <div className="grid-container relative">
          {gameData ? (
             !isPathVisible ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-2xl border border-yellow-500/10">
                   <ShieldCheck className="text-yellow-500 mb-4 animate-bounce" size={48} />
                   <h3 className="text-white text-sm font-black mb-6 tracking-widest">DATA DETECTED</h3>
                   <button 
                    onClick={handleStartAnalysis}
                    className="btn-start"
                   >
                     START ANALYSIS
                   </button>
                </div>
             ) : null
          ) : (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
               <Loader2 className="text-white/10 animate-spin mb-4" size={40} />
               <p className="text-[10px] text-white/20 font-bold tracking-[0.2em]">WAITING FOR BET...</p>
            </div>
          )}

          {Array.from({ length: 10 }).map((_, rowIndex) => {
            const correctCol = gameData?.correct ? gameData.correct[rowIndex] : -1;
            const mode = gameData?.mode || 2;
            const isAnalyzed = isPathVisible;

            return (
              <div 
                key={rowIndex} 
                className={`row ${isAnalyzed ? 'active' : ''}`}
                style={{ gridTemplateColumns: `repeat(${mode}, 1fr)` }}
              >
                {Array.from({ length: mode }).map((_, colIndex) => (
                  <div key={colIndex} className="cell">
                    {isAnalyzed ? (
                      correctCol === colIndex ? (
                        <Image 
                          src={GOLD_WIN} 
                          alt="Win" 
                          width={60} 
                          height={60} 
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <Image 
                          src={GOLD_LOSE} 
                          alt="Lose" 
                          width={60} 
                          height={60} 
                          className="object-cover w-full h-full opacity-60 grayscale-[0.5]"
                          unoptimized
                        />
                      )
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/5" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <footer className="flex justify-between items-center py-2 border-t border-white/5 mt-2">
          <div className="flex items-center gap-2 text-white/30">
            <Clock size={12} />
            <span className="text-xs font-bold font-mono tracking-tighter">{timeLeft}</span>
          </div>
          <div className="flex items-center gap-2 text-green-500/30">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-bold">V1.0.4 ENCRYPTED</span>
          </div>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function WildWestPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <WildWestTerminal />
        </Suspense>
    );
}

