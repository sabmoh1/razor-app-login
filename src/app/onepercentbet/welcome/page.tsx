
"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Loader, User, Link2 } from "lucide-react";
import KillSwitch from '@/components/kill-switch';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [crashValue, setCrashValue] = useState<string>("0.00");
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
    sessionStorage.removeItem('onepercentbet_session_validity');
    sessionStorage.removeItem('razor_user_id');
    sessionStorage.removeItem('onepercentbet_platform');
    router.push('/onepercentbet');
  }, [router]);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('razor_user_id');
    const storedValidity = sessionStorage.getItem('onepercentbet_session_validity');
    const storedPlatform = sessionStorage.getItem('onepercentbet_platform');

    if (!storedUserId || !storedValidity || !storedPlatform) {
      handleLogout();
      return;
    }

    setUserId(storedUserId);
    setPlatform(storedPlatform);
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
            }, 800);
        }
      }
    };

    const startSSE = () => {
      if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
      setConnectionStatus("connecting");
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.addEventListener('put', (e) => {
          handleData(JSON.parse(e.data).data);
          setConnectionStatus("connected");
        });
        eventSource.addEventListener('patch', (e) => {
          handleData(JSON.parse(e.data).data);
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
    <KillSwitch pageName="onepercentbet">
      <Head><title>1%BET - Dashboard</title></Head>
      <div className="min-h-screen w-full bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 font-rajdhani overflow-x-hidden">
        <div className="w-full max-w-3xl mx-auto">
            <header className="flex flex-wrap justify-between items-center gap-4 mb-8 bg-[#161B22] p-4 rounded-lg border border-gray-800 shadow-lg">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-gray-300">
                        <User size={18} /><span className="font-semibold">ID:</span><span className="font-mono">{userId || '...'}</span>
                    </div>
                     <div className="flex items-center gap-2 text-gray-300">
                        <Link2 size={18} /><span className="font-semibold">Platform:</span><span className="font-mono">{platform || '...'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-400">Time Left</div>
                        <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
                    </div>
                     <div className="text-sm font-semibold px-3 py-2">{getStatusIndicator()}</div>
                </div>
            </header>
            <main className="bg-gradient-to-br from-[#161B22] to-[#0D1117] p-8 rounded-xl shadow-2xl border border-gray-800 flex flex-col items-center justify-center aspect-video w-full">
                <h2 className="text-2xl font-bold text-gray-400 tracking-wider font-bebas mb-4">CRASHED AT</h2>
                <div className="relative w-full h-32 flex items-center justify-center">
                    {isLoading ? (
                         <div className="flex items-center justify-center w-full h-full">
                            <Loader className="text-blue-400 animate-spin" size={64} />
                        </div>
                    ) : (
                        <div className="font-bebas text-9xl text-blue-400" style={{textShadow: '0 0 20px rgba(59, 130, 246, 0.7)'}}>{crashValue}</div>
                    )}
                </div>
            </main>
             <p className="text-center text-gray-600 text-xs mt-8">© 2024 1%BET. All rights reserved.</p>
        </div>
      </div>
    </KillSwitch>
  );
}

export default function OnePercentWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-[#0D1117] min-h-screen flex items-center justify-center text-white"><Loader className="animate-spin" /></div>}>
            <WelcomeContent />
        </Suspense>
    )
}
