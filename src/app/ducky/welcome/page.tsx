
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const connectWebSocket = async () => {
    if (wsRef.current) wsRef.current.close();
    setConnectionStatus("connecting");
    try {
      const snapshot = await get(ref(database, 'websocket_url'));
      if (!snapshot.exists()) {
        setConnectionStatus("error");
        return;
      }
      const WS_URL = snapshot.val();
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        setConnectionStatus("connected");
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      };

      wsRef.current.onmessage = (ev) => {
        let rawData = typeof ev.data === 'string' ? ev.data.trim() : String(ev.data).trim();
        if (rawData.endsWith('\x1e')) rawData = rawData.slice(0, -1).trim();

        let newValue = null;

        // Check if raw data is a number
        if (rawData !== '' && !isNaN(Number(rawData))) {
          newValue = rawData;
        } else {
          // Try JSON parsing
          try {
            const parsed = JSON.parse(rawData);
            if (parsed && typeof parsed.oncrash !== 'undefined') {
              newValue = String(parsed.oncrash);
            } else if (!isNaN(parseFloat(parsed))) {
              newValue = String(parsed);
            }
          } catch (e) {
            // Fallback regex
            const match = rawData.match(/"oncrash"\s*:\s*"?([0-9.]+)"?/);
            if (match && match[1]) {
              newValue = match[1];
            }
          }
        }

        if (newValue && lastValueRef.current !== newValue) {
          setIsLoading(true);
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = setTimeout(() => {
            setCrashValue(newValue);
            setIsLoading(false);
            lastValueRef.current = newValue;
          }, 1200);
        }
      };

      wsRef.current.onclose = () => {
        wsRef.current = null;
        setConnectionStatus("disconnected");
        if (sessionStorage.getItem('razor_session_validity')) {
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
          }
        }
      };

      wsRef.current.onerror = () => {
        setConnectionStatus("error");
        wsRef.current?.close();
      };
    } catch (error) {
      console.error("Error fetching WebSocket URL:", error);
      setConnectionStatus("error");
    }
  };

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const storedValidity = sessionStorage.getItem('razor_session_validity');

    if (!storedUserId || !storedValidity) {
      router.push('/ducky');
      return;
    }

    setUserId(storedUserId);
    setTotalSeconds(parseValidityToSeconds(storedValidity));
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [router]);

  useEffect(() => {
    if (totalSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTotalSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [totalSeconds, router]);

  const handleLogout = () => {
    sessionStorage.removeItem('razor_session_validity');
    sessionStorage.removeItem('razor_user_id');
    router.push('/ducky');
  };

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
        .card-glow:hover { box-shadow: 0 12px 40px rgba(255, 176, 32, 0.2), 0 0 40px rgba(255, 176, 32, 0.25); }
        .loader-dots span {
            animation-name: blink;
            animation-duration: 1.4s;
            animation-iteration-count: infinite;
            animation-fill-mode: both;
        }
        .loader-dots span:nth-of-type(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-of-type(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        .logo-float {
            animation: float 4s ease-in-out infinite;
        }
         @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          75% { transform: translateY(-10px) rotate(-2deg); }
        }
        .brand-title {
          font-family: 'Poppins', sans-serif !important;
          font-weight: 900 !important;
        }
      `}</style>
      
      <div id="particles" className="fixed inset-0 z-0 overflow-hidden pointer-events-none"></div>

      <div className="relative z-10 flex flex-col min-h-screen items-center justify-center p-4 text-white">

        <main className="w-full max-w-2xl">
          <div className="bg-black/20 backdrop-filter backdrop-blur-lg border border-yellow-500/20 rounded-3xl p-6 md:p-8 card-glow transition-shadow duration-300">
            
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                    <User size={18} className="text-yellow-400" />
                    <span className="font-semibold text-sm">{userId}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-colors">
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">Logout</span>
                </button>
            </header>

            <div className="text-center mb-6">
              <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" alt="Ducky Logo" className="w-24 h-24 mx-auto mb-2 filter drop-shadow-[0_5px_15px_rgba(255,176,32,0.5)] logo-float" />
              <h1 className="text-4xl font-black text-yellow-400 text-glow uppercase tracking-widest brand-title">DUCKY DZ</h1>
            </div>

            <div className="aspect-video bg-black/30 rounded-xl flex flex-col items-center justify-center border border-white/10 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-400 tracking-wider mb-2">PREDICTION</h2>
              {isLoading ? (
                  <div className="text-5xl font-bold text-yellow-400 text-glow loader-dots">
                      <span>.</span><span>.</span><span>.</span>
                  </div>
              ) : (
                  <div className="text-8xl font-bold text-yellow-400 text-glow">
                      {crashValue}
                  </div>
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
                <div className="text-sm font-semibold">
                    {connectionStatus === 'disconnected' && totalSeconds > 0 ? (
                        <button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'} className="flex items-center gap-2 text-yellow-400">
                            <Power size={16} /><span>Connect</span>
                        </button>
                    ) : getStatusIndicator()}
                </div>
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
