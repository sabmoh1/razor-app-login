
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { User, Wifi, WifiOff, Loader2 as Loader, Clock, LogOut, Power } from "lucide-react";
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [crashValue, setCrashValue] = useState<string>("---");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "connecting" | "error">("disconnected");
  const lastValueRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseValidityToSeconds = (validityStr: string | null): number => {
    if (!validityStr) return 0;
    const value = parseInt(validityStr.slice(0, -1));
    const unit = validityStr.slice(-1).toLowerCase();
    if (isNaN(value)) return 0;
    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return 0;
    }
  };

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('razor_session_validity');
    sessionStorage.removeItem('razor_user_id');
    router.push('/ducky');
  }, [router]);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const storedValidity = sessionStorage.getItem('razor_session_validity');

    if (!storedUserId || !storedValidity) {
      handleLogout();
      return;
    }

    setUserId(storedUserId);
    setTotalSeconds(parseValidityToSeconds(storedValidity));

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
      setConnectionStatus("connecting");
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.addEventListener('put', (e) => {
          const payload = JSON.parse(e.data);
          handleData(payload.data);
          setConnectionStatus("connected");
        });
        eventSource.addEventListener('patch', (e) => {
          const payload = JSON.parse(e.data);
          handleData(payload.data);
          setConnectionStatus("connected");
        });
        eventSource.onopen = () => setConnectionStatus("connected");
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
      setConnectionStatus("connecting");
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          handleData(data);
          setConnectionStatus("connected");
        } catch (e) {
          setConnectionStatus("error");
        }
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

  const getStatusIndicator = () => {
    switch(connectionStatus) {
      case 'connected': return <div className="flex items-center gap-2 text-green-400"><Wifi size={16} /><span>Connected</span></div>;
      case 'connecting': return <div className="flex items-center gap-2 text-yellow-400"><Loader size={16} className="animate-spin" /><span>Connecting...</span></div>;
      case 'error': return <div className="flex items-center gap-2 text-red-500"><WifiOff size={16} /><span>Error</span></div>;
      default: return <div className="flex items-center gap-2 text-gray-500"><WifiOff size={16} /><span>Disconnected</span></div>;
    }
  }

  return (
    <KillSwitch pageName="ducky">
      <Head><title>DUCKY DZ | VIP Access</title></Head>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap');
        body { background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%); font-family: 'Poppins', sans-serif; }
        .text-glow { text-shadow: 0 0 15px rgba(255,176,32,0.6), 0 0 25px rgba(255,176,32,0.4); }
        .card-glow { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 30px rgba(255, 176, 32, 0.15); }
        .loader-dots span { animation: blink 1.4s infinite both; }
        .loader-dots span:nth-of-type(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-of-type(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        .logo-float { animation: float 4s ease-in-out infinite; }
         @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-4 text-white">
        <main className="w-full max-w-2xl">
          <div className="bg-black/20 backdrop-filter backdrop-blur-lg border border-yellow-500/20 rounded-3xl p-6 md:p-8 card-glow">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <User size={18} className="text-yellow-400" />
                    <span className="font-semibold text-sm">{userId}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-red-400 hover:bg-red-500/20 transition-colors">
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">Logout</span>
                </button>
            </header>
            <div className="text-center mb-6">
              <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" alt="Ducky Logo" className="w-24 h-24 mx-auto mb-2 logo-float" />
              <h1 className="text-4xl font-black text-yellow-400 text-glow uppercase tracking-widest">DUCKY DZ</h1>
            </div>
            <div className="aspect-video bg-black/30 rounded-xl flex flex-col items-center justify-center border border-white/10 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-400 tracking-wider mb-2">PREDICTION</h2>
              {isLoading ? (
                  <div className="text-5xl font-bold text-yellow-400 text-glow loader-dots">
                      <span>.</span><span>.</span><span>.</span>
                  </div>
              ) : (
                  <div className="text-8xl font-bold text-yellow-400 text-glow">{crashValue}</div>
              )}
            </div>
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-yellow-400" />
                    <div>
                        <div className="text-xs text-gray-400">Time Left</div>
                        <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
                    </div>
                </div>
                <div className="text-sm font-semibold">{getStatusIndicator()}</div>
            </div>
          </div>
        </main>
      </div>
    </KillSwitch>
  );
}

export default function DuckyWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-[#0a0a1a] min-h-screen flex items-center justify-center text-white"><Loader className="animate-spin" size={48} /></div>}>
            <WelcomeContent />
        </Suspense>
    )
}
