"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Loader2 } from 'lucide-react';

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
      case 'connected': return <div className="flex items-center gap-2 text-cyan-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0001 1.99998C15.0915 1.99998 17.9813 3.14918 20.1234 5.29128C22.2655 7.43338 23.4147 10.3232 23.4147 13.4146C23.4147 16.506 22.2655 19.3957 20.1234 21.5378C17.9813 23.6799 15.0915 24.8291 12.0001 24.8291C8.90868 24.8291 6.01891 23.6799 3.87681 21.5378C1.73471 19.3957 0.58551 16.506 0.58551 13.4146C0.58551 10.3232 1.73471 7.43338 3.87681 5.29128C6.01891 3.14918 8.90868 1.99998 12.0001 1.99998Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7.41467 13.4146L10.8289 16.8288L17.1421 10.501" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Connected</span></div>;
      case 'connecting': return <div className="flex items-center gap-2 text-yellow-400"><Loader2 size={16} className="animate-spin" /><span>Connecting...</span></div>;
      case 'error': return <div className="flex items-center gap-2 text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.92993 4.92993L19.0699 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Error</span></div>;
      default: return <div className="flex items-center gap-2 text-gray-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.92993 4.92993L19.0699 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Disconnected</span></div>;
    }
  }


  return (
    <>
      <Head>
        <title>KALORODZ | Terminal</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        body {
          background: #0a0a1a;
          color: #eee;
          font-family: 'Orbitron', sans-serif;
        }
        .main-container {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: radial-gradient(ellipse at center, rgba(10, 25, 47, 0.9), #0a0a1a 70%);
          position: relative;
        }
        .display-circle {
          width: clamp(260px, 60vw, 300px);
          height: clamp(260px, 60vw, 300px);
          border-radius: 50%;
          border: 3px solid #00bfff;
          background: rgba(10, 25, 47, 0.5);
          box-shadow: 0 0 2rem rgba(0,191,255,0.6), inset 0 0 2rem rgba(0,191,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          margin-top: -2rem;
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
            position: relative;
        }
        .circle-bg-image {
          position: absolute;
          width: 80%;
          height: 80%;
          object-fit: contain;
          border-radius: 50%;
          filter: opacity(0.1);
          z-index: -1;
        }
        .crash-value {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(3rem, 12vw, 4.5rem);
          color: white;
          text-shadow: 0 0 1rem #00bfff, 0 0 2rem #007bff;
          transition: all 0.3s ease;
          z-index: 2;
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
        .kalorodz-title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: clamp(1.5rem, 6vw, 2rem);
          letter-spacing: 0.15rem;
          color: white;
          text-transform: uppercase;
          padding: 0.6rem 1.2rem;
          border-radius: 1rem;
          box-shadow: 0 0 1.5rem rgba(0,191,255,0.8), 0 0 3rem rgba(0,123,255,0.6);
          text-shadow: 0 0 0.6rem #00bfff, 0 0 1.2rem #007bff;
          animation: glow-pulse 2s infinite alternate;
        }
        @keyframes glow-pulse {
          0% { text-shadow: 0 0 0.6rem #00bfff, 0 0 1.2rem #007bff; }
          100% { text-shadow: 0 0 0.9rem #00bfff, 0 0 1.8rem #007bff, 0 0 2.7rem #00d4ff; }
        }
        .info-bar {
          width: 100%;
          max-width: 450px;
          padding: 0.5rem 1rem;
          background: linear-gradient(145deg, #111, #1a1a1a);
          border: 1px solid #00bfff;
          border-radius: 1rem;
          box-shadow: 0 0 1rem rgba(0,191,255,0.4);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Orbitron', sans-serif;
          margin-bottom: 2rem;
        }
        .info-bar-bottom {
          padding: 0.75rem 1.25rem;
          margin-top: 1rem;
          margin-bottom: 0;
        }
        .info-bar-bottom .text-xs { font-size: 0.7rem; }
        .info-bar-bottom .font-bold { font-size: 1.1rem; }
      `}</style>
      <main className="main-container">
        
        <div className="absolute top-8 text-center">
             <h1 className="kalorodz-title">KALORODZ</h1>
        </div>

        <div className="absolute top-28 w-full px-4 flex justify-center">
            <div className="info-bar">
                <div className="flex items-center gap-3">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span className="font-semibold text-sm">{userId || '...'}</span>
                </div>
                <div className="text-sm font-semibold">
                    {getStatusIndicator()}
                </div>
            </div>
        </div>

        <div className="display-circle">
          <div className="circle-inner">
            <img src="https://i.ibb.co/Kp4zV4wY/6050911538094214341-120-removebg-preview.png" alt="Dragon Background" className="circle-bg-image" />
            <div className={`crash-value ${isGlitching ? 'glitch-active' : ''}`}>{crashValue}</div>
          </div>
        </div>

        <div className="absolute bottom-8 w-full px-4 flex justify-center">
            <div className="info-bar info-bar-bottom">
                <div className="text-xs text-gray-400">Time Left</div>
                <div className="font-bold">{formatTime(totalSeconds)}</div>
            </div>
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
