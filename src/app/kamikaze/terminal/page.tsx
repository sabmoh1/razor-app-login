
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, Clock, Loader2, Cpu, Zap, Search } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { database } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';

const BOMB_IMG = "https://iili.io/ChyAY5x.png"; 
const RAZOR_LOGO = "https://iili.io/f9iNGFj.png";
const BG_GIF = "https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif";

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
    }, 600);
    return () => clearInterval(timer);
  }, [onComplete]);

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
  const [randomColumns, setRandomColumns] = useState<any[]>([]);
  
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
    router.push('/kamikaze');
  }, [router, saveRemainingTime]);

  useEffect(() => {
    const storedExpiresAt = parseInt(sessionStorage.getItem('razor_expires_at') || '0');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!storedExpiresAt || !storedUserId || storedExpiresAt <= Date.now()) {
      router.push('/kamikaze');
      return;
    }

    setUserId(storedUserId);
    expiresAtRef.current = storedExpiresAt;

    // Database listener
    const kamikazeRef = ref(database, 'kamikaze/current_game');
    const unsubscribe = onValue(kamikazeRef, (snap) => {
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

    // Session Timer
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
      setRandomColumns(Array.from({ length: 12 }, (_, i) => ({ col: i, unsafe: Math.floor(Math.random() * 5) })));
    }
  };

  return (
    <KillSwitch pageName="kamikaze">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('${BG_GIF}')`, filter: 'brightness(0.3) contrast(1.2)' }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <style jsx global>{`
          :root { --accent: #ff4d4d; --bg: #030303; }
          body { background: var(--bg); color: white; font-family: 'Orbitron', sans-serif; overflow: hidden; height: 100vh; }
          .terminal-container { position: relative; z-index: 10; max-width: 500px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; padding: 10px 12px; }
          .logo-gap { display: flex; justify-content: center; align-items: center; padding: 10px 0; height: 220px; margin-bottom: 20px; }
          .logo-gap img { height: 150%; width: auto; opacity: 0.9; filter: drop-shadow(0 0 50px rgba(255,77,77,0.8)); transform: translateY(20px); }
          .grid-wrapper { flex: 1; display: grid; grid-template-columns: repeat(12, 1fr); gap: 2px; padding: 5px 0; overflow-x: auto; }
          .grid-wrapper::-webkit-scrollbar { display: none; }
          .column { display: flex; flex-direction: column-reverse; gap: 2px; }
          .cell { aspect-ratio: 1/1; border: 1px solid rgba(255,77,77,0.1); border-radius: 2px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; transition: all 0.4s ease; }
          .cell-img { width: 90%; height: 90%; object-fit: contain; }
          .col-label { text-align: center; font-size: 7px; font-weight: 900; color: var(--accent); margin-top: 4px; opacity: 0.5; }
          .controls-area { padding: 20px 0; display: flex; flex-direction: column; align-items: center; min-height: 80px; }
          .btn-main { background: linear-gradient(135deg, #ff4d4d 0%, #8b0000 100%); color: white; font-weight: 900; width: 100%; max-width: 300px; padding: 18px; border-radius: 14px; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; box-shadow: 0 10px 30px rgba(255,77,77,0.2); border: none; cursor: pointer; }
      `}</style>
      
      <AnimatePresence>
        {isAnalyzing && <AnalysisOverlay onComplete={onAnalysisComplete} />}
      </AnimatePresence>

      <div className="terminal-container">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <User size={14} className="text-red-500" />
            <span className="text-[10px] font-black tracking-wider">{userId}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}></div>
            <span className="text-[9px] font-black uppercase tracking-widest">{status === 'live' ? 'LIVE' : 'WAIT'}</span>
          </div>
        </header>

        <div className="logo-gap">
            <motion.img 
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1.1, opacity: 1, y: 0 }}
              src={RAZOR_LOGO} alt="Razor" unoptimized
            />
        </div>

        <div className="grid-wrapper">
          {Array.from({ length: 12 }).map((_, colIndex) => {
            const colData = gameData?.columns?.find((c: any) => c.col === colIndex) || randomColumns.find((c: any) => c.col === colIndex);
            const unsafeRow = colData?.unsafe;
            return (
              <div key={colIndex} className="column">
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                  const isUnsafe = unsafeRow === rowIndex;
                  return (
                    <div 
                      key={rowIndex} className="cell"
                      style={{
                        backgroundColor: isPathVisible && colData ? (isUnsafe ? '#dc2626' : '#16a34a') : 'rgba(255,255,255,0.02)',
                        borderColor: isPathVisible && colData ? (isUnsafe ? '#ef4444' : '#22c55e') : 'rgba(255,77,77,0.1)'
                      }}
                    >
                      <AnimatePresence>
                        {isPathVisible && colData && isUnsafe && (
                          <motion.div initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: 1, scale: 1 }}>
                            <Image src={BOMB_IMG} alt="Bomb" width={40} height={40} className="cell-img" unoptimized />
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

        <div className="controls-area">
          {!isPathVisible ? (
             <button onClick={handleStartAnalysis} className="btn-main">Start Analysis</button>
          ) : (
            <button onClick={() => setIsPathVisible(false)} className="text-[#4ade80] text-[11px] font-black tracking-widest flex items-center gap-2 bg-transparent border-none cursor-pointer">
               <ShieldCheck size={18} />
               <span className="animate-pulse uppercase">Tactical Path Decrypted</span>
            </button>
          )}
        </div>

        <footer className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto pb-4">
          <div className="flex items-center gap-2 text-white/40 font-mono text-xs">
            <Clock size={16} className="text-red-500" />
            {timeLeft}
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 hover:text-red-500 transition-all uppercase tracking-widest bg-transparent border-none cursor-pointer">
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
