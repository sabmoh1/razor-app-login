
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
  const dataPointsContainerRef = useRef<HTMLDivElement>(null);
  
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

    // Create random data points
    const dataPointsContainer = dataPointsContainerRef.current;
    if (dataPointsContainer) {
        while (dataPointsContainer.firstChild) {
            dataPointsContainer.removeChild(dataPointsContainer.firstChild);
        }
        const numPoints = 20;
        for (let i = 0; i < numPoints; i++) {
            const point = document.createElement("div");
            point.classList.add("data-point");
            const angle = Math.random() * 2 * Math.PI;
            const radius = 45;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            point.style.left = `${x}%`;
            point.style.top = `${y}%`;
            point.style.animation = `pulse ${2 + Math.random() * 3}s infinite ${Math.random() * 3}s`;
            dataPointsContainer.appendChild(point);
        }
    }


    const connectWebSocket = (url: string) => {
        if (wsRef.current) wsRef.current.close();
        wsRef.current = new WebSocket(url);

        wsRef.current.onopen = () => {
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
  }, [totalSeconds]);
  
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
        .top-text { font-size: 1.2rem; margin-bottom: 30px; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .bottom-text { font-size: 1.2rem; margin-top: 30px; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .timer { font-size: 1rem; margin-top: 20px; text-shadow: 0 0 5px #00ff41; }
        .circle-container { position: relative; width: 300px; height: 300px; margin: 0 auto; }
        .outer-circle {
          position: absolute; width: 100%; height: 100%; border-radius: 50%;
          background: conic-gradient(#00ff41, #00cc33, #009926, #006619, #00330d, #000000, #000000, #00330d, #006619, #009926, #00cc33, #00ff41);
          animation: rotate 8s linear infinite; box-shadow: 0 0 30px rgba(0, 255, 65, 0.5);
        }
        .middle-circle {
          position: absolute; width: 90%; height: 90%; top: 5%; left: 5%;
          border-radius: 50%; background: #0a0a0a; display: flex;
          justify-content: center; align-items: center;
        }
        .inner-circle {
          position: relative; width: 70%; height: 70%; border-radius: 50%;
          border: 2px solid #00ff41; display: flex; justify-content: center;
          align-items: center; overflow: hidden;
        }
        .inner-circle::before {
          content: ""; position: absolute; width: 150%; height: 150%;
          background: conic-gradient(transparent, transparent, transparent, #00ff41, transparent, transparent, transparent, #00ff41);
          animation: rotate 4s linear infinite;
        }
        .text-large {
          position: absolute; font-size: 1.8rem; font-weight: bold; z-index: 2;
          background: #0a0a0a; padding: 10px 20px; border-radius: 10px;
          text-shadow: 0 0 10px #00ff41; letter-spacing: 2px;
        }
        .scan-line {
          position: absolute; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, #00ff41, transparent);
          top: 50%; left: 0; transform: translateY(-50%); animation: scan 2s linear infinite;
        }
        .data-points { position: absolute; width: 100%; height: 100%; border-radius: 50%; }
        .data-point {
          position: absolute; width: 6px; height: 6px; background-color: #00ff41;
          border-radius: 50%; box-shadow: 0 0 10px #00ff41;
        }
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes scan { 0% { transform: translateY(-50%) scaleX(0); } 50% { transform: translateY(-50%) scaleX(1); } 100% { transform: translateY(-50%) scaleX(0); } }
        .glitch {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 255, 65, 0.03); opacity: 0; animation: glitch 5s infinite;
        }
        @keyframes glitch { 0%, 100% { opacity: 0; } 5%, 8% { opacity: 0.1; transform: translateX(5px); } 10%, 13% { opacity: 0.1; transform: translateX(-5px); } 15%, 18% { opacity: 0.1; transform: translateX(3px); } }
        .background-grid {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
          background-size: 50px 50px; z-index: 1;
        }
        .pulse {
          position: absolute; width: 100%; height: 100%; border-radius: 50%;
          border: 1px solid rgba(0, 255, 65, 0.3); animation: pulse-anim 3s infinite;
        }
        @keyframes pulse-anim { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
      `}</style>
      
      <div className="background-grid"></div>

      <div className="container">
        <div className="top-text">GHOST BETTING</div>

        <div className="circle-container">
          <div className="outer-circle"></div>
          <div className="middle-circle">
            <div className="inner-circle">
              <div className="text-large" id="crashValue">{crashValue}</div>
              <div className="scan-line"></div>
              <div className="data-points" ref={dataPointsContainerRef}></div>
            </div>
          </div>
          <div className="pulse"></div>
          <div className="glitch"></div>
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
