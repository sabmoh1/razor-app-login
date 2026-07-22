
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut } from 'lucide-react';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isInitialWait, setIsInitialWait] = useState(true);
  const [timerText, setTimerText] = useState("00:00:00");
  const [idClicks, setIdClicks] = useState(0);

  const crashValueRef = useRef<HTMLDivElement>(null);
  const lastRawRef = useRef<HTMLDivElement>(null);
  
  const updatePrediction = useCallback((newVal: any) => {
    const crashEl = crashValueRef.current;
    const lastRawEl = lastRawRef.current;
    if (!crashEl || !lastRawEl) return;

    const prev = crashEl.innerText;
    if (prev && prev.trim() !== '' && prev !== '0.00') {
      lastRawEl.innerText = prev;
    }
    const t = (newVal === undefined || newVal === null) ? '0.00' : String(newVal);
    crashEl.innerText = t;
    
    // Simple animation for the update
    crashEl.classList.remove('pulse-animation');
    void crashEl.offsetWidth; 
    crashEl.classList.add('pulse-animation');
  }, []);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const validity = sessionStorage.getItem('razor_session_validity');

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

  useEffect(() => {
    if (predictions.length > 0 && isInitialWait) {
      const initialTimeout = setTimeout(() => {
        setCurrentIndex(0);
        updatePrediction(predictions[0]);
        setIsInitialWait(false);
      }, 5000); 
      return () => clearTimeout(initialTimeout);
    }
  }, [predictions, isInitialWait, updatePrediction]);

  const handleScreenClick = useCallback(() => {
    if (isInitialWait || predictions.length === 0) return;
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % predictions.length;
      updatePrediction(predictions[nextIndex]);
      return nextIndex;
    });
  }, [isInitialWait, predictions, updatePrediction]);

  const handleIdClick = () => {
    const newCount = idClicks + 1;
    if (newCount >= 3) {
      router.push('/b16vip/admin');
    } else {
      setIdClicks(newCount);
      // Reset clicks after 2 seconds of inactivity
      setTimeout(() => setIdClicks(0), 2000);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/b16vip');
  };

  useEffect(() => {
    let seconds = 0;
    const timerInterval = setInterval(() => {
      seconds++;
      const h = Math.floor(seconds/3600);
      const m = Math.floor((seconds%3600)/60);
      const s = seconds%60;
      setTimerText(`${String(h).padStart(2,'0')} : ${String(m).padStart(2,'0')} : ${String(s).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  return (
    <>
      <style jsx global>{`
          :root { --accent: #00bfff; --bg: #030712; }
          body { background: var(--bg) !important; margin: 0; overflow: hidden; font-family: 'Orbitron', sans-serif; color: white; }
          .main-wrap { position: relative; z-index: 10; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; padding: 20px; }
          .header-nav { position: fixed; top: 0; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 25px 30px; z-index: 100; }
          .user-badge { display: flex; align-items: center; gap: 12px; background: rgba(0, 191, 255, 0.05); border: 1px solid rgba(0, 191, 255, 0.2); padding: 8px 18px; border-radius: 100px; backdrop-filter: blur(10px); transition: all 0.3s; }
          .user-badge:active { transform: scale(0.95); background: rgba(0, 191, 255, 0.15); }
          
          .central-hub { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 30px; }
          .brand-title { letter-spacing: 12px; font-weight: 900; font-size: 1.2rem; color: var(--accent); text-shadow: 0 0 15px var(--accent); }
          .prediction-circle { width: 320px; height: 320px; border-radius: 50%; border: 2px solid rgba(0, 191, 255, 0.15); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: inset 0 0 40px rgba(0, 191, 255, 0.05); }
          
          #crashValue { font-size: 7rem; font-weight: 900; color: white; text-shadow: 0 0 25px rgba(0, 191, 255, 0.4); line-height: 1; transition: all 0.3s ease; }
          .pulse-animation { animation: pulse-fx 0.4s ease-out; }
          @keyframes pulse-fx {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }

          .meta-info { display: flex; gap: 25px; margin-top: 20px; }
          .info-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px 25px; border-radius: 16px; text-align: center; min-width: 140px; }
          .info-box .label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 3px; color: rgba(255,255,255,0.4); margin-bottom: 5px; display: block; }
          .info-box .value { font-weight: 900; font-size: 1.1rem; }

          .logout-btn { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; transition: all 0.3s; color: #ff4d4d; }
          .logout-btn:hover { background: rgba(255,0,0,0.1); border-color: #ff4d4d; }
      `}</style>

      <header className="header-nav">
        <div className="user-badge cursor-pointer" onClick={handleIdClick}>
          <User size={16} color="var(--accent)" />
          <span className="text-xs font-black tracking-widest">{userId}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </header>

      <div className="main-wrap" onClick={handleScreenClick}>
        <div className="central-hub">
          <div className="brand-title">DREEL BET</div>
          <div className="text-[10px] text-white/40 tracking-[0.4em] uppercase font-bold">Predictor Terminal</div>
          
          <div className="prediction-circle">
            <div id="crashValue" ref={crashValueRef}>0.00</div>
          </div>

          <div className="meta-info">
            <div className="info-box">
              <span className="label">Runtime</span>
              <span className="value text-blue-400">{timerText}</span>
            </div>
            <div className="info-box">
              <span className="label">Previous</span>
              <span className="value" ref={lastRawRef}>---</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function B16VipWelcomePage() {
  return (
    <Suspense fallback={<div className="bg-black h-screen flex items-center justify-center font-orbitron text-blue-500 tracking-[1em] animate-pulse uppercase text-xs">Initializing...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
