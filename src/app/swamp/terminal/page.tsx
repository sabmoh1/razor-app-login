
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Wifi, WifiOff } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";

const SAFE_IMG = "https://iili.io/CkIXmua.png"; 
const DANGER_IMG = "https://iili.io/CkIXpwJ.png";
const RAZOR_LOGO = "https://iili.io/f9iNGFj.png";
const BG_GIF = "https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif";

const AnalysisOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const steps = [{ text: "INTERCEPTING DATA..." }, { text: "DECRYPTING PATH..." }, { text: "SYNCING TERMINAL..." }, { text: "ANALYSIS DONE" }];

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
  
  const lastStartedAtRef = useRef<number>(0);
  const expiresAtRef = useRef<number>(0);

  const saveRemainingTime = useCallback(async () => {
    const game = sessionStorage.getItem('razor_game_key');
    const keyId = sessionStorage.getItem('razor_db_key_id');
    const expiresAt = expiresAtRef.current;
    
    if (game && keyId && expiresAt > 0) {
      const remaining = Math.max(0, expiresAt - Date.now());
      try {
        await update(ref(database, `passwords/${game}/${keyId}`), {
          remainingTime: remaining
        });
      } catch (e) {
        console.error("Failed to save time:", e);
      }
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await saveRemainingTime();
    sessionStorage.clear();
    router.push('/swamp');
  }, [router, saveRemainingTime]);

  useEffect(() => {
    const storedExpiresAt = parseInt(sessionStorage.getItem('razor_expires_at') || '0');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!storedExpiresAt || !storedUserId || storedExpiresAt <= Date.now()) {
      router.push('/swamp');
      return;
    }

    setUserId(storedUserId);
    expiresAtRef.current = storedExpiresAt;

    const gameRef = ref(database, 'current_game');
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data);
        setStatus("live");
        if (data.startedAt && data.startedAt !== lastStartedAtRef.current) {
          setIsPathVisible(false);
          lastStartedAtRef.current = data.startedAt;
        }
      } else {
        setStatus("wait");
      }
    });

    const timerInterval = setInterval(() => {
      const remaining = expiresAtRef.current - Date.now();
      if (remaining > 0) {
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        handleLogout();
      }
    }, 1000);

    window.addEventListener('beforeunload', saveRemainingTime);

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
      window.removeEventListener('beforeunload', saveRemainingTime);
    };
  }, [router, handleLogout, saveRemainingTime]);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
  };

  const onAnalysisComplete = () => {
    setIsAnalyzing(false);
    setIsPathVisible(true);
  };

  const multipliers = ["1.3", "2.17", "5.43", "27.16"];

  const checkIsCorrect = useCallback((row: number, col: number) => {
      if (!gameData || !gameData.correct) return false;
      const val = gameData.correct[row];
      if (Array.isArray(val)) return val.includes(col);
      return val === col;
  }, [gameData]);

  const checkIsWrong = useCallback((row: number, col: number) => {
      if (!gameData || !gameData.wrong) return false;
      const val = gameData.wrong[row];
      if (Array.isArray(val)) return val.includes(col);
      return val === col;
  }, [gameData]);

  return (
    <KillSwitch pageName="swamp">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${BG_GIF}')`, filter: 'hue-rotate(60deg) brightness(0.4) contrast(1.1)' }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <style jsx global>{`
          :root { --accent: #22c55e; }
          body { font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; }
          .terminal-container { max-width: 480px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; padding: 5px 12px; position: relative; z-index: 10; }
          .grid-wrapper { flex: 1; display: flex; flex-direction: column-reverse; gap: 6px; justify-content: center; padding: 10px 0; }
          .row-container { display: flex; align-items: center; gap: 10px; }
          .multiplier-label { font-size: 9px; font-weight: 900; color: var(--accent); width: 40px; text-align: right; opacity: 0.8; }
          .row-grid { flex: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
          .cell { aspect-ratio: 1/1; border: 1px solid rgba(34,197,94,0.2); border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; background: rgba(255,255,255,0.03); }
          .cell-img { width: 100%; height: 100%; object-fit: contain; }
          .btn-main { background: linear-gradient(135deg, #22c55e 0%, #064e3b 100%); color: white; font-weight: 900; width: 100%; max-width: 280px; padding: 16px; border-radius: 14px; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; border: none; cursor: pointer; box-shadow: 0 0 25px rgba(34,197,94,0.4); }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && <AnalysisOverlay onComplete={onAnalysisComplete} />}
      </AnimatePresence>

      <div className="terminal-container">
        <header className="flex justify-between items-center py-3">
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            <User size={14} className="text-green-500" />
            <span className="text-[10px] font-black tracking-widest">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
            {status === 'live' ? <Wifi size={14} className="text-green-500 animate-pulse" /> : <WifiOff size={14} className="text-gray-500" />}
            <span className={`text-[9px] font-black uppercase tracking-widest ${status === 'live' ? 'text-green-500' : 'text-gray-500'}`}>
              {status === 'live' ? 'CONNECTED' : 'WAIT'}
            </span>
          </div>
        </header>

        <div className="flex flex-col items-center py-4">
            <img src={RAZOR_LOGO} alt="Razor" className="h-16 w-auto drop-shadow-lg mb-2" />
            <h1 className="text-xs font-black text-green-500 tracking-[0.3em] uppercase">Swamp Terminal</h1>
        </div>

        <div className="grid-wrapper">
          {[0, 1, 2, 3].map((rowIndex) => (
            <div key={rowIndex} className="row-container">
              <div className="multiplier-label">x{multipliers[rowIndex]}</div>
              <div className="row-grid">
                {[0, 1, 2, 3, 4].map((colIndex) => {
                    const isCorrect = checkIsCorrect(rowIndex, colIndex);
                    const isWrong = checkIsWrong(rowIndex, colIndex);
                  return (
                    <div 
                      key={colIndex} className="cell"
                      style={{
                        borderColor: isPathVisible && (isCorrect || isWrong) ? (isCorrect ? '#22c55e' : '#ef4444') : 'rgba(34,197,94,0.15)',
                        backgroundColor: isPathVisible && isWrong ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <AnimatePresence>
                        {isPathVisible && (isCorrect || isWrong) && (
                          <motion.div initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative">
                                <Image src={isCorrect ? SAFE_IMG : DANGER_IMG} alt="Result" fill className="cell-img" unoptimized />
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

        <div className="controls-area py-4 flex flex-col items-center">
          {!isPathVisible ? (
             <button onClick={handleStartAnalysis} className="btn-main">Start Analysis</button>
          ) : (
            <div className="text-[#4ade80] text-[11px] font-black tracking-[0.2em] flex items-center gap-2 animate-pulse uppercase">
               <ShieldCheck size={18} className="text-green-500" />
               <span>Tactical Path Decrypted</span>
            </div>
          )}
        </div>

        <footer className="flex justify-between items-center py-4 border-t border-white/10 mt-auto">
          <div className="flex items-center gap-2 text-white/50 font-mono text-xs">
            <Clock size={16} className="text-green-500" />
            {timeLeft}
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-gray-500 flex items-center gap-2 hover:text-red-500 transition-all uppercase tracking-widest bg-transparent border-none cursor-pointer">
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
