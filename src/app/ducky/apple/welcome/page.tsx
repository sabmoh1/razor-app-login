"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, update, remove } from 'firebase/database';
import { Loader2, ArrowLeft, ArrowRight, RotateCw, User, ShieldAlert, Wifi, Power } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import KillSwitch from '@/components/kill-switch';
import { motion, AnimatePresence } from 'framer-motion';

const PROXY_URL = 'https://razorhacks.kesug.com/data.php';
const multipliers = ['1.23', '1.54', '1.93', '2.41', '4.82', '6.71', '11.18', '27.97', '69.93', '349.68'];
const goodAppleImg = 'https://razorhacks.kesug.com/IMG/razorgood.png';
const badAppleImg = 'https://razorhacks.kesug.com/IMG/razorbad.png';
const defaultAppleImg = 'https://razorhacks.kesug.com/IMG/razorwood.png';

interface UserAuth {
    userId: string;
    userKey: string;
    attempts: number;
    uses: number;
    dbKeyId: string;
}

const Toast = ({ message, onDismiss, variant }: { message: string | null; onDismiss: () => void; variant: 'default' | 'destructive' }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onDismiss, 4000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;

    return (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-5 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 font-bold ${variant === 'destructive' ? 'bg-red-600 shadow-red-500/50' : 'bg-green-600 shadow-green-500/50'}`}
        >
          <ShieldAlert size={20}/>
          <span>{message}</span>
        </motion.div>
    );
};

function AppleWelcomeContent() {
    const router = useRouter();
    const [userAuth, setUserAuth] = useState<UserAuth | null>(null);
    const [gridData, setGridData] = useState<number[][]>([]);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [toast, setToast] = useState<{message: string | null, variant: 'default' | 'destructive'}>({message: null, variant: 'default'});
    const [lastRan, setLastRan] = useState('start');

    const showToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
        setToast({ message, variant });
    };

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('ducky_apple_auth');
        router.push('/ducky/apple');
    }, [router]);

    useEffect(() => {
        const storedAuth = sessionStorage.getItem('ducky_apple_auth');
        if (!storedAuth) {
            router.push('/ducky/apple');
            return;
        }
        setUserAuth(JSON.parse(storedAuth));
    }, [router]);
    
    const handleFetchData = useCallback(async (isRestart: boolean) => {
        if (!userAuth) return;

        if (isRestart && userAuth.attempts <= 0) {
            showToast("لقد استهلكت جميع محاولاتك.", "destructive");
            if (userAuth.uses <= 1) {
                const keyRef = ref(database, `passwords/${userAuth.dbKeyId}`);
                await remove(keyRef).catch(err => console.error("Failed to remove key on depletion:", err));
            }
            setTimeout(handleLogout, 2000);
            return;
        }
        
        setIsLoading(true);
        updateUI(); 

        let authDataForRequest = { ...userAuth };

        if (isRestart) {
            const newAttempts = userAuth.attempts - 1;
            authDataForRequest.attempts = newAttempts;

            const updates: { [key: string]: any } = {};
            updates[`/passwords/${userAuth.dbKeyId}/attemps`] = newAttempts;
            updates[`/passwords/${userAuth.dbKeyId}/attempts`] = newAttempts;
            
            try {
                await update(ref(database), updates);
            } catch (dbError) {
                console.error("Firebase update failed:", dbError);
                showToast("فشل تحديث المحاولات في قاعدة البيانات.", "destructive");
                setIsLoading(false);
                updateUI();
                return;
            }
        }

        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    id: userAuth.userId,
                    ran: 'start',
                }),
            });
            
            const data = await response.json();

            if (data.success && data.AP && Array.isArray(data.AP)) {
                setGridData(data.AP.map((row: any[]) => row.slice(0, 5)));
                setCurrentRowIndex(0);
                if (!gameStarted) setGameStarted(true);
                if (data.RAN) setLastRan(data.RAN);
                
                setUserAuth(authDataForRequest);
                sessionStorage.setItem('ducky_apple_auth', JSON.stringify(authDataForRequest));

                if(isRestart) showToast("تم تحديث الشبكة بنجاح!", "default");
            } else {
                throw new Error(data.message || 'بيانات غير متوقعة من الخادم.');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            showToast(err.message || 'حدث خطأ في الاتصال بالخادم.', 'destructive');
            if (isRestart) {
                // Revert if fetch fails
                sessionStorage.setItem('ducky_apple_auth', JSON.stringify(userAuth));
                setUserAuth(userAuth);
            }
        } finally {
            setIsLoading(false);
            updateUI(); 
            if (isRestart && authDataForRequest.attempts <= 0) {
                 setTimeout(async () => {
                    showToast("انتهت المحاولات. سيتم تسجيل خروجك.", "destructive");
                    if (authDataForRequest.uses <= 1) {
                         const keyRef = ref(database, `passwords/${authDataForRequest.dbKeyId}`);
                         await remove(keyRef).catch(err => console.error("Failed to remove key on final depletion:", err));
                    }
                    setTimeout(handleLogout, 2000);
                }, 1000);
            }
        }
    }, [userAuth, gameStarted, handleLogout]);

    const updateUI = useCallback(() => {
      // This function is now just a placeholder, as React handles UI updates.
      // We call it to trigger re-renders if needed, though state updates should suffice.
    }, []);

    const getAppleImage = (value: number | null) => {
        if (value === 1) return goodAppleImg;
        if (value === 0) return badAppleImg;
        return defaultAppleImg;
    };
    
    if (!userAuth) {
        return (
             <div className="min-h-screen bg-[#05080d] flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
            </div>
        );
    }
    
    const currentRowData = gameStarted && gridData.length > 0 ? gridData[currentRowIndex] : Array(5).fill(null);
    const currentMultiplier = gameStarted && gridData.length > 0 ? multipliers[currentRowIndex] : 'Ducky DZ';
    const displayRowNumber = gameStarted && gridData.length > 0 ? currentRowIndex + 1 : 0;
    const totalRows = gridData.length;

    return (
      <KillSwitch pageName="ducky">
        <>
            <Head>
                <title>DUCKY DZ | Apple Predictor</title>
            </Head>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Orbitron:wght@900&display=swap');
                :root { 
                  --bg-dark: #05080d; 
                  --primary: #FFB020; 
                  --primary-glow: rgba(255, 176, 32, 0.5); 
                  --border-color: rgba(255, 176, 32, 0.2); 
                  --border-hover: rgba(255, 176, 32, 0.6);
                }
                body { background-color: var(--bg-dark); color: #e0e0e0; font-family: 'Chakra Petch', sans-serif; }
                .cyber-grid-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: 
                    linear-gradient(var(--border-color) 1px, transparent 1px), 
                    linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
                    background-size: 50px 50px; opacity: 0.1; animation: pan-grid 90s linear infinite; }
                @keyframes pan-grid { from { background-position: 0 0; } to { background-position: 500px 500px; } }
                .content-wrapper { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 2rem 1rem; }
                .panel { background: #0c111a; border: 2px solid var(--border-color); border-radius: 1rem; padding: 1.5rem; width: 100%; max-width: 420px; box-shadow: 0 0 40px var(--primary-glow); }
                .title { font-family: 'Orbitron', sans-serif; font-size: 2rem; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow); }
                .hud-header { background: rgba(0,0,0,0.4); border-bottom: 2px solid var(--border-color); padding: 1rem; border-top-left-radius: 1rem; border-top-right-radius: 1rem; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%); }
                .multiplier-display { font-family: 'Orbitron', sans-serif; font-size: 3.5rem; color: var(--primary); text-shadow: 0 0 20px var(--primary-glow); }
                .grid-container { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
                .grid-cell { aspect-ratio: 1/1; position: relative; background: rgba(0,0,0,0.5); border-radius: 12px; border: 2px solid var(--border-color); overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .grid-cell:hover { transform: scale(1.1); box-shadow: 0 0 15px var(--primary-glow); }
                .grid-cell img { transition: transform 0.3s ease; }
                .grid-cell:hover img { transform: scale(1.2); }
                .controls-footer { background: rgba(0,0,0,0.4); border-top: 2px solid var(--border-color); padding: 1rem; border-bottom-left-radius: 1rem; border-bottom-right-radius: 1rem; clip-path: polygon(15px 0, 100% 0, 100% 100%, 0 100%, 0 15px); }
                .control-button { background: transparent; border: 2px solid var(--border-hover); color: var(--primary); border-radius: 8px; transition: all 0.3s ease; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%); }
                .control-button:hover:not(:disabled) { background: var(--primary); color: #000; box-shadow: 0 0 15px var(--primary-glow); }
                .control-button:disabled { opacity: 0.4; cursor: not-allowed; border-color: var(--border-color); }
                .control-button span { font-weight: 700; font-size: 1.1rem; }
            `}</style>
            
            <AnimatePresence>
                {toast.message && <Toast message={toast.message} onDismiss={() => setToast({message: null, variant: 'default'})} variant={toast.variant} />}
            </AnimatePresence>

            <div className="cyber-grid-bg"></div>
            <div className="content-wrapper">
                <header className="w-full max-w-md text-center">
                    <h1 className="title">DUCKY DZ</h1>
                </header>

                <main className="w-full max-w-md flex flex-col gap-6">
                    <div className="panel">
                      <div className="hud-header mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2"><User size={18} /><span className="font-mono text-sm">{userAuth.userId}</span></div>
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-lg text-[var(--primary)]">{userAuth.attempts}</span>
                             <Wifi size={18} />
                           </div>
                        </div>
                      </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentRowIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center p-4"
                          >
                            <div className="multiplier-display mb-4">{gameStarted ? `x${currentMultiplier}` : 'DUCKY DZ'}</div>
                            <div className="grid-container mb-4">
                                {[...currentRowData].reverse().map((cellValue, index) => (
                                    <div key={index} className="grid-cell">
                                        <Image src={getAppleImage(cellValue)} alt="Apple" layout="fill" objectFit="cover" unoptimized />
                                    </div>
                                ))}
                            </div>
                            <p className="font-semibold text-gray-300 mt-2">{gameStarted ? `الصف: ${displayRowNumber} / ${totalRows}` : 'اضغط على "بدء" لعرض التوقعات'}</p>
                          </motion.div>
                        </AnimatePresence>
                        <div className="controls-footer mt-4">
                          <div className="grid grid-cols-3 gap-3">
                              <button className="control-button p-3" disabled={isLoading || !gameStarted || currentRowIndex <= 0} onClick={() => setCurrentRowIndex(i => i - 1)}>
                                  <ArrowLeft />
                              </button>
                              <button className="control-button p-3 text-lg" disabled={isLoading} onClick={() => handleFetchData(gameStarted)}>
                                  {isLoading ? <Loader2 className="animate-spin mx-auto"/> : (<span>{gameStarted ? 'إعادة' : 'بدء'}</span>)}
                              </button>
                              <button className="control-button p-3" disabled={isLoading || !gameStarted || currentRowIndex >= totalRows - 1} onClick={() => setCurrentRowIndex(i => i + 1)}>
                                  <ArrowRight />
                              </button>
                          </div>
                        </div>
                    </div>
                </main>

                <footer className="w-full max-w-md text-center">
                    <a href="https://t.me/duckyoffi" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary transition-colors">
                        Telegram: @duckyoffi
                    </a>
                </footer>
            </div>
        </>
      </KillSwitch>
    );
}

export default function DuckyAppleWelcomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#05080d] flex items-center justify-center"><Loader2 className="w-16 h-16 text-yellow-400 animate-spin" /></div>}>
            <AppleWelcomeContent />
        </Suspense>
    );
}
