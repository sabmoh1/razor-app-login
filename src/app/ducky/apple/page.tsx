
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import Head from 'next/head';
import { Loader2, User, KeyRound, CheckCircle, ShieldCheck, Server, AlertTriangle, X } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';
import { cn } from '@/lib/utils';

// Verification Steps Component
const VerificationModal = ({ step, onCancel }: { step: number; onCancel: () => void }) => {
    const steps = [
        { text: "Checking input data...", icon: <User /> },
        { text: "Verifying activation key...", icon: <KeyRound /> },
        { text: "Connecting to secure server...", icon: <Server /> },
        { text: "Login successful!", icon: <ShieldCheck /> }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-gray-900/50 border-2 border-yellow-500/30 rounded-2xl p-6 shadow-2xl shadow-yellow-500/20">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 border-2 border-yellow-500/50 flex items-center justify-center mb-4">
                        {step < steps.length -1 ? 
                            <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" /> : 
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        }
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{steps[step].text}</h3>
                    <div className="flex justify-center gap-2 mt-4">
                        {steps.map((_, index) => (
                            <div key={index} className={cn("w-3 h-3 rounded-full transition-all duration-500", 
                                index < step ? 'bg-green-500' : 
                                index === step ? 'bg-yellow-400 animate-pulse' :
                                'bg-gray-600'
                            )}></div>
                        ))}
                    </div>
                    {step < steps.length - 1 && (
                        <button onClick={onCancel} className="mt-6 text-xs text-gray-400 hover:text-white transition-colors">Cancel</button>
                    )}
                </div>
            </div>
        </div>
    );
};


// Alert Modal Component
const AlertModal = ({ message, onClose }: { message: string | null; onClose: () => void }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-6 text-center shadow-2xl shadow-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-white mb-6">{message}</p>
                <button onClick={onClose} className="px-6 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors">OK</button>
            </div>
        </div>
    );
};


export default function DuckyAppleLoginPage() {
    const router = useRouter();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!userId || !password) {
            setAlertMessage("Please enter both your User ID and your Key.");
            return;
        }
        if (!/^\d{10}$/.test(userId)) {
            setAlertMessage("The ID must be exactly 10 digits.");
            return;
        }

        setIsProcessing(true);
        setProcessingStep(0);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Step 0
            setProcessingStep(1);

            const passwordsRef = ref(database, 'passwords');
            const snapshot = await get(passwordsRef);

            if (!snapshot.exists()) {
                throw new Error("System error: Could not connect to database.");
            }
            
            const allPasswords = snapshot.val();
            let keyFound = false;
            let keyData = null;
            let dbKeyId = null;

            for (const key in allPasswords) {
                // Updated to use 'rz' field
                if (allPasswords[key].rz === password) {
                    keyFound = true;
                    keyData = allPasswords[key];
                    dbKeyId = key;
                    break;
                }
            }

            if (!keyFound) {
                throw new Error("Invalid Key. Please check and try again.");
            }

            if (typeof keyData.attemps === 'undefined' && typeof keyData.attempts === 'undefined') {
                throw new Error("This key is not valid for the Apple game.");
            }

            const attempts = parseInt(keyData.attemps || keyData.attempts, 10);
            if (attempts <= 0) {
                throw new Error("This key has no attempts left.");
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Step 1
            setProcessingStep(2);

            const userAuth = {
                userId: userId,
                userKey: password,
                attempts: attempts,
                uses: keyData.uses || 1,
                dbKeyId: dbKeyId,
            };
            sessionStorage.setItem('ducky_apple_auth', JSON.stringify(userAuth));
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Step 2
            setProcessingStep(3);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Step 3
            router.push('/ducky/apple/welcome');

        } catch (error: any) {
            setIsProcessing(false);
            setAlertMessage(error.message || "An unknown error occurred.");
        }
    };
    
  return (
    <KillSwitch pageName="ducky">
        <Head>
            <title>DUCKY DZ | Apple Game</title>
        </Head>
        <style jsx global>{`
            body { background: #05080d; color: #e0e0e0; font-family: 'Chakra Petch', sans-serif; }
            .cyber-grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,176,32,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,176,32,0.1) 1px, transparent 1px); background-size: 40px 40px; animation: pan-grid 120s linear infinite; }
            @keyframes pan-grid { from { background-position: 0 0; } to { background-position: 480px 480px; } }
            .content-wrapper { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; }
            .main-card { background: rgba(12, 17, 26, 0.7); backdrop-filter: blur(12px); border: 2px solid rgba(255,176,32,0.2); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 400px; box-shadow: 0 0 50px rgba(255,176,32,0.2); transform: perspective(1000px) rotateY(-5deg); transition: transform 0.4s ease; }
            .main-card:hover { transform: perspective(1000px) rotateY(0deg); }
            .card-content { transform: perspective(1000px) rotateY(5deg); }
            .title { font-family: 'Orbitron', sans-serif; font-size: 2.5rem; color: #FFB020; text-shadow: 0 0 15px rgba(255,176,32,0.7), 0 0 25px rgba(255,176,32,0.5); text-transform: uppercase; letter-spacing: 4px; animation: title-flicker 3s infinite alternate; }
            @keyframes title-flicker { 0%, 18%, 22%, 25%, 53%, 57%, 100% { text-shadow: 0 0 15px rgba(255,176,32,0.7), 0 0 25px rgba(255,176,32,0.5), 0 0 40px rgba(255,176,32,0.3); } 20%, 24%, 55% { text-shadow: none; } }
            .logo { width: 120px; height: 120px; margin: 0 auto 1.5rem; filter: drop-shadow(0 0 25px rgba(255,176,32,0.8)); animation: float 4s ease-in-out infinite; }
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
            .input-group { position: relative; margin-bottom: 1.5rem; }
            .input-field { background: rgba(0,0,0,0.5); border: 2px solid rgba(255,176,32,0.3); color: #fff; width: 100%; padding: 1rem 1rem 1rem 3.5rem; border-radius: 12px; font-size: 1.1rem; font-family: 'Orbitron', sans-serif; transition: all 0.3s ease; }
            .input-field:focus { outline: none; border-color: #FFB020; box-shadow: 0 0 20px rgba(255,176,32,0.5); }
            .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #FFB020; opacity: 0.7; transition: all 0.3s ease; }
            .input-group:focus-within .input-icon { opacity: 1; transform: translateY(-50%) scale(1.1); animation: icon-pulse 1s; }
            @keyframes icon-pulse { 50% { transform: translateY(-50%) scale(1.2); } }
            .submit-btn { background: linear-gradient(45deg, #FFB020, #FF8C00); color: #000; width: 100%; border: none; border-radius: 12px; padding: 1.1rem; font-size: 1.25rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(255,176,32,0.6); position: relative; overflow: hidden; }
            .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 0 30px rgba(255,176,32,0.8); }
            .submit-btn:disabled { background: #333; cursor: not-allowed; box-shadow: none; }
            .submit-btn .sparkle { position: absolute; top: -20px; left: -20px; width: 20px; height: 40px; background: white; filter: blur(5px); transform: rotate(45deg); animation: sparkle-move 1s linear infinite; }
            @keyframes sparkle-move { 0% { transform: rotate(45deg) translate(-200px, -200px); } 100% { transform: rotate(45deg) translate(200px, 200px); } }
        `}</style>
        <div className="cyber-grid-bg"></div>

        {isProcessing && <VerificationModal step={processingStep} onCancel={() => setIsProcessing(false)} />}
        <AlertModal message={alertMessage} onClose={() => setAlertMessage(null)} />

        <div className="content-wrapper">
            <div className="main-card">
                <div className="card-content">
                    <header className="text-center">
                        <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="logo" alt="Ducky" />
                        <h1 className="title">DUCKY DZ</h1>
                    </header>

                    <div className="space-y-6 mt-8">
                        <div className="input-group">
                            <User className="input-icon" />
                            <input 
                                type="text" 
                                value={userId} 
                                onChange={(e) => setUserId(e.target.value)} 
                                className="input-field" 
                                placeholder="Your ID" 
                                maxLength={10} 
                                inputMode="numeric" 
                                autoComplete="off" 
                            />
                        </div>
                        <div className="input-group">
                            <KeyRound className="input-icon" />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                className="input-field" 
                                placeholder="Activation Key" 
                                autoComplete="off" 
                            />
                        </div>
                        <button onClick={handleLogin} className="submit-btn" disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : 'Activate System'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </KillSwitch>
  );
}
