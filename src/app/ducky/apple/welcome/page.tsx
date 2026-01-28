
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, update, remove } from 'firebase/database';
import { Loader2, ArrowLeft, ArrowRight, RotateCw, User, ShieldAlert } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import axios from 'axios';
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

const Toast = ({ message, onDismiss }: { message: string | null; onDismiss: () => void }) => {
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
          className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-red-500/50 z-50 flex items-center gap-2"
        >
          <ShieldAlert size={20}/>
          <span className="font-bold">{message}</span>
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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [lastRan, setLastRan] = useState('start');

    useEffect(() => {
        const storedAuth = sessionStorage.getItem('ducky_apple_auth');
        if (!storedAuth) {
            router.push('/ducky/apple');
            return;
        }
        setUserAuth(JSON.parse(storedAuth));
    }, [router]);
    
    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('ducky_apple_auth');
        router.push('/ducky/apple');
    }, [router]);

    const handleFetchData = useCallback(async (isRestart: boolean) => {
        if (!userAuth) return;

        if (isRestart && userAuth.attempts <= 0) {
            showToast("لقد استهلكت جميع محاولاتك.");
            setTimeout(handleLogout, 2000);
            return;
        }
        
        setIsLoading(true);

        // Optimistically update attempts for restarts
        if (isRestart) {
            setUserAuth(prev => prev ? ({ ...prev, attempts: prev.attempts - 1 }) : null);
        }

        try {
            if (isRestart) {
                const updatedAttempts = userAuth.attempts - 1;
                const updates: { [key: string]: any } = {};
                updates[`/passwords/${userAuth.dbKeyId}/attemps`] = updatedAttempts;
                updates[`/passwords/${userAuth.dbKeyId}/attempts`] = updatedAttempts;
                await update(ref(database), updates);
                sessionStorage.setItem('ducky_apple_auth', JSON.stringify({ ...userAuth, attempts: updatedAttempts }));

                 if (updatedAttempts <= 0) {
                    if (userAuth.uses <= 1) {
                       await remove(ref(database, `passwords/${userAuth.dbKeyId}`));
                    }
                }
            }

            const response = await axios.post(PROXY_URL, {
                id: userAuth.userId,
                ran: isRestart ? 'start' : lastRan,
            }, {
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            
            const data = response.data;

            if (data.success && data.AP && Array.isArray(data.AP)) {
                setGridData(data.AP.map((row: any[]) => row.slice(0, 5)));
                setCurrentRowIndex(0);
                setGameStarted(true);
                if (data.RAN) setLastRan(data.RAN);
            } else {
                throw new Error(data.message || 'بيانات غير متوقعة من الخادم.');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            showToast(err.response?.data?.message || err.message || 'حدث خطأ في الاتصال بالخادم.');
             if (isRestart) { // Revert optimistic update on error
                setUserAuth(prev => prev ? ({ ...prev, attempts: prev.attempts + 1 }) : null);
            }
        } finally {
            setIsLoading(false);
            if (isRestart && userAuth && userAuth.attempts - 1 <= 0) {
                 setTimeout(() => {
                    showToast("انتهت المحاولات. سيتم تسجيل خروجك.");
                    setTimeout(handleLogout, 2000);
                }, 1000);
            }
        }
    }, [userAuth, lastRan, handleLogout]);

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

    return (
      <KillSwitch pageName="ducky">
        <>
            <Head>
                <title>DUCKY DZ | Apple Predictor</title>
            </Head>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Orbitron:wght@900&display=swap');
                :root { --bg-dark: #05080d; --primary: #FFB020; --primary-glow: rgba(255, 176, 32, 0.5); --border-color: rgba(255, 176, 32, 0.2); }
                body { background-color: var(--bg-dark); color: #e0e0e0; font-family: 'Chakra Petch', sans-serif; }
                .cyber-grid { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.1; }
                .content-wrapper { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 2rem 1rem; }
                .panel { background: rgba(10, 16, 26, 0.7); backdrop-filter: blur(10px); border: 2px solid var(--border-color); border-radius: 20px; padding: 1.5rem; width: 100%; max-width: 420px; box-shadow: 0 0 30px var(--primary-glow); }
                .title { font-family: 'Orbitron', sans-serif; font-size: 2rem; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow); }
                .hud-item { background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 8px; }
                .multiplier { font-family: 'Orbitron', sans-serif; font-size: 3rem; color: var(--primary); text-shadow: 0 0 15px var(--primary-glow); }
                .grid-container { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
                .grid-cell { aspect-ratio: 1/1; position: relative; background: rgba(0,0,0,0.5); border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden; }
                .grid-cell img { transition: transform 0.3s ease; }
                .grid-cell:hover img { transform: scale(1.1); }
                .control-button { background: transparent; border: 2px solid var(--border-color); color: var(--primary); border-radius: 10px; transition: all 0.3s ease; }
                .control-button:hover:not(:disabled) { background: var(--primary); color: #000; box-shadow: 0 0 15px var(--primary-glow); }
                .control-button:disabled { opacity: 0.4; cursor: not-allowed; }
            `}</style>
            
            <AnimatePresence>
                {toastMessage && <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />}
            </AnimatePresence>
            <div className="cyber-grid"></div>
            <div className="content-wrapper">
                <header className="w-full max-w-md">
                    <div className="flex justify-between items-center hud-item mb-4">
                        <h1 className="title">DUCKY DZ</h1>
                        <div className="text-right">
                            <div className="flex items-center gap-2"><User size={14} /><span className="font-mono">{userAuth.userId}</span></div>
                            <div className="font-bold text-lg text-[var(--primary)]">محاولات: {userAuth.attempts}</div>
                        </div>
                    </div>
                </header>

                <main className="w-full max-w-md flex flex-col gap-6">
                    <div className="panel text-center">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentRowIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="multiplier mb-2">{gameStarted ? `x${currentMultiplier}` : 'Ducky DZ'}</div>
                            <div className="grid-container mb-4">
                                {currentRowData.map((cellValue, index) => (
                                    <div key={index} className="grid-cell">
                                        <Image src={getAppleImage(cellValue)} alt="Apple" layout="fill" objectFit="cover" unoptimized />
                                    </div>
                                ))}
                            </div>
                            <p className="font-semibold text-gray-300">{gameStarted ? `الصف: ${displayRowNumber} / ${gridData.length}` : 'اضغط على "بدء" لعرض التوقعات'}</p>
                          </motion.div>
                        </AnimatePresence>
                    </div>
                </main>

                <footer className="w-full max-w-md mt-4">
                    <div className="grid grid-cols-3 gap-4">
                        <button className="control-button p-4" disabled={isLoading || !gameStarted || currentRowIndex <= 0} onClick={() => setCurrentRowIndex(i => i - 1)}>
                            <ArrowLeft />
                        </button>
                        <button className="control-button p-4 text-xl" disabled={isLoading} onClick={() => handleFetchData(true)}>
                             {isLoading ? <Loader2 className="animate-spin mx-auto"/> : <RotateCw />}
                        </button>
                        <button className="control-button p-4" disabled={isLoading || !gameStarted || currentRowIndex >= gridData.length - 1} onClick={() => setCurrentRowIndex(i => i + 1)}>
                            <ArrowRight />
                        </button>
                    </div>
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
