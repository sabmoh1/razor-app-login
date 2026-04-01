
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'head';
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
  
  useEffect(() => {
    const container = document.getElementById('particles-background');
    if (!container) return;
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const particleCount = 30; // Increased density
    const imageUrl = "https://iili.io/fxaO5P9.jpg";

    for (let i = 0; i < particleCount; i++) {
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

  const handleLogout = () => {
    sessionStorage.removeItem('razor_session_validity');
    sessionStorage.removeItem('razor_user_id');
    router.push('/nasserusdt');
  };

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const storedValidity = sessionStorage.getItem('razor_session_validity');

    if (!storedUserId || !storedValidity) {
      handleLogout();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, router]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusIndicator = () => {
    switch(connectionStatus) {
      case 'connected': return <div className="flex items-center gap-2 text-cyan-300"><Wifi size={16} /><span>Connected</span></div>;
      case 'connecting': return <div className="flex items-center gap-2 text-yellow-300"><Loader size={16} className="animate-spin" /><span>Connecting...</span></div>;
      case 'error': return <div className="flex items-center gap-2 text-red-400"><WifiOff size={16} /><span>Error</span></div>;
      default: return <div className="flex items-center gap-2 text-gray-400"><WifiOff size={16} /><span>Disconnected</span></div>;
    }
  }

  return (
    <KillSwitch pageName="nasserusdt">
      <Head>
          <title>NasserUSDT - VIP Access</title>
           <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap"
            rel="stylesheet"
          />
      </Head>
      <div id="particles-background" className="fixed inset-0 -z-10 overflow-hidden"></div>
      <style jsx global>{`
        body {
          background-color: #0a192f;
          font-family: "Poppins", sans-serif;
          color: white;
        }

        .main-box {
          background: rgba(10, 25, 47, 0.85);
          box-shadow: 0 0 40px rgba(0, 191, 255, 0.4), inset 0 0 20px rgba(0, 191, 255, 0.2);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(0, 191, 255, 0.3);
          animation: fadeIn 1s ease-out;
        }

        .text-glow {
           color: #00BFFF;
           text-shadow: 0 0 15px rgba(0, 191, 255, 0.5), 0 0 30px rgba(0, 191, 255, 0.3);
        }

        .loader-dots span {
            animation-name: blink;
            animation-duration: 1.4s;
            animation-iteration-count: infinite;
            animation-fill-mode: both;
        }
        .loader-dots span:nth-of-type(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-of-type(3) { animation-delay: 0.4s; }
        @keyframes blink { 0% { opacity: .2; } 20% { opacity: 1; } 100% { opacity: .2; } }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        
        .pulse-shadow {
          box-shadow: 0 0 40px rgba(0, 191, 255, 0.6);
          animation: pulse 2.5s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 40px rgba(0, 191, 255, 0.5); }
          50% { box-shadow: 0 0 60px rgba(0, 191, 255, 0.8); }
          100% { box-shadow: 0 0 40px rgba(0, 191, 255, 0.5); }
        }
        
        .particle {
            position: absolute;
            border-radius: 50%;
            background-size: cover;
            opacity: 0.15;
            pointer-events: none;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) scale(1);
                opacity: 0.15;
            }
            100% {
                transform: translateY(-100px) scale(0.5);
                opacity: 0;
            }
        }
      `}</style>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4">

        <main className="main-box w-full max-w-md rounded-3xl p-6 md:p-8">
            
            <header className="flex flex-col items-center mb-6">
                <img src="https://iili.io/fxaO5P9.jpg" alt="NasserUSDT Logo" className="w-24 h-24 rounded-full mb-4 border-2 border-cyan-400 pulse-shadow"/>
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
                  <div className="text-8xl font-black text-glow">
                      {crashValue}
                  </div>
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
                <div className="text-sm font-semibold">
                    {connectionStatus === 'disconnected' && totalSeconds > 0 ? (
                        <button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'} className="flex items-center gap-2 text-yellow-300">
                            <Power size={16} /><span>Connect</span>
                        </button>
                    ) : getStatusIndicator()}
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
