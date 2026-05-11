
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import Head from 'next/head';
import { Loader2, User, KeyRound } from 'lucide-react';
import KillSwitch from '@/components/kill-switch';

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "Password is required." }),
});

function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}

export default function NasserusdtLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

    useEffect(() => {
    const container = document.getElementById('particles-background');
    if (!container) return;
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const particleCount = 30;
    const imageUrl = "https://iili.io/fxaO5P9.jpg";

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 80 + 20;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundImage = `url(${imageUrl})`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        const duration = Math.random() * 30 + 20; 
        particle.style.animation = `float ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = `${Math.random() * -duration}s`;
        container.appendChild(particle);
    }
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      const passwordsRef = ref(database, 'passwords');
      const snapshot = await get(passwordsRef);

      if (snapshot.exists()) {
        const allPasswords = snapshot.val();
        let isValid = false;
        let passwordKey: string | null = null;
        let passwordData: any = null;

        for (const key in allPasswords) {
          // Updated to use 'rz' field
          if (allPasswords[key].rz === values.password) {
            isValid = true;
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }

        if (isValid && passwordKey && passwordData) {
            if (passwordData.attemps || passwordData.attempts) {
                setError("This key is not valid for this page.");
                setIsSubmitting(false);
                return;
            }
            if (!isTimeBasedValidity(passwordData.validity)) {
                setError("This key is not valid for this page.");
                setIsSubmitting(false);
                return;
            }

            const passwordRef = ref(database, `passwords/${passwordKey}`);
            if (passwordData.uses && passwordData.uses > 1) {
                await update(passwordRef, { uses: passwordData.uses - 1 });
            } else if (passwordData.uses) {
                await remove(passwordRef);
            }

            sessionStorage.setItem('razor_user_id', values.userId);
            sessionStorage.setItem('razor_session_validity', passwordData.validity || '1h');
            router.push('/nasserusdt/welcome');
        } else {
            setError("Invalid credentials. Please try again.");
            form.reset({ userId: values.userId, password: '' });
        }
      } else {
        setError("System error: Could not verify credentials.");
      }
    } catch (e) {
      setError("Network error. Please check your connection.");
      console.error("Login error:", e);
    } finally {
        if (router.asPath !== '/nasserusdt/welcome') {
            setIsSubmitting(false);
        }
    }
  }

  return (
    <KillSwitch pageName="nasserusdt">
        <Head>
            <title>NasserUSDT - Login</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap" rel="stylesheet"/>
        </Head>
        <div id="particles-background" className="fixed inset-0 -z-10 overflow-hidden"></div>
        <style jsx global>{`
            body {
                background-color: #0a192f;
                font-family: "Poppins", sans-serif;
                color: white;
            }
            .main-box {
                background: rgba(10, 25, 47, 0.85);
                box-shadow: 0 0 40px rgba(0, 191, 255, 0.4), inset 0 0 20px rgba(0, 191, 255, 0.2);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(0, 191, 255, 0.3);
                animation: fadeIn 1s ease-out;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .pulse-shadow {
                box-shadow: 0 0 40px rgba(0, 191, 255, 0.6);
                animation: pulse 2.5s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 40px rgba(0, 191, 255, 0.5); }
                50% { box-shadow: 0 0 60px rgba(0, 191, 255, 0.8); }
                100% { box-shadow: 0 0 40px rgba(0, 191, 255, 0.5); }
            }
            .particle {
                position: absolute;
                border-radius: 50%;
                background-size: cover;
                opacity: 0.15;
                pointer-events: none;
            }
            @keyframes float {
                0% { transform: translateY(100vh) scale(1); opacity: 0.15; }
                100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
            }
        `}</style>
        
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <main className="main-box w-full max-w-md rounded-3xl p-6 md:p-8">
                <header className="flex flex-col items-center mb-6">
                    <img src="https://iili.io/fxaO5P9.jpg" alt="NasserUSDT Logo" className="w-24 h-24 rounded-full mb-4 border-2 border-cyan-400 pulse-shadow"/>
                    <h1 className="text-3xl font-bold text-white tracking-wide">VIP Access</h1>
                </header>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70" />
                        <input
                            {...form.register('userId')}
                            type="text"
                            inputMode="numeric"
                            placeholder="User ID"
                            className="w-full p-3 pl-10 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                        />
                         {form.formState.errors.userId && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.userId.message}</p>}
                    </div>

                     <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70" />
                        <input
                            {...form.register('password')}
                            type="password"
                            placeholder="Password"
                            className="w-full p-3 pl-10 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                        />
                         {form.formState.errors.password && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.password.message}</p>}
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <button 
                        type="submit" 
                        className="w-full p-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
                    </button>
                </form>
            </main>
        </div>
    </KillSwitch>
  );
}
