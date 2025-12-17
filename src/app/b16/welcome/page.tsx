
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { database } from '@/lib/firebase';
import { ref, remove, onValue } from 'firebase/database';
import KillSwitch from '@/components/kill-switch';


// --- Constants for Images ---
const GOOD_APPLE_URL = "https://iili.io/f50k5vf.png";
const BAD_APPLE_URL = "https://iili.io/f50v4f9.webp";
const WOOD_URL = "https://iili.io/f50v4f9.webp"; 

// --- Data for Rows ---
const INITIAL_ROWS = [
  { rate: '1.23' }, { rate: '1.53' }, { rate: '1.93' },
  { rate: '2.41' }, { rate: '4.02' }, { rate: '6.71' }, { rate: '11.18' }
].map(r => ({ ...r, seq: 'wwwww' })); // All wood initially

type RowData = {
  rate: string;
  seq: string;
};

// --- Helper Components ---

const BroadcastOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    const messages = ["Fetching data...", "Connecting to platform...", "Applying sequence..."];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        setMessage(messages[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 800); // Wait a bit after the last message
      }
    }, 1200); // Duration for each message

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
      <Loader2 className="w-16 h-16 animate-spin text-blue-400 mb-4" />
      <p className="text-xl font-semibold animate-pulse">{message}</p>
    </div>
  );
};

const GalleryRow = ({ row, onRowClick }: { row: RowData; onRowClick: () => void }) => {
  return (
    <div className="relative group cursor-pointer" onClick={onRowClick}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-300/70 group-hover:text-blue-300 transition-colors">
        {row.rate}x
      </div>
      <div className="grid grid-cols-5 gap-2 pl-12">
        {row.seq.split('').map((char, index) => (
          <div key={index} className="flex items-center justify-center">
            <Image
              src={char === '+' ? GOOD_APPLE_URL : (char === '-' ? BAD_APPLE_URL : WOOD_URL)}
              alt="Apple or Wood"
              width={64}
              height={64}
              className={cn("transition-all duration-500 ease-in-out w-14 h-14 md:w-16 md:h-16", char === 'w' ? 'opacity-80' : 'opacity-100' )}
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Welcome Page Component ---

function WelcomeB16() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [rows, setRows] = useState<RowData[]>(INITIAL_ROWS);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // --- Effects ---

  useEffect(() => {
    setIsClient(true);
    const storedAttempts = sessionStorage.getItem('razor_session_attempts');
    const storedUserId = sessionStorage.getItem('razor_user_id');

    if (!storedAttempts || !storedUserId) {
      router.push('/b16');
      return;
    }
    
    setAttemptsLeft(parseInt(storedAttempts, 10));
  }, [router]);

  // --- Core Logic ---

  const randomizeAllRows = useCallback(() => {
     setRows(currentRows => 
        currentRows.map(row => {
            const newPos = Math.floor(Math.random() * 5);
            const newSeq = ['-', '-', '-', '-', '-'];
            newSeq[newPos] = '+';
            return { ...row, seq: newSeq.join('') };
        })
     );
  }, []);

  const handleStart = () => {
    if (attemptsLeft === null || attemptsLeft <= 0) {
      alert("No attempts left.");
      router.push('/b16');
      return;
    }
    setIsBroadcasting(true);
    setHasStarted(true);
  };
  
  const onBroadcastComplete = useCallback(() => {
      setIsBroadcasting(false);
      setAttemptsLeft(prev => {
          const newAttempts = prev !== null ? prev - 1 : 0;
          sessionStorage.setItem('razor_session_attempts', String(newAttempts));
          return newAttempts;
      });
      randomizeAllRows();
  }, [randomizeAllRows]);


  const handleReset = () => {
    setRows(INITIAL_ROWS);
    setHasStarted(false);
  };

  useEffect(() => {
    if (hasStarted && attemptsLeft !== null && attemptsLeft <= 0) {
        alert("You have no attempts left. You will be logged out.");
        const keyId = sessionStorage.getItem('razor_key_id');
        if (keyId) {
            const passwordRef = ref(database, `passwords/${keyId}`);
            remove(passwordRef).catch(err => console.error("Failed to remove key on attempt depletion:", err));
        }
        sessionStorage.clear();
        router.push('/b16');
    }
  }, [attemptsLeft, hasStarted, router]);

  if (!isClient || attemptsLeft === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <KillSwitch pageName="b16">
      <style jsx global>{`
        :root{
          --bg-gif-url: url('https://prodigits.co.uk/pthumbs/screensavers/down/abstract/bluematrix_z15aaw35.gif');
        }
        body {
          background: var(--bg-gif-url) center/cover fixed no-repeat;
        }
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          z-index: -1;
        }
        .neon-button {
            transition: all 0.3s ease;
            box-shadow: 0 0 5px var(--neon-blue-shadow);
        }
        .neon-button:hover {
            box-shadow: 0 0 10px var(--neon-blue), 0 0 20px var(--neon-blue), 0 0 30px var(--neon-blue);
        }
        .neon-button:active {
            transform: translateY(2px);
        }
      `}</style>
      <main className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
            <header className="text-center">
                <h1 className="text-4xl font-bold text-blue-400 text-glow-blue">B16 VIP</h1>
            </header>

            <div className="text-center bg-black/50 backdrop-blur-md p-2 rounded-2xl border border-blue-500/20">
              <p className="text-xs text-gray-400">Attempts Left</p>
              <p className="text-2xl font-bold text-white">{attemptsLeft}</p>
            </div>

            <div id="galleryContainer" className="space-y-4">
                {rows.slice().reverse().map((row, index) => {
                  const originalIndex = rows.length - 1 - index;
                  return (
                    <GalleryRow 
                      key={originalIndex} 
                      row={row} 
                      onRowClick={() => {
                        if (!hasStarted) return;
                        setRows(current => {
                            const newRows = [...current];
                            const oldSeq = newRows[originalIndex].seq.split('');
                            const currentGoodIndex = oldSeq.indexOf('+');
                            let newGoodIndex = Math.floor(Math.random() * 5);
                            while (newGoodIndex === currentGoodIndex) {
                                newGoodIndex = Math.floor(Math.random() * 5);
                            }
                            const newSeq = ['-', '-', '-', '-', '-'];
                            newSeq[newGoodIndex] = '+';
                            newRows[originalIndex].seq = newSeq.join('');
                            return newRows;
                        });
                      }}
                    />
                  );
                })}
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <button 
                  className="px-8 py-3 bg-gray-700/50 border border-gray-600 text-white font-semibold rounded-full hover:bg-gray-600/70 transition-all duration-300 transform active:scale-95 disabled:opacity-50 neon-button"
                  style={{'--neon-blue': '#888', '--neon-blue-shadow': 'rgba(136,136,136,0.5)'} as React.CSSProperties}
                  onClick={handleReset}
                  disabled={isBroadcasting}
                >
                  Reset
                </button>
                <button 
                  className="px-10 py-3 bg-blue-600/80 border border-blue-500 text-white font-bold rounded-full hover:bg-blue-700/90 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed neon-button"
                  style={{'--neon-blue': 'hsl(210, 100%, 50%)', '--neon-blue-shadow': 'rgba(59, 130, 246, 0.5)'} as React.CSSProperties}
                  onClick={handleStart}
                  disabled={isBroadcasting || (hasStarted && attemptsLeft <= 0)}
                >
                  {isBroadcasting ? '...' : 'Start'}
                </button>
            </div>
        </div>
      </main>
      {isBroadcasting && <BroadcastOverlay onComplete={onBroadcastComplete} />}
    </KillSwitch>
  );
}

export default function WelcomePageB16() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="w-12 h-12 animate-spin text-blue-500"/></div>}>
            <WelcomeB16 />
        </Suspense>
    )
}
