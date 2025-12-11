
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, runTransaction, remove } from 'firebase/database';
import Image from 'next/image';

// --- Constants ---
const GOOD_APPLE_URL = "https://iili.io/f50k5vf.png";
const BAD_APPLE_URL = "https://iili.io/f50v4f9.webp";
const WOOD_URL = "https://iili.io/f50v4f9.webp"; // Using bad apple as wood for now

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
const BroadcastOverlay = () => (
  <div className="broadcast-overlay">
    <div className="spinner"></div>
    <div style={{ fontSize: '18px', marginBottom: '8px' }}>Broadcasting...</div>
  </div>
);

const GalleryRow = ({ row, onRowClick }: { row: RowData, onRowClick: () => void }) => {
  return (
    <div style={{ position: 'relative', marginTop: '6px' }} onClick={onRowClick}>
      <div className="row-label">{row.rate} ×</div>
      <div className="gallery-row">
        {row.seq.split('').map((char, index) => (
          <div key={index} className="cell">
            <Image
              src={char === '+' ? GOOD_APPLE_URL : BAD_APPLE_URL}
              alt="apple"
              width={80}
              height={80}
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

    const keyRef = ref(database, `passwords/${keyId}`);

    try {
        await runTransaction(keyRef, (currentData) => {
            if (currentData) {
                if (currentData.uses > 1) {
                    currentData.uses -= 1;
                } else {
                    // If last use, set to null to be removed
                    return null;
                }
            }
            return currentData;
        });

        const newAttempts = attemptsLeft - 1;
        setAttemptsLeft(newAttempts);
        sessionStorage.setItem('razor_session_attempts', String(newAttempts));
        
        randomizeAllRows();

    } catch (error) {
        console.error("Transaction failed: ", error);
        alert("An error occurred. Please try again.");
    } finally {
        setTimeout(() => {
            setIsBroadcasting(false);
            if (attemptsLeft - 1 <= 0) {
              alert("No attempts left. You will be logged out.");
              sessionStorage.clear();
              router.push('/b16');
            }
        }, 1500);
    }
  };

  const handleReset = () => {
    setRows(INITIAL_ROWS);
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
        .gallery-row{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;align-items:center;justify-items:center;padding:6px 0;cursor:pointer}
        .row-label{width:100%;text-align:left;padding-left:8px;font-size:13px;color:var(--muted);margin-bottom:6px}
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
                <p className="subtitle">اضغط على أي سطر (أو زر "عشوائي") لوضع التفاحة الصحيحة في مكان عشوائي — في كل مرة.</p>
            </div>
            
            <div className="attempts-counter">
              المحاولات المتبقية: <span>{attemptsLeft}</span>
            </div>

            <div id="galleryContainer">
                {rows.slice().reverse().map((row, index) => {
                  const originalIndex = rows.length - 1 - index;
                  return (
                    <GalleryRow 
                      key={originalIndex} 
                      row={row} 
                      onRowClick={() => randomizeSingleRow(originalIndex)} 
                    />
                  );
                })}
            </div>

            <div className="controls">
                <button className="btn" onClick={handleReset}>إعادة تعيين</button>
                <button className="btn" onClick={randomizeAllRows}>عشوائي (كل الأسطر)</button>
                <button className="btn primary" onClick={handleStart} disabled={isBroadcasting}>
                  {isBroadcasting ? '...' : 'عرض/تشغيل'}
                </button>
            </div>
        </div>
      </main>
      {isBroadcasting && <BroadcastOverlay />}
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
