
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { User, Wifi, WifiOff, Loader2 as Loader, Clock, LogOut, Power } from "lucide-react";

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
        try {
          const jsonStart = ev.data.indexOf('{');
          const jsonEnd = ev.data.lastIndexOf('}');
          if (jsonStart === -1 || jsonEnd === -1) return;
          const jsonString = ev.data.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonString);

          if (parsed && typeof parsed.oncrash !== 'undefined') {
            if (lastValueRef.current !== parsed.oncrash) {
              setIsLoading(true);
              if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
              loadingTimeoutRef.current = setTimeout(() => {
                setCrashValue(parsed.oncrash);
                setIsLoading(false);
                lastValueRef.current = parsed.oncrash;
              }, 1200);
            }
          }
        } catch (e) { /* ignore parse error */ }
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
      router.push('/nasserusdt');
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
    router.push('/nasserusdt');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusIndicator = () => {
    switch(connectionStatus) {
      case 'connected': return <div className="flex items-center gap-2 text-green-400"><Wifi size={16} /><span>متصل</span></div>;
      case 'connecting': return <div className="flex items-center gap-2 text-yellow-400"><Loader size={16} className="animate-spin" /><span>جاري الاتصال...</span></div>;
      case 'error': return <div className="flex items-center gap-2 text-red-500"><WifiOff size={16} /><span>خطأ</span></div>;
      default: return <div className="flex items-center gap-2 text-gray-500"><WifiOff size={16} /><span>غير متصل</span></div>;
    }
  }

  return (
    <>
      <Head>
          <title>NasserUSDT - VIP Access</title>
           <link
            href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap"
            rel="stylesheet"
          />
      </Head>
      <style jsx global>{`
        body {
          background: url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtscjZ6M3JtMTZ2b2x3d2lldmNsd2VjejVqcDBkN2ZtYm53bWJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbL2nL2r0r0m4/giphy.gif") no-repeat center center fixed;
          background-size: cover;
          font-family: "Cairo", sans-serif;
          color: white;
        }

        body::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: -1;
        }

        .main-box {
          background: rgba(0, 0, 0, 0.85);
          box-shadow: 0 0 30px #ff4d4d, 0 10px 40px rgba(255, 77, 77, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 77, 77, 0.2);
          animation: fadeInUp 0.8s ease-out;
        }

        .text-glow {
           color: #ff4d4d;
           text-shadow: 0 0 20px rgba(255, 77, 77, 0.7);
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
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="flex min-h-screen flex-col items-center justify-center p-4">

        <main className="main-box w-full max-w-2xl rounded-3xl p-6 md:p-8">
            
            <header className="flex flex-wrap justify-between items-center mb-6 border-b border-red-500/30 pb-4 gap-4">
                <div className="flex items-center gap-3">
                    <User size={18} className="text-[#ff4d4d]" />
                    <span className="font-semibold text-sm">{userId}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/50 text-red-300 hover:bg-red-500/40 transition-colors">
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">تسجيل الخروج</span>
                </button>
            </header>

            <div className="text-center mb-6">
                <h1 className="text-glow text-3xl font-bold uppercase tracking-widest">NasserUSDT</h1>
            </div>

            <div className="aspect-video bg-black/30 rounded-xl flex flex-col items-center justify-center border border-red-500/20 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-400 tracking-wider mb-2">التوقع</h2>
              {isLoading ? (
                  <div className="text-5xl font-bold text-glow loader-dots">
                      <span>.</span><span>.</span><span>.</span>
                  </div>
              ) : (
                  <div className="text-8xl font-black text-glow">
                      {crashValue}
                  </div>
              )}
            </div>

            <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                    <Clock size={20} className="text-[#ff4d4d]" />
                    <div>
                        <div className="text-xs text-gray-400">الوقت المتبقي</div>
                        <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
                    </div>
                </div>
                <div className="text-sm font-semibold">
                    {connectionStatus === 'disconnected' && totalSeconds > 0 ? (
                        <button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'} className="flex items-center gap-2 text-yellow-400">
                            <Power size={16} /><span>اتصال</span>
                        </button>
                    ) : getStatusIndicator()}
                </div>
            </div>
        </main>
      </div>
    </>
  );
}

export default function NasserusdtWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center text-white"><Loader className="animate-spin" size={48} /></div>}>
            <WelcomeContent />
        </Suspense>
    )
}
