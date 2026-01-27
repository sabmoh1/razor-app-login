
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, update, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';
import Image from 'next/image';
import axios from 'axios';
import KillSwitch from '@/components/kill-switch';

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

const Toast = ({ message, variant, onDismiss }: { message: string | null; variant: string; onDismiss: () => void }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onDismiss, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    if (!message) return null;

    return (
        <div className={`toast show ${variant === 'destructive' ? 'destructive' : ''}`}>
            {message}
        </div>
    );
};

function AppleWelcomeContent() {
    const router = useRouter();
    const [userAuth, setUserAuth] = useState<UserAuth | null>(null);
    const [lastRan, setLastRan] = useState('start');
    const [gridData, setGridData] = useState<number[][]>([]);
    const [currentRowIndex, setCurrentRowIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [toast, setToast] = useState<{ message: string; variant: string } | null>(null);

    useEffect(() => {
        const storedAuth = sessionStorage.getItem('ducky_apple_auth');
        if (!storedAuth) {
            router.push('/ducky/apple');
            return;
        }
        setUserAuth(JSON.parse(storedAuth));
    }, [router]);

    const showToast = (message: string, variant = 'default') => {
        setToast({ message, variant });
    };

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('ducky_apple_auth');
        router.push('/ducky/apple');
    }, [router]);

    const handleFetchData = useCallback(async (isRestart: boolean) => {
        if (!userAuth) return;

        if (userAuth.attempts <= 0) {
            showToast("لقد استهلكت جميع محاولاتك.", "destructive");
             if (userAuth.uses <= 1) {
                const keyRef = ref(database, `passwords/${userAuth.dbKeyId}`);
                await remove(keyRef).catch(err => console.error("Failed to remove key:", err));
            }
            setTimeout(handleLogout, 2000);
            return;
        }

        setIsLoading(true);

        let updatedAuth = { ...userAuth };

        if (isRestart) {
            updatedAuth.attempts--;
            setUserAuth(updatedAuth);
            sessionStorage.setItem('ducky_apple_auth', JSON.stringify(updatedAuth));
            
            const updates: { [key: string]: any } = {};
            updates[`/passwords/${userAuth.dbKeyId}/attemps`] = updatedAuth.attempts;
            updates[`/passwords/${userAuth.dbKeyId}/attempts`] = updatedAuth.attempts;

            try {
                await update(ref(database), updates);
            } catch (error) {
                console.error("Failed to update attempts in Firebase: ", error);
                showToast("فشل تحديث عدد المحاولات.", "destructive");
                setIsLoading(false);
                return;
            }
        }

        try {
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
                if (data.RAN) {
                    setLastRan(data.RAN);
                }
                if (data.message) {
                    showToast(data.message);
                }
            } else {
                throw new Error(data.message || 'بيانات غير متوقعة من الخادم.');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            showToast(err.message || 'حدث خطأ في الاتصال بالخادم.', "destructive");
        } finally {
            setIsLoading(false);
            if (updatedAuth.attempts <= 0 && isRestart) {
                showToast("انتهت المحاولات. سيتم تسجيل خروجك.", "destructive");
                 if (updatedAuth.uses <= 1) {
                    const keyRef = ref(database, `passwords/${updatedAuth.dbKeyId}`);
                    await remove(keyRef).catch(err => console.error("Failed to remove key:", err));
                }
                setTimeout(handleLogout, 2000);
            }
        }
    }, [userAuth, lastRan, handleLogout]);

    useEffect(() => {
        const canvas = document.getElementById('fire-canvas') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        if (!ctx) return;
        let particles: any[] = [];

        function resizeCanvas() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            x: number; y: number; size: number; speedY: number; speedX: number; life: number; maxLife: number; color: string;
            constructor() {
                this.x = Math.random() * canvas.width; this.y = canvas.height + 20; this.size = Math.random() * 10 + 4; this.speedY = -Math.random() * 2.5 - 0.8; this.speedX = (Math.random() - 0.5) * 1.5; this.life = 0; this.maxLife = Math.random() * 50 + 50; this.color = `hsl(${35 + Math.random() * 20}, 100%, ${55 + Math.random() * 25}%)`;
            }
            update() { this.y += this.speedY; this.x += this.speedX; this.speedY *= 0.98; this.life++; this.size *= 0.98; }
            draw() {
                if(!ctx) return;
                const alpha = 1 - this.life / this.maxLife; ctx.globalAlpha = alpha; ctx.fillStyle = this.color; ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            }
        }

        function createFire() { if (particles.length < 50) { for (let i = 0; i < 2; i++) particles.push(new Particle()); } }
        
        let animationFrameId: number;
        function animateFire() {
            if (!ctx) return;
            ctx.fillStyle = 'rgba(10, 10, 26, 0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height); createFire();
            particles = particles.filter(p => { p.update(); p.draw(); return p.life <= p.maxLife && p.y > -20; });
            animationFrameId = requestAnimationFrame(animateFire);
        }
        animateFire();
        return () => { window.removeEventListener('resize', resizeCanvas); cancelAnimationFrame(animationFrameId); };
    }, []);

    const getAppleImage = (value: number | null) => {
        if (value === 1) return goodAppleImg;
        if (value === 0) return badAppleImg;
        return defaultAppleImg;
    };
    
    if (!userAuth) {
        return (
             <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            </div>
        )
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
                 :root { --background: 228 50% 3%; --foreground: 45 90% 98%; --primary: 38 92% 50%; --border: 38 92% 30%; --radius: 1.2rem; }
                 * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                 html { height: 100%; }
                 body { background-color: #0a0a1a; color: hsl(var(--foreground)); min-height: 100dvh; overflow-x: hidden; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; }
                 canvas { will-change: transform; image-rendering: -webkit-optimize-contrast; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
                 .content-wrapper { position: relative; z-index: 1; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: max(2rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom)); gap: 1.5rem; width: 100%; overflow-y: auto; }
                 .main-content { width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
                 header { text-align: center; }
                 .ducky-title { font-size: clamp(2rem, 10vw, 2.5rem); font-weight: 900; letter-spacing: 0.15rem; color: white; text-transform: uppercase; background: rgba(0, 0, 0, 0.6); padding: 0.8rem 1.5rem; border-radius: var(--radius); backdrop-filter: blur(12px); box-shadow: 0 0 1.5rem rgba(255, 176, 32, 0.8), 0 0 3rem rgba(255, 149, 0, 0.6); text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(38 92% 50%)); animation: glow-pulse 2s infinite alternate; }
                 .duck-main { display: block; margin: 1rem auto 0; width: clamp(80px, 25vw, 120px); height: auto; filter: drop-shadow(0 0 1rem #FFB020); animation: float 3s infinite ease-in-out; }
                 .input-card { background: linear-gradient(145deg, #111, #1a1a1a); border: 2px solid hsl(var(--border)); border-radius: var(--radius); padding: 1.5rem; width: 100%; text-align: center; position: relative; overflow: hidden; box-shadow: 0 0 1.5rem rgba(255, 176, 32, 0.5), 0 0 3rem rgba(255, 149, 0, 0.3); transition: all 0.4s ease; }
                 .card-title { font-size: clamp(1.1rem, 4.5vw, 1.375rem); font-weight: bold; color: hsl(var(--primary)); margin-bottom: 0.8rem; text-shadow: 0 0 0.6rem hsl(var(--primary)); position: relative; z-index: 1; }
                 .user-info-field { width: 100%; padding: 1rem; background: #111; border: 2px solid #FFB020; box-shadow: 0 0 1rem rgba(255, 176, 32, 0.6); border-radius: calc(var(--radius) - 4px); color: #fff; font-size: 1rem; text-align: center; position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; }
                 .control-button { background: linear-gradient(135deg, #FFB020, #FF9500); color: black; border: 2px solid hsl(var(--primary)); padding: 0.8rem 1.5rem; font-size: 1.1rem; font-weight: bold; border-radius: 3rem; cursor: pointer; box-shadow: 0 0 1.5rem rgba(255, 149, 0, 0.7); transition: all 0.4s; position: relative; overflow: hidden; z-index: 1; min-height: 3.5rem; touch-action: manipulation; flex-grow: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                 .control-button:disabled { opacity: 0.4; pointer-events: none; background: #4a5568; border-color: #718096; box-shadow: none; }
                 .control-button:not(:disabled):hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 0 2rem rgba(255, 149, 0, 1); }
                 .control-button#start-btn { flex-grow: 1.2; font-size: 1.25rem; }
                 .controls-grid { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 0.75rem; width: 100%; }
                 .grid-container { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; width: 100%; }
                 .grid-cell { aspect-ratio: 1/1; position: relative; transition: transform 0.3s ease; border-radius: 0.5rem; overflow: hidden; background-color: rgba(0,0,0,0.3); border: 2px solid transparent; }
                 .grid-cell:hover { transform: scale(1.05); border-color: hsl(var(--primary)); }
                 .grid-cell img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
                 .multiplier { font-size: 2.5rem; font-weight: 900; color: hsl(var(--primary)); text-shadow: 0 0 0.8rem hsl(var(--primary)); }
                 .row-info { font-size: 1.1rem; font-weight: bold; color: rgba(255, 176, 32, 0.8); }
                 .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100%); background: linear-gradient(145deg, #111, #1a1a1a); color: hsl(var(--foreground)); padding: 1rem 1.5rem; border-radius: 1rem; z-index: 1000; opacity: 0; transition: opacity 0.5s, transform 0.5s; box-shadow: 0 0 1.5rem rgba(255, 176, 32, 0.5); border: 2px solid hsl(var(--border)); font-weight: bold; text-shadow: 0 0 0.5rem hsl(var(--primary)); }
                 .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
                 .toast.destructive { background: linear-gradient(145deg, #5c1a1a, #a32a2a); border-color: #ff1a1a; color: white; text-shadow: 0 0 0.5rem #ff0000; box-shadow: 0 0 1.5rem rgba(255, 26, 26, 0.8); }
                 .loader { width: 24px; height: 24px; border: 3px solid #000; border-bottom-color: transparent; border-radius: 50%; display: inline-block; box-sizing: border-box; animation: rotation 1s linear infinite; }
                 @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                 @keyframes glow-pulse { from { text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(38 92% 50%)); } to { text-shadow: 0 0 0.9rem hsl(var(--primary)), 0 0 1.8rem hsl(38 92% 50%), 0 0 2.7rem #FF9500; } }
                 @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            `}</style>

            <canvas id="fire-canvas"></canvas>
            <div className="content-wrapper">
                <div className="main-content">
                    <header>
                        <h1 className="ducky-title">DUCKY DZ</h1>
                        <Image src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="duck-main" alt="Ducky" width={120} height={120} unoptimized />
                    </header>

                    <div className="input-card">
                        <div className="card-title">المُعرّف الخاص بك</div>
                        <div className="user-info-field">
                            <span>{userAuth.userId}</span>
                            <span style={{ fontWeight: 'bold', color: 'hsl(var(--primary))' }}>المحاولات: {userAuth.attempts}</span>
                        </div>
                    </div>

                    <div className="input-card">
                        <div className="relative z-10 flex flex-col gap-4 w-full">
                            <div className="multiplier">{gameStarted ? `x${currentMultiplier}` : 'Ducky DZ'}</div>
                            <div className="grid-container">
                                {currentRowData.map((cellValue, index) => (
                                    <div key={index} className="grid-cell">
                                        <Image src={getAppleImage(cellValue)} alt="Apple" width={64} height={64} unoptimized />
                                    </div>
                                ))}
                            </div>
                            <p className="row-info">{gameStarted ? `الصف: ${displayRowNumber} / ${gridData.length}` : 'اضغط على "بدء" لعرض التوقعات'}</p>
                        </div>
                    </div>

                    <div className="controls-grid">
                        <button id="prev-btn" className="control-button" disabled={isLoading || !gameStarted || currentRowIndex <= 0} onClick={() => setCurrentRowIndex(i => i - 1)}>
                            <span>السابق</span>
                        </button>
                        <button id="start-btn" className="control-button" disabled={isLoading} onClick={() => handleFetchData(gameStarted)}>
                             {isLoading ? <div className="loader"></div> : <span>{gameStarted ? 'إعادة' : 'بدء'}</span>}
                        </button>
                        <button id="next-btn" className="control-button" disabled={isLoading || !gameStarted || currentRowIndex >= gridData.length - 1} onClick={() => setCurrentRowIndex(i => i + 1)}>
                            <span>التالي</span>
                        </button>
                    </div>
                </div>
            </div>
            <Toast message={toast?.message || null} variant={toast?.variant || 'default'} onDismiss={() => setToast(null)} />
        </>
      </KillSwitch>
    );
}

export default function DuckyAppleWelcomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center"><Loader2 className="w-12 h-12 text-yellow-400 animate-spin" /></div>}>
            <AppleWelcomeContent />
        </Suspense>
    );
}
