
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, runTransaction } from 'firebase/database';
import Image from 'next/image';

// --- Constants ---
const GOOD_APPLE_URL = "https://iili.io/f50k5vf.png";
const BAD_APPLE_URL = "https://iili.io/f50v4f9.webp";
const WOOD_URL = "https://iili.io/f50v4f9.webp"; 

const INITIAL_ROWS = [
  {rate:'1.23', seq:'+----'},
  {rate:'1.53', seq:'-+---'},
  {rate:'1.93', seq:'----+'},
  {rate:'2.41', seq:'----+'},
  {rate:'4.02', seq:'--+--'},
  {rate:'6.71', seq:'----+'},
  {rate:'11.18', seq:'+----'}
];

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
        setTimeout(onComplete, 500);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="broadcast-overlay">
      <div className="spinner"></div>
      <div style={{ fontSize: '18px', marginBottom: '8px' }}>{message}</div>
    </div>
  );
};


const GalleryRow = ({ row, onRowClick, initialLoad }: { row: RowData, onRowClick: () => void, initialLoad: boolean }) => {
  return (
    <div style={{ position: 'relative', marginTop: '6px' }} onClick={onRowClick}>
      <div className="row-label">{row.rate} ×</div>
      <div className="gallery-row">
        {(initialLoad ? "     " : row.seq).split('').map((char, index) => (
          <div key={index} className="cell">
            <Image
              src={initialLoad ? WOOD_URL : (char === '+' ? GOOD_APPLE_URL : BAD_APPLE_URL)}
              alt="apple"
              width={60}
              height={60}
              className="cell-image"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Main Component ---
function WelcomeB16() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [rows, setRows] = useState<RowData[]>(INITIAL_ROWS);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    const storedAttempts = sessionStorage.getItem('razor_session_attempts');
    const storedKeyId = sessionStorage.getItem('razor_key_id');

    if (!storedAttempts || !storedKeyId) {
      router.push('/b16');
      return;
    }
    
    setAttemptsLeft(parseInt(storedAttempts, 10));
    setKeyId(storedKeyId);
  }, [router]);

  // --- Core Logic ---
  const randomizeSingleRow = (rowIndex: number) => {
     if (initialLoad) return;
    setRows(currentRows => {
      const newRows = [...currentRows];
      const rowToUpdate = { ...newRows[rowIndex] };
      const seq = rowToUpdate.seq.split('');
      const currentGoodIndex = seq.indexOf('+');
      
      let newGoodIndex = Math.floor(Math.random() * 5);
      while (newGoodIndex === currentGoodIndex) {
        newGoodIndex = Math.floor(Math.random() * 5);
      }

      const newSeq = ['-', '-', '-', '-', '-'];
      newSeq[newGoodIndex] = '+';
      rowToUpdate.seq = newSeq.join('');
      newRows[rowIndex] = rowToUpdate;
      return newRows;
    });
  };

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

  const handleStart = async () => {
    if (attemptsLeft === null || attemptsLeft <= 0 || !keyId) {
      alert("No attempts left or invalid key.");
      router.push('/b16');
      return;
    }

    setIsBroadcasting(true);
    // This is a local decrement for the current session.
    // The database `uses` field is handled at login.
    setAttemptsLeft(attemptsLeft - 1); 
  };
  
  const onBroadcastComplete = useCallback(() => {
      setIsBroadcasting(false);
      setInitialLoad(false);
      randomizeAllRows();
      if (attemptsLeft !== null && attemptsLeft -1 < 0) { // Check if attempts will be zero or less
        setTimeout(() => {
            alert("No attempts left. You will be logged out.");
            sessionStorage.clear();
            router.push('/b16');
        }, 1000);
      }
  }, [randomizeAllRows, attemptsLeft, router]);


  const handleReset = () => {
    setRows(INITIAL_ROWS);
    setInitialLoad(true);
  };
  

  if (!isClient || attemptsLeft === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        :root{
          --primary:#4ea3ff;
          --muted:#8fb6da;
          --bg-gif-url: url('https://prodigits.co.uk/pthumbs/screensavers/down/abstract/bluematrix_z15aaw35.gif');
        }
        html,body{height:100%;margin:0;padding:0;font-family: 'Poppins', sans-serif;background:var(--bg-gif-url) center/cover fixed no-repeat;color:var(--primary);-webkit-font-smoothing:antialiased;}
        body::before{content:'';position:fixed;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.48), rgba(0,0,0,0.48));pointer-events:none;z-index:0}
        .app{position:relative;z-index:2;min-h-screen;display:flex;align-items:center;justify-content:center;padding:12px 10px;box-sizing:border-box}
        .card{width:100%;max-width:980px;background:linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.5));border-radius:14px;padding:14px;border:1px solid rgba(78,163,255,0.08);box-shadow:0 18px 40px rgba(0,0,0,0.65);box-sizing:border-box}
        h1{color:var(--primary);text-align:center;margin:0 0 8px;font-weight:700; font-family: 'Audiowide', cursive;}
        .subtitle{ text-align: center; color: var(--muted); font-size: 0.9rem; margin-top: -5px; margin-bottom: 15px;}
        .gallery-row{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;align-items:center;justify-items:center;padding:4px 0;cursor:pointer}
        .row-label{width:100%;text-align:left;padding-left:8px;font-size:13px;color:var(--muted);margin-bottom:4px}
        .cell{background:transparent;border:none;height:auto;display:flex;align-items:center;justify-content:center;padding:0}
        .cell-image { transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .34s;border-radius:6px; }
        .controls{display:flex;flex-wrap: wrap; gap:10px;justify-content:center;margin-top:12px}
        .btn{padding:9px 14px;border-radius:10px;border:1px solid rgba(78,163,255,0.09);background:transparent;color:#dff7ff;font-weight:600;cursor:pointer;transition:transform .12s ease, box-shadow .12s}
        .btn.primary{background:linear-gradient(90deg, rgba(78,163,255,0.12), rgba(78,163,255,0.06));padding:10px 16px}
        .btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(78,163,255,0.06)}
        .broadcast-overlay{position:fixed;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.86), rgba(0,0,0,0.8));z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;text-align:center;padding:20px}
        .spinner{width:64px;height:64px;border-radius:50%;border:8px solid rgba(255,255,255,0.06);border-top-color:var(--primary);animation:spin 1s linear infinite;margin-bottom:12px}
        .attempts-counter { text-align: center; margin-bottom: 1rem; font-weight: 600; color: var(--muted); }
        .attempts-counter span { color: #fff; font-weight: 700; }
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width:420px){.card{padding:12px}.gallery-row{gap:4px}}
      `}</style>

      <main className="app">
        <div className="card">
            <div className="centered-heading">
                <h1 data-text="B16 VIP">B16 VIP</h1>
            </div>
            
            <div className="attempts-counter">
              Attempts Left: <span>{attemptsLeft}</span>
            </div>

            <div id="galleryContainer">
                {rows.slice().reverse().map((row, index) => {
                  const originalIndex = rows.length - 1 - index;
                  return (
                    <GalleryRow 
                      key={originalIndex} 
                      row={row} 
                      onRowClick={() => randomizeSingleRow(originalIndex)} 
                      initialLoad={initialLoad}
                    />
                  );
                })}
            </div>

            <div className="controls">
                <button className="btn" onClick={handleReset}>Reset</button>
                <button className="btn primary" onClick={handleStart} disabled={isBroadcasting || attemptsLeft <= 0}>
                  {isBroadcasting ? '...' : 'Start'}
                </button>
            </div>
        </div>
      </main>
      {isBroadcasting && <BroadcastOverlay onComplete={onBroadcastComplete} />}
    </>
  );
}

export default function WelcomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="spinner"></div></div>}>
            <WelcomeB16 />
        </Suspense>
    )
}
