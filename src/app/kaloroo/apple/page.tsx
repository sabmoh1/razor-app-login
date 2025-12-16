"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';
import KillSwitch from '@/components/kill-switch';

const formSchema = z.object({
  userId: z.string().min(10, { message: "يجب أن يكون 10 أرقام بالضبط!" }).max(10, { message: "يجب أن يكون 10 أرقام بالضبط!" }).regex(/^\d+$/, { message: "يجب أن يحتوي على أرقام فقط." }),
  password: z.string().min(1, { message: "الـ Key مطلوب!" }),
});

export default function KalorooAppleLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: '', password: '' },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const passwordsRef = ref(database, 'passwords');
      const snapshot = await get(passwordsRef);

      if (snapshot.exists()) {
        const allPasswords = snapshot.val();
        let isValid = false;
        let passwordKey: string | null = null;
        let passwordData: any = null;

        for (const key in allPasswords) {
          // This logic is simplified; in a real app, keys would be specific to games/pages.
          if (allPasswords[key].password === values.password) {
            isValid = true;
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }
        
        if (isValid && passwordKey && passwordData && passwordData.attemps) {
            const userAuth = {
                userId: values.userId,
                userKey: values.password,
                attempts: parseInt(passwordData.attemps, 10),
                uses: passwordData.uses || 1,
                dbKeyId: passwordKey,
            };
            sessionStorage.setItem('kaloroo_apple_auth', JSON.stringify(userAuth));
            router.push('/kaloroo/apple/welcome');
        } else {
            setAuthError(passwordData && !passwordData.attemps ? "This key is not for the Apple game." : "Key غير صحيح!");
            form.reset({ userId: values.userId, password: '' });
        }

      } else {
        setAuthError("System error: Could not verify credentials.");
      }
    } catch (error) {
      setAuthError("Network error. Please check your connection.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  
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
        x: number;
        y: number;
        size: number;
        speedY: number;
        speedX: number;
        life: number;
        maxLife: number;
        color: string;

        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20;
            this.size = Math.random() * 10 + 4;
            this.speedY = -Math.random() * 2.5 - 0.8;
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.life = 0;
            this.maxLife = Math.random() * 50 + 50;
            this.color = `hsl(${200 + Math.random() * 30}, 100%, ${55 + Math.random() * 25}%)`;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.speedY *= 0.98;
            this.life++;
            this.size *= 0.98;
        }
        draw() {
            if (!ctx) return;
            const alpha = 1 - this.life / this.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    function createFire() {
        if (particles.length < 50) {
            for (let i = 0; i < 2; i++) particles.push(new Particle());
        }
    }
    
    let animationFrameId: number;
    function animateFire() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(10, 10, 26, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        createFire();
        particles = particles.filter(p => {
            p.update();
            p.draw();
            return p.life <= p.maxLife && p.y > -20;
        });
        animationFrameId = requestAnimationFrame(animateFire);
    }
    animateFire();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    }

  }, []);


  return (
    <KillSwitch pageName="kaloroo">
    <>
      <Head>
        <title>KALORODZ | Apple Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#00bfff" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <style jsx global>{`
        :root {
            --background: 228 50% 3%;
            --foreground: 210 40% 98%;
            --primary: 198 100% 50%;
            --border: 198 100% 30%;
            --radius: 1.2rem;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        html {
            height: 100%;
        }
        body {
            background-color: #0a0a1a;
            color: hsl(var(--foreground));
            min-height: 100dvh;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        canvas {
            will-change: transform;
            image-rendering: -webkit-optimize-contrast;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
        }
        .content-wrapper {
            position: relative;
            z-index: 1;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: max(2rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom));
            gap: 1.5rem;
            width: 100%;
            overflow-y: auto;
        }
        .main-content {
            width: 100%;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
        }
        header {
            text-align: center;
            margin-bottom: 1rem;
        }
        .kalorodz-title {
            font-size: clamp(2rem, 10vw, 3rem);
            font-weight: 900;
            letter-spacing: 0.15rem;
            color: white;
            text-transform: uppercase;
            background: rgba(0, 0, 0, 0.6);
            padding: 0.8rem 1.5rem;
            border-radius: var(--radius);
            backdrop-filter: blur(12px);
            box-shadow: 0 0 1.5rem rgba(0, 191, 255, 0.8), 0 0 3rem rgba(0, 123, 255, 0.6);
            text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(211 100% 50%);
            animation: glow-pulse 2s infinite alternate;
        }
        .dragon-main {
            width: clamp(80px, 25vw, 120px);
            height: auto;
            filter: drop-shadow(0 0 1rem #00bfff);
            margin-top: 1rem;
            animation: float 3s infinite ease-in-out;
        }
        .input-card {
            background: linear-gradient(145deg, #111, #1a1a1a);
            border: 2px solid hsl(var(--border));
            border-radius: var(--radius);
            padding: 1.5rem;
            width: 100%;
            text-align: center;
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 1.5rem rgba(0, 191, 255, 0.5), 0 0 3rem rgba(0, 123, 255, 0.3);
            transition: all 0.4s ease;
        }
        .card-title {
            font-size: clamp(1.1rem, 4.5vw, 1.375rem);
            font-weight: bold;
            color: hsl(var(--primary));
            margin-bottom: 0.8rem;
            text-shadow: 0 0 0.6rem hsl(var(--primary));
            position: relative;
            z-index: 1;
        }
        .input-field {
            width: 100%;
            padding: 1rem;
            background: #111;
            border: 2px solid #2563eb;
            border-radius: calc(var(--radius) - 4px);
            color: #fff;
            font-size: 1rem;
            text-align: center;
            transition: all 0.3s;
            position: relative;
            z-index: 1;
            -webkit-appearance: none;
            outline: none;
        }
        .input-field:focus {
            border-color: hsl(var(--primary));
            box-shadow: 0 0 1rem rgba(0, 191, 255, 0.8);
        }
        .error-message {
            color: #ff1a1a;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            font-weight: bold;
            text-shadow: 0 0 0.5rem #ff0000;
            display: block;
            position: relative;
            z-index: 1;
            min-height: 1.2rem;
        }
        .play-btn {
            background: linear-gradient(135deg, #007bff, #00bfff);
            color: white;
            border: 2px solid hsl(var(--primary));
            padding: 1rem 3rem;
            font-size: clamp(1.1rem, 4.5vw, 1.25rem);
            font-weight: bold;
            border-radius: 3rem;
            cursor: pointer;
            box-shadow: 0 0.4rem 1.2rem rgba(0, 123, 255, 0.5);
            transition: all 0.4s;
            position: relative;
            overflow: hidden;
            z-index: 1;
            min-height: 3.5rem;
            touch-action: manipulation;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .play-btn:disabled {
             opacity: 0.5;
             pointer-events: none;
             cursor: not-allowed;
        }
        .telegram-section {
            margin-top: 2rem;
            text-align: center;
        }
        .telegram-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.8rem;
            background: rgba(0, 0, 0, 0.6);
            color: hsl(var(--primary));
            padding: 0.9rem 1.8rem;
            border-radius: 3rem;
            text-decoration: none;
            font-weight: bold;
            font-size: clamp(1rem, 4vw, 1.125rem);
            box-shadow: 0 0 1.5rem rgba(0, 191, 255, 0.6);
            transition: all 0.4s ease;
            backdrop-filter: blur(8px);
        }
        .telegram-btn i {
            font-size: 1.8rem;
            color: #00bfff;
            filter: drop-shadow(0 0 0.6rem #00bfff);
            animation: pulse-icon 2s infinite;
        }
        .telegram-btn:hover, .telegram-btn:active {
            transform: translateY(-4px);
            box-shadow: 0 0 2rem rgba(0, 191, 255, 1);
            color: white;
        }
        @keyframes glow-pulse {
            from { text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(211 100% 50%); }
            to { text-shadow: 0 0 0.9rem hsl(var(--primary)), 0 0 1.8rem hsl(211 100% 50%), 0 0 2.7rem #00d4ff; }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @keyframes pulse-icon {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }
      `}</style>

      <canvas id="fire-canvas"></canvas>
      <div className="content-wrapper">
        <div className="main-content">
            <header>
                <h1 className="kalorodz-title">KALORODZ</h1>
                <img src="https://i.ibb.co/Kp4zV4wY/6050911538094214341-120-removebg-preview.png" className="dragon-main" alt="Dragon" />
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center space-y-6">
                <div className="input-card">
                    <div className="card-title">أدخل ID حسابك (10 أرقام)</div>
                    <input type="text" {...register("userId")} className={`input-field ${errors.userId ? 'error' : ''}`} placeholder="" maxLength={10} inputMode="numeric" autoComplete="off" />
                    <div className="error-message">
                        {errors.userId?.message}
                    </div>
                </div>

                <div className="input-card">
                    <div className="card-title">أدخل Key التنين</div>
                    <input type="password" {...register("password")} className={`input-field ${errors.password || authError ? 'error' : ''}`} placeholder="" autoComplete="off" />
                    <div className="error-message">
                        {errors.password?.message || authError}
                    </div>
                </div>

                <button type="submit" className="play-btn" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="animate-spin" /> : 'ابدأ اللعب'}
                </button>
            </form>

            <div className="telegram-section">
                <a href="https://t.me/kalorodz" target="_blank" rel="noopener" className="telegram-btn">
                    <i className="fab fa-telegram-plane"></i>
                    <span>انضم إلى قناتنا @kalorodz</span>
                </a>
            </div>
        </div>
      </div>
    </>
    </KillSwitch>
  );
}
