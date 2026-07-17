
"use client";

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Coins, ShieldCheck } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import Image from 'next/image';

const GOLD_BAG = "https://iili.io/f50k5vf.png"; // Apple-like icon or gold bag
const EMPTY_SLOT = "https://iili.io/f50v4f9.webp"; // Wood/Empty

function WildWestTerminal() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [gameData, setGridData] = useState<any>(null);
  const [status, setStatus] = useState<"live" | "wait">("wait");
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  
  const stateRef = useRef<any>(null);

  const parseValidityToSeconds = (validity: string | null): number => {
    if (!validity) return 11 * 60;
    const value = parseInt(validity.slice(0, -1));
    const unit = validity.slice(-1).toLowerCase();
    if (isNaN(value)) return 11 * 60;
    switch (unit) {
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      case 'm': return value * 60;
      case 's': return value;
      default: return value * 60;
    }
  };

  const applyAtPath = (root: any, path: string, data: any) => {
    if (path === "/" || path === "") return data;
    const parts = path.split("/").filter(Boolean);
    if (root === null || typeof root !== "object") root = {};
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (typeof node[k] !== "object" || node[k] === null) node[k] = {};
      node = node[k];
    }
    const last = parts[parts.length - 1];
    if (data === null) delete node[last]; else node[last] = data;
    return root;
  };

  const updateUI = useCallback((newState: any) => {
    if (newState) {
      setGridData(newState);
      setStatus("live");
    } else {
      setGridData(null);
      setStatus("wait");
    }
  }, []);

  useEffect(() => {
    document.title = "WILD WEST — Terminal V1";
    const validity = sessionStorage.getItem('razor_session_validity');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!validity || !storedUserId) {
      router.push('/wildwest');
      return;
    }
    setUserId(storedUserId);

    const STREAM_URL = "https://crash-db-1ff97-default-rtdb.firebaseio.com/wildwest/current_game.json";
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const startSSE = () => {
      try {
        eventSource = new EventSource(STREAM_URL);
        eventSource.onopen = () => setStatus("live");
        const handleEvent = (ev: MessageEvent) => {
          let payload;
          try { payload = JSON.parse(ev.data); } catch (_) { return; }
          if (!payload || typeof payload !== "object") return;
          const path = payload.path != null ? payload.path : "/";
          const data = payload.data;
          stateRef.current = applyAtPath(stateRef.current, path, data);
          updateUI(stateRef.current);
        };
        eventSource.addEventListener('put', handleEvent as any);
        eventSource.addEventListener('patch', handleEvent as any);
        eventSource.onerror = () => { eventSource?.close(); startPolling(); };
      } catch (e) { startPolling(); }
    };

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(STREAM_URL + "?_=" + Date.now(), { cache: 'no-store' });
          const data = await res.json();
          stateRef.current = data;
          updateUI(data);
        } catch (e) { setStatus("wait"); }
      }, 2000);
    };

    startSSE();

    let totalSeconds = parseValidityToSeconds(validity);
    const timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        setTimeLeft(`${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`);
      } else {
        clearInterval(timerInterval);
        sessionStorage.clear();
        router.push('/wildwest');
      }
    }, 1000);

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [router, updateUI]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/wildwest');
  };

  return (
    <KillSwitch pageName="wildwest">
      <style jsx global>{`
          :root {
            --gold: #FFD700;
            --bg: #0a0a0a;
            --muted: #444;
          }
          body {
            background: black url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif') no-repeat center center fixed;
            background-size: cover;
            color: white;
            font-family: 'Orbitron', sans-serif;
            overflow-x: hidden;
          }
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: sepia(0.4) brightness(1.2);
            z-index: -1;
          }
          .terminal {
            max-width: 500px;
            margin: 0 auto;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 20px;
          }
          .grid-container {
            flex: 1;
            display: flex;
            flex-direction: column-reverse;
            gap: 8px;
            padding: 20px 0;
          }
          .row {
            display: grid;
            gap: 8px;
            background: rgba(255,255,255,0.03);
            padding: 10px;
            border-radius: 12px;
            border: 1px solid rgba(255,215,0,0.05);
            transition: all 0.3s;
          }
          .row.active { border-color: rgba(255,215,0,0.3); background: rgba(255,215,0,0.05); }
          .cell {
            aspect-square: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.4);
            border-radius: 8px;
            overflow: hidden;
          }
          .gold-pulse { animation: gold-glow 2s infinite; }
          @keyframes gold-glow { 0%, 100% { filter: drop-shadow(0 0 5px var(--gold)); opacity: 1; } 50% { filter: drop-shadow(0 0 15px var(--gold)); opacity: 0.8; } }
          .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .chip { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 8px; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #444; }
          .status-dot.live { background: #FFD700; box-shadow: 0 0 10px #FFD700; animation: pulse 1.5s infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      
      <div className="terminal">
        <header className="topbar">
          <div className="chip">
            <User size={14} className="text-yellow-500" />
            <span>{userId}</span>
          </div>
          <div className="chip">
            <div className={`status-dot ${status === 'live' ? 'live' : ''}`}></div>
            <span className="text-[10px] tracking-widest">{status === 'live' ? 'CONNECTED' : 'WAITING'}</span>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-red-500/20 transition-colors">
            <LogOut size={16} />
          </button>
        </header>

        <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-yellow-500 tracking-wider">WILD WEST GOLD</h2>
            <p className="text-[10px] text-gray-500 tracking-[0.4em]">PATH ANALYSIS TERMINAL</p>
        </div>

        <div className="grid-container">
          {Array.from({ length: 10 }).map((_, rowIndex) => {
            const isDataReady = gameData && gameData.correct && gameData.correct[rowIndex] !== undefined;
            const correctCol = isDataReady ? gameData.correct[rowIndex] : -1;
            const mode = gameData?.mode || 2;

            return (
              <div 
                key={rowIndex} 
                className={`row ${isDataReady ? 'active' : ''}`}
                style={{ gridTemplateColumns: `repeat(${mode}, 1fr)` }}
              >
                {Array.from({ length: mode }).map((_, colIndex) => (
                  <div key={colIndex} className="cell">
                    {correctCol === colIndex ? (
                      <img src={GOLD_BAG} alt="Gold" className="w-10 h-10 gold-pulse" />
                    ) : (
                      <img src={EMPTY_SLOT} alt="Empty" className="w-10 h-10 opacity-20 grayscale" />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <footer className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
          <div className="flex items-center gap-2 text-yellow-500/50">
            <Coins size={16} />
            <span className="text-sm font-bold">{gameData?.bet || 0} <span className="text-[10px]">USDT</span></span>
          </div>
          <div className="text-lg font-mono tracking-widest font-bold text-white/40">{timeLeft}</div>
          <div className="flex items-center gap-2 text-green-500/50">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold">SECURE</span>
          </div>
        </footer>
      </div>
    </KillSwitch>
  );
}

export default function WildWestPage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen"></div>}>
            <WildWestTerminal />
        </Suspense>
    );
}
