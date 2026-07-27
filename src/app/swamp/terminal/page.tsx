
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search, Wifi, WifiOff } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

// --- Constants ---
const SAFE_IMG = "https://iili.io/CkIXmua.png"; 
const DANGER_IMG = "https://iili.io/CkIXpwJ.png";
const RAZOR_LOGO = "https://iili.io/f9iNGFj.png";
const BG_GIF = "https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif";

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "INTERCEPTING DATA...", icon: Search },
    { text: "DECRYPTING PATH...", icon: Cpu },
    { text: "SYNCING TERMINAL...", icon: Zap },
    { text: "ANALYSIS DONE", icon: ShieldCheck }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(onComplete, 500);
        return prev;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-white font-bold">
      <div className="w-full max-w-xs space-y-8 text-center">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mx-auto mb-4" />
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

function SwampTerminal() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [status, setStatus] = useState<"live" | "wait">("wait");
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPathVisible, setIsPathVisible] = useState(false);
  const [randomPath, setRandomPath] = useState<any>(null);
  
  const lastStartedAtRef = useRef<number>(0);

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
    document.title = "SWAMP LAND — Tactical Terminal";
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/swamp');
      return;
    }
    setUserId(storedUserId);

    // Real-time Database Listener
    const gameRef = ref(database, 'swamp/current_game');
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        setStatus("live");
        
        // Auto-reset visibility if a new game starts
        if (data.startedAt && data.startedAt !== lastStartedAtRef.current) {
          setIsPathVisible(false);
          lastStartedAtRef.current = data.startedAt;
        }
      } else {
        setStatus("wait");
      }
    });

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
        router.push('/swamp');
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
    };
  }, [router]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
  };

  const onAnalysisComplete = () => {
    setIsAnalyzing(false);
    setIsPathVisible(true);
    
    if (!gameData) {
      // Intelligent Random Fallback if DB is empty
      const fallbackCorrect = [
          Math.floor(Math.random() * 5),
          Math.floor(Math.random() * 5),
          Math.floor(Math.random() * 5),
          Math.floor(Math.random() * 5)
      ];
      const fallbackWrong = fallbackCorrect.map(c => {
          const possible = [0,1,2,3,4].filter(v => v !== c);
          return [possible[Math.floor(Math.random()*possible.length)]];
      });
      setRandomPath({ correct: fallbackCorrect, wrong: fallbackWrong });
    }
  };

  const multipliers = ["1.3", "2.17", "5.43", "27.16"];

  return (
    <KillSwitch pageName="swamp">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url('${BG_GIF}')`,
            filter: 'hue-rotate(60deg) brightness(0.2) contrast(1.2)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/70"></div>
      </div>
      <style jsx global>{`
          :root { --accent: #22c55e; --bg: #030303; }
          body {
            background: var(--bg);
            color: white;
            font-family: 'Orbitron', sans-serif;
            overflow: hidden;
            height: 100vh;
          }
          .terminal-container {
            position: relative;
            z-index: 10;
            max-width: 500px;
            margin: 0 auto;
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 10px 12px;
          }
          .logo-gap {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 5px 0;
            height: 100px;
            margin-bottom: 5px;
          }
          .logo-gap img {
            height: 100%;
            width: auto;
            opacity: 0.9;
            filter: drop-shadow(0 0 40px rgba(34,197,94,0.6));
          }
          .grid-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column-reverse; /* Bottom row index 0 */
            gap: 6px;
            padding: 5px 0;
            justify-content: center;
          }
          .row-container {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .multiplier-label {
            font-size: 9px;
            font-weight: 900;
            color: var(--accent);
            width: 35px;
            text-align: right;
            opacity: 0.8;
            font-family: monospace;
          }
          .row-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
          }
          .cell {
            aspect-ratio: 1/1;
            border: 1px solid rgba(34,197,94,0.1);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            background: rgba(255,255,255,0.015);
            transition: all 0.3s ease;
          }
          .cell-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .controls-area {
            padding: 10px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 70px;
          }
          .btn-main {
             background: linear-gradient(135deg, #22c55e 0%, #064e3b 100%);
             color: white;
             font-weight: 900;
             width: 100%;
             max-width: 280px;
             padding: 14px;
             border-radius: 12px;
             font-size: 12px;
             letter-spacing: 3px;
             text-transform: uppercase;
             box-shadow: 0 0 30px rgba(34,197,94,0.2);
             transition: all 0.3s;
             border: none;
             cursor: pointer;
          }
          .btn-main:active { transform: scale(0.95); opacity: 0.8; }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && <AnalysisOverlay onComplete={onAnalysisComplete} />}
      </AnimatePresence>

      <div className="terminal-container">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <User size={14} className="text-green-500" />
            <span className="text-[10px] font-black tracking-wider">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            {status === 'live' ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-gray-500" />}
            <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'live' ? 'text-green-500' : 'text-gray-500'}`}>
              {status === 'live' ? 'CONNECTED' : 'WAIT'}
            </span>
          </div>
        </header>

        <div className="logo-gap">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={RAZOR_LOGO} 
              alt="Razor" 
              unoptimized
            />
        </div>

        <div className="grid-wrapper">
          {[0, 1, 2, 3].map((rowIndex) => (
            <div key={rowIndex} className="row-container">
              <div className="multiplier-label">x{multipliers[rowIndex]}</div>
              <div className="row-grid">
                {[0, 1, 2, 3, 4].map((colIndex) => {
                    const dataCorrect = gameData?.correct;
                    const dataWrong = gameData?.wrong;
                    
                    const correctVal = dataCorrect ? dataCorrect[rowIndex] : randomPath?.correct[rowIndex];
                    const wrongVals = dataWrong ? dataWrong[rowIndex] : randomPath?.wrong[rowIndex];

                    const isCorrect = correctVal === colIndex;
                    const isWrong = Array.isArray(wrongVals) ? wrongVals.includes(colIndex) : wrongVals === colIndex;

                  return (
                    <div 
                      key={colIndex} 
                      className="cell"
                      style={{
                        borderColor: isPathVisible ? (isCorrect ? '#22c55e' : (isWrong ? '#ef4444' : 'rgba(34,197,94,0.1)')) : 'rgba(34,197,94,0.1)',
                        backgroundColor: isPathVisible && isWrong ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.015)'
                      }}
                    >
                      <AnimatePresence>
                        {isPathVisible && (isCorrect || isWrong) && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full relative"
                          >
                                <Image 
                                    src={isCorrect ? SAFE_IMG : DANGER_IMG} 
                                    alt={isCorrect ? "Safe" : "Danger"} 
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
              </div>
            </div>
          ))}
        </div>

        <div className="controls-area">
          {!isPathVisible ? (
             <button onClick={handleStartAnalysis} className="btn-main">Start Analysis</button>
          ) : (
            <button onClick={() => setIsPathVisible(false)} className="text-[#4ade80] text-[10px] font-black tracking-widest flex items-center gap-2 bg-transparent border-none cursor-pointer">
               <ShieldCheck size={16} className="text-green-500" />
               <span className="animate-pulse uppercase">Tactical Path Decrypted</span>
            </button>
          )}
        </div>

        <footer className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto pb-4">
          <div className="flex items-center gap-2 text-white/40">
            <Clock size={16} />
            <span className="text-xs font-black font-mono tracking-tighter">{timeLeft}</span>
          </div>
          <button 
            onClick={() => { sessionStorage.clear(); router.push('/swamp'); }}
            className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 hover:text-red-500 transition-all uppercase tracking-widest bg-transparent border-none cursor-pointer"
          >
            <LogOut size={14} /> Disconnect
          </button>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function SwampPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen w-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-500" /></div>}>
            <SwampTerminal />
        </Suspense>
    );
}
