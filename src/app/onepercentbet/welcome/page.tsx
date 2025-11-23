
"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Wifi, WifiOff, Loader, AlertTriangle, User } from "lucide-react";
import { Button } from '@/components/ui/button';

function WelcomeContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [validity, setValidity] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [crashValue, setCrashValue] = useState<string>("0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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
  
  // Connect WebSocket
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
            setIsConnected(true);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
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
                        }, 500); // loading animation duration
                    }
                }
            } catch (e) {
              // ignore parse error
            }
        };

        wsRef.current.onclose = () => {
            wsRef.current = null;
            setIsConnected(false);
            setConnectionStatus("disconnected");
            if (sessionStorage.getItem('onepercentbet_session_validity')) { // only reconnect if session is still valid
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 1500);
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
  }


  useEffect(() => {
    const storedUserId = sessionStorage.getItem('onepercentbet_user_id');
    const storedValidity = sessionStorage.getItem('onepercentbet_session_validity');

    if (!storedUserId || !storedValidity) {
      router.push('/onepercentbet');
      return;
    }

    setUserId(storedUserId);
    setValidity(storedValidity);
    const initialSeconds = parseValidityToSeconds(storedValidity);
    setTotalSeconds(initialSeconds);
    
    // Cleanup function
    return () => {
        if (wsRef.current) {
            wsRef.current.onclose = null; // Prevent reconnect logic on manual close
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
            sessionStorage.removeItem('onepercentbet_session_validity');
            sessionStorage.removeItem('onepercentbet_user_id');
            router.push('/onepercentbet');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
        if(timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    };
  }, [totalSeconds, router]);


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getStatusIndicator = () => {
      switch(connectionStatus) {
          case 'connected':
              return <div className="flex items-center gap-2 text-green-400"><Wifi size={16} /><span>Connected</span></div>;
          case 'connecting':
              return <div className="flex items-center gap-2 text-yellow-400"><Loader size={16} className="animate-spin" /><span>Connecting...</span></div>;
          case 'error':
               return <div className="flex items-center gap-2 text-red-500"><AlertTriangle size={16} /><span>Error</span></div>;
          case 'disconnected':
          default:
               return <div className="flex items-center gap-2 text-gray-500"><WifiOff size={16} /><span>Disconnected</span></div>;
      }
  }

  return (
    <>
      <Head>
        <title>1%BET - Dashboard</title>
      </Head>
      <div className="min-h-screen w-full bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 font-rajdhani">
         <style jsx global>{`
            body {
                background-color: #0D1117;
            }
        `}</style>
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-[#161B22] p-4 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-300">
                    <User size={18} />
                    <span className="font-semibold">ID:</span>
                    <span className="font-mono">{userId || '...'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="text-xs text-gray-400">Time Left</div>
                        <div className="font-mono font-bold text-lg">{formatTime(totalSeconds)}</div>
                    </div>
                     {!isConnected ? (
                        <Button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'}>
                            {connectionStatus === 'connecting' ? <Loader className="animate-spin mr-2" size={16}/> : null}
                            Connect
                        </Button>
                    ) : (
                         <div className="text-sm font-semibold">
                           {getStatusIndicator()}
                        </div>
                    )}
                </div>
            </header>

            {/* Main Display */}
            <main className="bg-gradient-to-br from-[#161B22] to-[#0D1117] p-8 rounded-xl shadow-2xl border border-gray-800 flex flex-col items-center justify-center aspect-video">
                <h2 className="text-2xl font-bold text-gray-400 tracking-wider font-bebas mb-2">CRASHED AT</h2>
                <div className="relative w-64 h-32 flex items-center justify-center">
                    {isLoading ? (
                         <div className="flex items-center justify-center w-full h-full">
                            <Loader className="text-blue-400 animate-spin" size={48} />
                        </div>
                    ) : (
                        <div className="font-bebas text-8xl text-blue-400" style={{textShadow: '0 0 15px rgba(59, 130, 246, 0.6)'}}>
                           {crashValue}
                        </div>
                    )}
                </div>
            </main>
             <p className="text-center text-gray-600 text-xs mt-8">
                © 2024 1%BET. All rights reserved.
            </p>
        </div>
      </div>
    </>
  );
}

export default function OnePercentWelcomePage() {
    return (
        <Suspense fallback={<div className="bg-[#0D1117] min-h-screen flex items-center justify-center text-white">Loading...</div>}>
            <WelcomeContent />
        </Suspense>
    )
}
