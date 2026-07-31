
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';

const GOLD_WIN = "https://iili.io/ChkCcMP.jpg"; 
const GOLD_LOSE = "https://iili.io/ChkChtp.jpg";
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
    }, 800);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-white font-bold">
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
  const [randomPath, setRandomPath] = useState<number[]>([]);
  
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
    router.push('/wildwest');
  }, [router, saveRemainingTime]);

  useEffect(() => {
    const storedExpiresAt = parseInt(sessionStorage.getItem('razor_expires_at') || '0');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!storedExpiresAt || !storedUserId || storedExpiresAt <= Date.now()) {
      router.push('/wildwest');
      return;
    }

    setUserId(storedUserId);
    expiresAtRef.current = storedExpiresAt;

    const wildwestRef = ref(database, 'wildwest/current_game');
    const unsubscribe = onValue(wildwestRef, (snap) => {
        const data = snap.val();
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
    if (!gameData) {
      setRandomPath(Array.from({ length: 10 }, () => Math.floor(Math.random() * 2)));
    }
  };

  return (
    <KillSwitch pageName="wildwest">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${BG_GIF}')`, filter: 'sepia(0.3) brightness(0.4) contrast(1.1)' }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <style jsx global>{`
          :root { --gold: #FFD700; }
          body { color: white; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; }
          .terminal-container { max-width: 450px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; padding: 8px 16px; position: relative; z-index: 10; }
          .grid-wrapper { flex: 1; display: flex; flex-direction: column-reverse; gap: 4px; padding: 10px 0; overflow: hidden; }
          .row { display: grid; gap: 4px; height: 9%; }
          .cell { background: rgba(255,215,0,0.05); border: 1px solid rgba(255,215,0,0.15); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; backdrop-filter: blur(2px); }
          .cell-img { width: 100%; height: 100%; object-fit: cover; }
          .btn-main { background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); color: black; font-weight: 900; width: 100%; padding: 16px; border-radius: 12px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border: none; cursor: pointer; }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && <AnalysisOverlay onComplete={onAnalysisComplete} />}
      </AnimatePresence>

      <div className="terminal-container">
        <header className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full">
            <User size={12} className="text-yellow-500" />
            <span className="text-[10px] font-bold tracking-tight">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{status === 'live' ? 'READY' : 'WAIT'}</span>
          </div>
        </header>

        <div className="flex flex-col items-center py-4">
            <img src={RAZOR_LOGO} alt="Razor" className="w-16 h-auto drop-shadow-lg mb-2" />
            <h1 className="text-xs font-black text-yellow-500 tracking-[0.3em] uppercase">Wild West Terminal</h1>
        </div>

        <div className="grid-wrapper">
          {Array.from({ length: 10 }).map((_, rowIndex) => {
            const correctCol = gameData?.correct ? gameData.correct[rowIndex] : randomPath[rowIndex];
            const mode = gameData?.mode || 2;
            return (
              <div key={rowIndex} className="row" style={{ gridTemplateColumns: `repeat(${mode}, 1fr)` }}>
                {Array.from({ length: mode }).map((_, colIndex) => (
                  <div key={colIndex} className="cell">
                    <AnimatePresence>
                      {isPathVisible && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full relative">
                          <Image src={correctCol === colIndex ? GOLD_WIN : GOLD_LOSE} alt="Result" fill className="cell-img" unoptimized />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="controls-area py-4 flex flex-col items-center">
          {!isPathVisible ? (
             <button onClick={handleStartAnalysis} className="btn-main">Start Analysis</button>
          ) : (
            <div className="text-yellow-500 font-black text-[11px] flex items-center gap-2 tracking-widest animate-pulse">
               <ShieldCheck size={14} />
               <span>GOLD PATH DECRYPTED</span>
            </div>
          )}
        </div>

        <footer className="flex justify-between items-center pt-4 border-t border-white/5 mb-2">
          <div className="flex items-center gap-2 text-white/40 font-mono text-xs">
            <Clock size={14} className="text-yellow-500" />
            {timeLeft}
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 hover:text-red-500 transition-all uppercase tracking-widest bg-transparent border-none cursor-pointer">
            <LogOut size={12} /> Log Off
          </button>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function WildWestPage() {
    return (
        <Suspense fallback={<div className="bg-black h-screen w-screen flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>}>
            <WildWestTerminal />
        </Suspense>
    );
}
