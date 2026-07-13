
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { User, Clock, LogOut } from "lucide-react";
import KillSwitch from '@/components/kill-switch';
import { Loader2 as Loader } from "lucide-react";

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [crashValue, setCrashValue] = useState<string>("---");
  const [isLoading, setIsLoading] = useState(false);
  const lastValueRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('razor_session_validity');
    sessionStorage.removeItem('razor_user_id');
    router.push('/nasserusdt');
  }, [router]);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const storedValidity = sessionStorage.getItem('razor_session_validity');

    if (!storedUserId || !storedValidity) {
      handleLogout();
      return;
    }

    setUserId(storedUserId);
    const parseValidity = (v: string) => {
      const val = parseInt(v.slice(0, -1));
      const unit = v.slice(-1).toLowerCase();
      if (isNaN(val)) return 0;
      switch (unit) {
        case 'h': return val * 3600;
        case 'd': return val * 86400;
        case 'm': return val * 60;
        case 's': return val;
        default: return 0;
      }
    };
    setTotalSeconds(parseValidity(storedValidity));

    // --- New Data Reception Logic (SSE & Polling) ---
    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/predictions/current.json";
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const handleData = (data: any) => {
      if (data && data.value) {
        const val = String(data.value);
        if (lastValueRef.current !== val) {
          setIsLoading(true);
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = setTimeout(() => {
            setCrashValue(val);
            setIsLoading(false);
            lastValueRef.current = val;
          }, 1200);
        }
      }
    };

    const startSSE = () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.addEventListener('put', (e) => handleData(JSON.parse(e.data).data));
        eventSource.addEventListener('patch', (e) => handleData(JSON.parse(e.data).data));
        eventSource.onerror = () => {
          eventSource?.close();
          startPolling();
        };
      } catch (e) {
        startPolling();
      }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          handleData(data);
        } catch (e) {}
      }, 2000);
    };

    startSSE();

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [handleLogout]);

  useEffect(() => {
    if (totalSeconds > 0) {
      const timer = setInterval(() => {
        setTotalSeconds(prev => {
          if (prev <= 1) { clearInterval(timer); handleLogout(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [totalSeconds, handleLogout]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    const container = document.getElementById('particles-background');
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    const imageUrl = "https://iili.io/fxaO5P9.jpg";
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 80 + 20;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundImage = `url(${imageUrl})`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        const duration = Math.random() * 30 + 20; 
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = `${Math.random() * -duration}s`;
        container.appendChild(particle);
    }
  }, []);

  return (
    <KillSwitch pageName="nasserusdt">
      <Head>
          <title>NasserUSDT - VIP Access</title>
           <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div id="particles-background" className="fixed inset-0 -z-10 overflow-hidden"></div>
      <style jsx global>{`
        body { background-color: #0a192f; font-family: "Poppins", sans-serif; color: white; }
        .main-box { background: rgba(10, 25, 47, 0.85); box-shadow: 0 0 40px rgba(0, 191, 255, 0.4); backdrop-filter: blur(15px); border: 1px solid rgba(0, 191, 255, 0.3); animation: fadeIn 1s ease-out; }
        .text-glow { color: #00BFFF; text-shadow: 0 0 15px rgba(0, 191, 255, 0.5), 0 0 30px rgba(0, 191, 255, 0.3); }
        .loader-dots span { animation: blink 1.4s infinite both; }
        .loader-dots span:nth-of-type(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-of-type(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .particle { position: absolute; border-radius: 50%; background-size: cover; opacity: 0.15; pointer-events: none; }
        @keyframes float { 0% { transform: translateY(100vh) scale(1); opacity: 0.15; } 100% { transform: translateY(-100px) scale(0.5); opacity: 0; } }
      `}</style>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <main className="main-box w-full max-w-md rounded-3xl p-6 md:p-8">
            <header className="flex flex-col items-center mb-6">
                <img src="https://iili.io/fxaO5P9.jpg" alt="NasserUSDT Logo" className="w-24 h-24 rounded-full mb-4 border-2 border-cyan-400"/>
                <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <User size={18} className="text-cyan-300" />
                    <span className="font-semibold text-sm tracking-wider">{userId}</span>
                </div>
            </header>
            <div className="aspect-square bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-cyan-400/30 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-300 tracking-wider mb-2 uppercase">Prediction</h2>
              {isLoading ? (
                  <div className="text-6xl font-black text-glow loader-dots">
                      <span>.</span><span>.</span><span>.</span>
                  </div>
              ) : (
                  <div className="text-8xl font-black text-glow">{crashValue}</div>
              )}
            </div>
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-cyan-300" />
                    <div>
                        <div className="text-xs text-gray-400">Time Left</div>
                        <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
                    </div>
                </div>
            </div>
             <button onClick={handleLogout} className="w-full mt-6 flex items-center justify-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-3 rounded-full border border-red-500/50 text-red-300 hover:bg-red-500/40 transition-colors">
                <LogOut size={16} />
                <span className="text-sm font-semibold">Logout</span>
            </button>
        </main>
      </div>
    </KillSwitch>
  );
}

export default function NasserusdtWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-[#0a192f] min-h-screen flex items-center justify-center text-white"><Loader className="animate-spin" size={48} /></div>}>
            <WelcomeContent />
        </Suspense>
    )
}
