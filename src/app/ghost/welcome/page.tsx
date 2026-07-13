
"use client";

import { useEffect, useRef, Suspense, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [crashValue, setCrashValue] = useState("---");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const lastValueRef = useRef<string | null>(null);

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

    // --- New Data Reception Logic (SSE & Polling) ---
    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/predictions/current.json";
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const handleData = (data: any) => {
      if (data && data.value) {
        const val = String(data.value);
        if (lastValueRef.current !== val) {
          setCrashValue(val + 'x');
          lastValueRef.current = val;
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
    };
  }, [router]);
  
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
  }, [totalSeconds]);
  
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <KillSwitch pageName="ghost">
      <Head><title>GHOST BETTING</title></Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #0a0a1a; color: #00ff41; font-family: "Courier New", monospace; overflow: hidden; position: relative; }
        .container { position: relative; text-align: center; z-index: 10; }
        .top-text { font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; letter-spacing: 4px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .bottom-text { font-size: 1.2rem; margin-top: 30px; letter-spacing: 3px; text-transform: uppercase; text-shadow: 0 0 10px #00ff41; }
        .timer { font-size: 1.1rem; margin-top: 20px; text-shadow: 0 0 5px #00ff41; letter-spacing: 1px; }
        .ghost-image { width: 150px; height: auto; filter: drop-shadow(0 0 25px rgba(0, 255, 65, 0.8)); animation: float 4s ease-in-out infinite; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1; opacity: 0.3; }
        @keyframes float { 0%, 100% { transform: translate(-50%, -50%) translateY(0px); } 50% { transform: translate(-50%, -50%) translateY(-20px); } }
        #crashValue { font-size: 7rem; font-weight: 900; color: #ffffff; text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41; letter-spacing: 2px; margin-bottom: 20px; position: relative; z-index: 2; }
        .background-grid { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px); background-size: 50px 50px; z-index: 1; }
        @media (max-width: 600px) { #crashValue { font-size: 5rem; } .ghost-image { width: 120px; } .top-text { font-size: 1.2rem; } }
      `}</style>
      <div className="background-grid"></div>
      <div className="container">
        <div className="top-text">GHOST BETTING</div>
        <div style={{ position: 'relative', margin: '20px auto' }}>
            <img src="https://iili.io/fE2Ejrg.png" alt="Ghost" className="ghost-image" />
            <div id="crashValue">{crashValue}</div>
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
