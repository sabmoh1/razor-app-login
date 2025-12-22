
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [crashValue, setCrashValue] = useState("---");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 0;
    const value = parseInt(validity.slice(0, -1));
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 0;
    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return 0;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('razor_session_validity');
    sessionStorage.removeItem('razor_user_id');
    router.push('/ghost');
  };

  useEffect(() => {
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/ghost');
      return;
    }
    
    setTotalSeconds(parseValidityToSeconds(validity));

    const connectWebSocket = (url: string) => {
        if (wsRef.current) wsRef.current.close();
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
             if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };

        wsRef.current.onmessage = (ev) => {
            try {
                const jsonStart = ev.data.indexOf('{');
                if (jsonStart === -1) return;
                const jsonString = ev.data.substring(jsonStart);
                const parsed = JSON.parse(jsonString);
                if (parsed && typeof parsed.oncrash !== 'undefined') {
                    setCrashValue(parsed.oncrash + 'x');
                }
            } catch (e) {
                // ignore parse error
            }
        };

        wsRef.current.onclose = () => {
            wsRef.current = null;
            if (sessionStorage.getItem('razor_session_validity')) {
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => initializeWebSocket(), 2000);
                }
            }
        };

        wsRef.current.onerror = () => wsRef.current?.close();
    };
    
    const initializeWebSocket = async () => {
        try {
            const snapshot = await get(ref(database, 'websocket_url'));
            if (snapshot.exists()) connectWebSocket(snapshot.val());
        } catch (error) {
            console.error("Error fetching WebSocket URL:", error);
        }
    }

    initializeWebSocket();

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
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <KillSwitch pageName="ghost">
      <Head>
        <title>GHOST BETTING</title>
      </Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex; justify-content: center; align-items: center; min-height: 100vh;
          background-color: #0a0a0a; color: #00ff41; font-family: "Courier New", monospace;
          overflow: hidden; position: relative;
        }
        .container { position: relative; text-align: center; z-index: 10; }
        .top-text { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .bottom-text { font-size: 1.2rem; margin-top: 30px; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .timer { font-size: 1.1rem; margin-top: 20px; text-shadow: 0 0 5px #00ff41; letter-spacing: 1px; }

        .ghost-image-container {
          position: relative;
          margin: 20px auto;
        }
        .ghost-image {
          width: 150px;
          height: auto;
          filter: drop-shadow(0 0 25px rgba(0, 255, 65, 0.8));
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }

        #crashValue {
          font-size: 7rem;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }
        
        .background-grid {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
          background-size: 50px 50px; z-index: 1;
        }
        
        @media (max-width: 600px) {
            #crashValue {
                font-size: 5rem;
            }
            .ghost-image {
                width: 120px;
            }
            .top-text {
                font-size: 1.2rem;
            }
        }
      `}</style>
      
      <div className="background-grid"></div>

      <div className="container">
        <div className="top-text">GHOST BETTING</div>
        
        <div id="crashValue">{crashValue}</div>

        <div className="ghost-image-container">
            <img src="https://iili.io/fE2Ejrg.png" alt="Ghost" className="ghost-image" />
        </div>

        <div className="bottom-text">CRASH HACK</div>
        <div className="timer">{formatTime(totalSeconds)}</div>
      </div>
    </KillSwitch>
  );
}

export default function GhostWelcomePage() {
    return (
      <Suspense fallback={<div className="bg-black text-green-500 min-h-screen flex items-center justify-center">Loading...</div>}>
        <WelcomeContent />
      </Suspense>
    );
}

