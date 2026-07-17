
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search, AlertTriangle } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Constants for Icons ---
const BOMB_IMG = "https://iili.io/ChyAY5x.png"; // New Explosion Image

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "SCANNING AIRSPACE...", icon: Search },
    { text: "DECRYPTING COORDINATES...", icon: Cpu },
    { text: "ESTABLISHING UPLINK...", icon: Zap },
    { text: "PATH SECURED", icon: ShieldCheck }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-white font-bold">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="relative h-20 w-20 mx-auto">
            <Loader2 className="h-20 w-20 text-red-500 animate-spin" />
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

function KamikazeTerminal() {
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
    document.title = "KAMIKAZE — Tactical Terminal";
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/kamikaze');
      return;
    }
    setUserId(storedUserId);

    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/kamikaze/current_game.json";
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
        router.push('/kamikaze');
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
      setErrorMsg("NO TACTICAL DATA DETECTED");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setIsAnalyzing(true);
  };

  return (
    <KillSwitch pageName="kamikaze">
      <style jsx global>{`
          :root { --accent: #ff4d4d; --bg: #030303; }
          body {
            background: var(--bg);
            color: white;
            font-family: 'Orbitron', sans-serif;
            overflow: hidden;
            height: 100vh;
          }
          .terminal-container {
            max-width: 500px;
            margin: 0 auto;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
            background: linear-gradient(to bottom, #0a0000 0%, #030303 100%);
          }
          .grid-wrapper {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 2px;
            padding: 10px 0;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .grid-wrapper::-webkit-scrollbar { display: none; }
          
          .column {
            display: flex;
            flex-direction: column-reverse;
            gap: 2px;
          }
          .cell {
            aspect-ratio: 1/1;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,77,77,0.05);
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            transition: all 0.5s ease-in-out;
          }
          .cell-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 2px;
          }
          .col-label {
            text-align: center;
            font-size: 7px;
            font-weight: 900;
            color: var(--accent);
            margin-top: 4px;
            opacity: 0.5;
          }
          .controls-area {
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 80px;
          }
          .btn-main {
             background: linear-gradient(135deg, #ff4d4d 0%, #8b0000 100%);
             color: white;
             font-weight: 900;
             width: 100%;
             max-width: 300px;
             padding: 18px;
             border-radius: 14px;
             font-size: 13px;
             letter-spacing: 3px;
             text-transform: uppercase;
             box-shadow: 0 10px 30px rgba(255,77,77,0.2);
             transition: all 0.3s;
             border: 1px solid rgba(255,255,255,0.1);
          }
          .btn-main:active { transform: scale(0.95); opacity: 0.8; }
          .error-status {
             color: #ff4d4d;
             font-size: 10px;
             font-weight: 900;
             letter-spacing: 1px;
             display: flex;
             align-items: center;
             gap: 8px;
             text-shadow: 0 0 15px rgba(255,77,77,0.5);
          }
          .success-status {
             color: #4ade80;
             font-size: 11px;
             font-weight: 900;
             letter-spacing: 2px;
             display: flex;
             align-items: center;
             gap: 6px;
          }
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
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <User size={14} className="text-red-500" />
            <span className="text-[10px] font-black tracking-wider">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_#ff4d4d]' : 'bg-gray-700'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{status === 'live' ? 'LIVE' : 'WAIT'}</span>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mb-4">
            <h1 className="text-[10px] font-black text-red-500 tracking-[0.4em] uppercase">Kamikaze Terminal</h1>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500/40 to-transparent mx-auto mt-2" />
        </div>

        {/* Main Grid Area */}
        <div className="grid-wrapper">
          {Array.from({ length: 12 }).map((_, colIndex) => {
            const colData = gameData?.columns?.find((c: any) => c.col === colIndex);
            const unsafeRow = colData?.unsafe;
            
            return (
              <div key={colIndex} className="column">
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                  const isUnsafe = unsafeRow === rowIndex;
                  
                  return (
                    <div 
                      key={rowIndex} 
                      className={cn(
                        "cell transition-all duration-500",
                        isPathVisible && colData && (isUnsafe ? "bg-red-600/80 border-red-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" : "bg-green-600/80 border-green-500 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]")
                      )}
                    >
                      <AnimatePresence>
                        {isPathVisible && colData && isUnsafe && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full relative"
                          >
                            <Image 
                              src={BOMB_IMG} 
                              alt="Explosion" 
                              fill
                              className="cell-img"
                              unoptimized
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                <div className="col-label">C{colIndex + 1}</div>
              </div>
            );
          })}
        </div>

        {/* Controls Section */}
        <div className="controls-area">
          {!isPathVisible ? (
             <>
               {errorMsg ? (
                 <motion.div 
                    initial={{ y: 10, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    className="error-status"
                 >
                    <AlertTriangle size={16} />
                    <span>{errorMsg}</span>
                 </motion.div>
               ) : (
                 <button onClick={handleStartAnalysis} className="btn-main">Start Analysis</button>
               )}
             </>
          ) : (
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="success-status"
            >
               <ShieldCheck size={18} className="text-green-500" />
               <span className="animate-pulse">TACTICAL PATH DECRYPTED</span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto pb-4">
          <div className="flex items-center gap-2 text-white/40">
            <Clock size={16} />
            <span className="text-xs font-black font-mono tracking-tighter">{timeLeft}</span>
          </div>
          <button 
            onClick={() => { sessionStorage.clear(); router.push('/kamikaze'); }}
            className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 hover:text-red-500 transition-all uppercase tracking-widest"
          >
            <LogOut size={14} /> Disconnect
          </button>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function KamikazePage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen w-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-500" /></div>}>
            <KamikazeTerminal />
        </Suspense>
    );
}
