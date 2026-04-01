
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, update, remove } from 'firebase/database';
import { Loader2, ArrowLeft, ArrowRight, User, ShieldAlert, Power } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import KillSwitch from '@/components/kill-switch';
import { motion, AnimatePresence } from 'framer-motion';

const PROXY_URL = '/api/proxy';
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
            <ShieldAlert size={20} />
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
    const [toast, setToast] = useState<{ message: string | null, variant: 'default' | 'destructive' }>({ message: null, variant: 'default' });
    const [lastRan, setLastRan] = useState('start');

    const showToast = (message: string, variant: 'default' | 'destructive' = 'default') => {
        setToast({ message, variant });
    };

    const handleLogout = useCallback(async () => {
        if (userAuth && userAuth.uses <= 1 && userAuth.attempts <= 0) {
             const keyRef = ref(database, `passwords/${userAuth.dbKeyId}`);
             await remove(keyRef).catch(err => console.error("Failed to remove key on logout:", err));
        }
        sessionStorage.removeItem('ducky_apple_auth');
        router.push('/ducky/apple');
    }, [router, userAuth]);

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
        
        let currentAttempts = userAuth.attempts;
        if (isRestart) {
            if (currentAttempts <= 0) {
                showToast("You have no attempts left.", "destructive");
                handleLogout();
                return;
            }
            currentAttempts--;
        }
        
        setIsLoading(true);

        if(isRestart) {
            const updatedAuth = { ...userAuth, attempts: currentAttempts };
            setUserAuth(updatedAuth);
            sessionStorage.setItem('ducky_apple_auth', JSON.stringify(updatedAuth));
        }
        
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userAuth.userId, ran: isRestart ? 'start' : lastRan }),
            });
            
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || `Server error: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Invalid response format from server.");
            }

            const data = await response.json();

            if (data.success && data.AP && Array.isArray(data.AP)) {
                // Here we apply the reversal fix to correctly align images
                setGridData(data.AP.map((row: any[]) => [...row.slice(0, 5)].reverse()));
                setCurrentRowIndex(0);
                 if (data.RAN) {
                    setLastRan(data.RAN);
                }
                if (!gameStarted) setGameStarted(true);

                if (isRestart) {
                    const updates: { [key: string]: any } = {};
                    updates[`/passwords/${userAuth.dbKeyId}/attemps`] = currentAttempts.toString();
                    updates[`/passwords/${userAuth.dbKeyId}/attempts`] = currentAttempts.toString();
                    await update(ref(database), updates);
                    showToast("Network updated successfully!", "default");
                }
            } else {
                throw new Error(data.message || 'Failed to fetch data.');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            showToast(err.message || 'An error occurred while connecting to the server.', 'destructive');
            if (isRestart) {
                // Revert optimistic update on failure
                setUserAuth(userAuth);
                sessionStorage.setItem('ducky_apple_auth', JSON.stringify(userAuth));
            }
        } finally {
            setIsLoading(false);
            if (isRestart && currentAttempts <= 0) {
                 setTimeout(() => {
                    showToast("No attempts left. You will be logged out.", "destructive");
                    handleLogout();
                }, 2000);
            }
        }
    }, [userAuth, gameStarted, handleLogout, lastRan]);

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
    const currentMultiplier = gameStarted && gridData.length > 0 ? multipliers[currentRowIndex] : '...';

    return (
      <KillSwitch pageName="ducky">
        <>
            <Head>
                <title>DUCKY DZ | Apple Predictor</title>
            </Head>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Orbitron:wght@900&display=swap');
                body { background: #05080d; font-family: 'Chakra Petch', sans-serif; }
                .cyber-grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,176,32,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,176,32,0.07) 1px, transparent 1px); background-size: 30px 30px; animation: pan-grid 90s linear infinite; z-index: -1; }
                .glassmorphism-panel { background: rgba(12, 17, 26, 0.6); backdrop-filter: blur(20px); border: 2px solid rgba(255,176,32,0.15); box-shadow: 0 0 60px rgba(255,176,32,0.1); }
                .control-button { background: rgba(255,176,32,0.1); border: 2px solid rgba(255,176,32,0.4); color: #FFB020; transition: all 0.3s ease; }
                .control-button:hover:not(:disabled) { background: #FFB020; color: #000; box-shadow: 0 0 20px rgba(255,176,32,0.7); }
                .control-button:disabled { opacity: 0.4; cursor: not-allowed; }
                .start-button { background: linear-gradient(45deg, #FFB020, #FF8C00); color: #000; box-shadow: 0 0 25px rgba(255,176,32,0.7); }
            `}</style>
            
            <AnimatePresence>
                {toast.message && <Toast message={toast.message} onDismiss={() => setToast({message: null, variant: 'default'})} variant={toast.variant} />}
            </AnimatePresence>
            <div className="cyber-grid-bg"></div>

            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-white">
                <main className="w-full max-w-md flex flex-col gap-6">
                    <header className="glassmorphism-panel rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50"><User size={20} className="text-yellow-400" /></div>
                           <div>
                             <p className="text-xs text-gray-400">USER ID</p>
                             <p className="font-bold font-mono text-white">{userAuth.userId}</p>
                           </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">ATTEMPTS</p>
                            <p className="font-bold text-2xl text-yellow-400">{userAuth.attempts}</p>
                        </div>
                    </header>

                    <div className="glassmorphism-panel rounded-3xl p-6 flex flex-col items-center gap-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentRowIndex}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4 }}
                            className="w-full flex flex-col items-center"
                          >
                            <div className="font-orbitron text-5xl font-black text-yellow-400 mb-2" style={{textShadow: '0 0 15px rgba(255,176,32,0.7)'}}>x{currentMultiplier}</div>
                            <p className="text-sm text-gray-400 mb-4">{gameStarted ? `Level: ${currentRowIndex + 1} / ${gridData.length}` : 'Press start to get predictions'}</p>
                            <div className="grid grid-cols-5 gap-2 w-full">
                                {currentRowData.map((cellValue, index) => (
                                    <div key={index} className="aspect-square bg-black/40 rounded-lg border-2 border-yellow-500/20 flex items-center justify-center overflow-hidden">
                                        <Image src={getAppleImage(cellValue)} alt="Apple" width={64} height={64} objectFit="contain" unoptimized />
                                    </div>
                                ))}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button className="control-button rounded-xl p-3 flex justify-center items-center" disabled={isLoading || !gameStarted || currentRowIndex <= 0} onClick={() => setCurrentRowIndex(i => i - 1)}>
                            <ArrowLeft />
                        </button>
                        <button className="control-button start-button rounded-xl p-3 text-lg font-bold flex justify-center items-center gap-2" disabled={isLoading} onClick={() => handleFetchData(gameStarted)}>
                            {isLoading ? <Loader2 className="animate-spin"/> : (gameStarted ? 'Restart' : 'Start')}
                        </button>
                        <button className="control-button rounded-xl p-3 flex justify-center items-center" disabled={isLoading || !gameStarted || currentRowIndex >= gridData.length - 1} onClick={() => setCurrentRowIndex(i => i + 1)}>
                            <ArrowRight />
                        </button>
                    </div>

                    <button onClick={handleLogout} className="w-full text-center text-xs text-red-400/70 hover:text-red-400 py-2 transition-colors flex items-center justify-center gap-2">
                        <Power size={14}/> Logout
                    </button>
                </main>
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
