"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { User, Zap, Wifi, WifiOff, Loader2 } from 'lucide-react';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [crashValue, setCrashValue] = useState<string>("---");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected" | "connecting" | "error">("disconnected");
  const [isGlitching, setIsGlitching] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string | null>(null);

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
                setIsGlitching(true);
                setTimeout(() => {
                    setCrashValue(parsed.oncrash);
                    lastValueRef.current = parsed.oncrash;
                    setTimeout(() => setIsGlitching(false), 300);
                }, 400);
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
      router.push('/kaloroo');
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
    router.push('/kaloroo');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusIndicator = () => {
    switch(connectionStatus) {
      case 'connected': return <div className="flex items-center gap-2 text-cyan-300"><Wifi size={16} /><span>Connected</span></div>;
      case 'connecting': return <div className="flex items-center gap-2 text-yellow-400"><Loader2 size={16} className="animate-spin" /><span>Connecting...</span></div>;
      case 'error': return <div className="flex items-center gap-2 text-red-500"><WifiOff size={16} /><span>Error</span></div>;
      default: return <div className="flex items-center gap-2 text-gray-500"><WifiOff size={16} /><span>Disconnected</span></div>;
    }
  }


  return (
    <>
      <Head>
        <title>KALORODZ | Terminal</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <style jsx global>{`
        body {
          background: #0a0a1a;
          color: #eee;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .main-container {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: radial-gradient(ellipse at center, rgba(10, 25, 47, 0.9), #0a0a1a 70%);
        }
        .display-circle {
          width: clamp(280px, 80vw, 400px);
          height: clamp(280px, 80vw, 400px);
          border-radius: 50%;
          border: 3px solid #00bfff;
          background: rgba(10, 25, 47, 0.5);
          box-shadow: 0 0 2rem rgba(0,191,255,0.6), inset 0 0 2rem rgba(0,191,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .display-circle::before, .display-circle::after {
            content: '';
            position: absolute;
            width: 150%;
            height: 150%;
            background: conic-gradient(from var(--angle), transparent, #00d4ff, transparent 20%);
            animation: rotate 6s linear infinite;
            pointer-events: none;
        }
         .display-circle::after {
            animation-delay: -3s;
        }
        @property --angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
        }
        @keyframes rotate {
          to { --angle: 360deg; }
        }
        .circle-inner {
            width: calc(100% - 20px);
            height: calc(100% - 20px);
            background: #0a101f;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1;
        }
        .crash-value {
          font-size: clamp(4rem, 18vw, 7rem);
          font-weight: 900;
          color: white;
          text-shadow: 0 0 1rem #00bfff, 0 0 2rem #007bff;
          transition: all 0.3s ease;
        }
        .glitch-active {
            animation: glitch 0.7s forwards;
        }
        @keyframes glitch {
            0% { transform: skewX(0); opacity: 1; text-shadow: 0 0 1rem #00bfff; }
            20% { transform: skewX(-15deg) translateX(-10px); opacity: 0.8; text-shadow: 0 0 1rem #ff3333; }
            40% { transform: skewX(15deg) translateX(10px); opacity: 0.9; text-shadow: 0 0 1rem #33ff33; }
            60% { transform: skewX(-10deg) translateX(-5px); opacity: 1; }
            80% { transform: skewX(10deg) translateX(5px); }
            100% { transform: skewX(0); opacity: 1; text-shadow: 0 0 1rem #00bfff; }
        }
        .info-panel {
          width: 100%;
          max-width: 400px;
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(0,191,255,0.2);
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      `}</style>
      <main className="main-container">
        
        <div className="text-center mb-8">
             <h1 className="text-3xl font-bold text-white tracking-widest">KALORODZ</h1>
             <p className="text-cyan-300">Terminal</p>
        </div>

        <div className="display-circle">
          <div className="circle-inner">
            <Zap size={40} className="text-yellow-400 mb-2" style={{filter: 'drop-shadow(0 0 5px #ffcc00)'}}/>
            <div className={`crash-value ${isGlitching ? 'glitch-active' : ''}`}>{crashValue}</div>
          </div>
        </div>

        <div className="info-panel">
            <div className="flex items-center gap-3">
                <User className="text-cyan-400" size={20} />
                <span className="font-semibold">{userId}</span>
            </div>
             <div className="text-sm font-semibold">
                {getStatusIndicator()}
            </div>
        </div>
         <div className="text-center mt-4">
            <div className="text-xs text-gray-400">Time Left</div>
            <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
        </div>
      </main>
    </>
  );
}

export default function KalorooWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-[#0a0a1a] min-h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin" size={48} /></div>}>
            <WelcomeContent />
        </Suspense>
    )
}
