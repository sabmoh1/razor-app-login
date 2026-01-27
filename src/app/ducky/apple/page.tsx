
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2, Send, Instagram } from 'lucide-react';
import Head from 'next/head';
import KillSwitch from '@/components/kill-switch';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  userId: z.string().min(10, { message: "يجب أن يكون 10 أرقام بالضبط!" }).max(10, { message: "يجب أن يكون 10 أرقام بالضبط!" }).regex(/^\d+$/, { message: "يجب أن يحتوي على أرقام فقط." }),
  password: z.string().min(1, { message: "الـ Key مطلوب!" }),
});

function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}

export default function DuckyAppleLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: '', password: '' },
  });

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
          if (allPasswords[key].password === values.password) {
            isValid = true;
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }
        
        if (isValid && passwordKey && passwordData) {
            if(isTimeBasedValidity(passwordData.validity)) {
                setAuthError("This key is not valid for this game.");
                setIsSubmitting(false);
                return;
            }

            if(typeof passwordData.attemps === 'undefined' && typeof passwordData.attempts === 'undefined') {
                setAuthError("This key is not configured for the Apple game.");
                setIsSubmitting(false);
                return;
            }
            
            const attempts = passwordData.attemps || passwordData.attempts;

            const userAuth = {
                userId: values.userId,
                userKey: values.password,
                attempts: parseInt(attempts, 10),
                uses: passwordData.uses || 1,
                dbKeyId: passwordKey,
            };
            sessionStorage.setItem('ducky_apple_auth', JSON.stringify(userAuth));
            router.push('/ducky/apple/welcome');
        } else {
            setAuthError("Key غير صحيح!");
            form.reset({ userId: values.userId, password: '' });
        }

      } else {
        setAuthError("System error: Could not verify credentials.");
      }
    } catch (error) {
      setAuthError("Network error. Please check your connection.");
      console.error("Login error:", error);
    } finally {
      if (!router.asPath.includes('/ducky/apple/welcome')) {
        setIsSubmitting(false);
      }
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
        x: number; y: number; size: number; speedY: number; speedX: number; life: number; maxLife: number; color: string;
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20;
            this.size = Math.random() * 10 + 4;
            this.speedY = -Math.random() * 2.5 - 0.8;
            this.speedX = (Math.random() - 0.5) * 1.5;
            this.life = 0;
            this.maxLife = Math.random() * 50 + 50;
            this.color = `hsl(${35 + Math.random() * 20}, 100%, ${55 + Math.random() * 25}%)`;
        }
        update() { this.y += this.speedY; this.x += this.speedX; this.speedY *= 0.98; this.life++; this.size *= 0.98; }
        draw() {
            if (!ctx) return;
            const alpha = 1 - this.life / this.maxLife; ctx.globalAlpha = alpha; ctx.fillStyle = this.color; ctx.shadowBlur = 15; ctx.shadowColor = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        }
    }

    function createFire() { if (particles.length < 50) { for (let i = 0; i < 2; i++) particles.push(new Particle()); } }
    
    let animationFrameId: number;
    function animateFire() {
        if (!ctx) return;
        ctx.fillStyle = 'rgba(10, 10, 26, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        createFire();
        particles = particles.filter(p => { p.update(); p.draw(); return p.life <= p.maxLife && p.y > -20; });
        animationFrameId = requestAnimationFrame(animateFire);
    }
    animateFire();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
    }

  }, []);


  return (
    <KillSwitch pageName="ducky">
    <>
      <Head>
        <title>DUCKY DZ | Apple Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#FFB020" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
      </Head>
      <style jsx global>{`
        :root {
            --background: 228 50% 3%;
            --foreground: 45 90% 98%;
            --primary: 38 92% 50%;
            --border: 38 92% 30%;
            --radius: 1.2rem;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { height: 100%; }
        body { background-color: #0a0a1a; color: hsl(var(--foreground)); min-height: 100dvh; overflow-x: hidden; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        canvas { will-change: transform; image-rendering: -webkit-optimize-contrast; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
        .content-wrapper { position: relative; z-index: 1; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: max(2rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom)); gap: 1.5rem; width: 100%; overflow-y: auto; }
        .main-content { width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        header { text-align: center; margin-bottom: 1rem; }
        .ducky-title { font-size: clamp(2rem, 10vw, 3rem); font-weight: 900; letter-spacing: 0.15rem; color: white; text-transform: uppercase; background: rgba(0, 0, 0, 0.6); padding: 0.8rem 1.5rem; border-radius: var(--radius); backdrop-filter: blur(12px); box-shadow: 0 0 1.5rem rgba(255, 176, 32, 0.8), 0 0 3rem rgba(255, 149, 0, 0.6); text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(38 92% 50%)); animation: glow-pulse 2s infinite alternate; }
        .duck-main { display: block; margin: 1rem auto 0; width: clamp(80px, 25vw, 120px); height: auto; filter: drop-shadow(0 0 1rem #FFB020); animation: float 3s infinite ease-in-out; }
        .input-card { background: linear-gradient(145deg, #111, #1a1a1a); border: 2px solid hsl(var(--border)); border-radius: var(--radius); padding: 1.5rem; width: 100%; text-align: center; position: relative; overflow: hidden; box-shadow: 0 0 1.5rem rgba(255, 176, 32, 0.5), 0 0 3rem rgba(255, 149, 0, 0.3); transition: all 0.4s ease; }
        .card-title { font-size: clamp(1.1rem, 4.5vw, 1.375rem); font-weight: bold; color: hsl(var(--primary)); margin-bottom: 0.8rem; text-shadow: 0 0 0.6rem hsl(var(--primary)); position: relative; z-index: 1; }
        .input-field { width: 100%; padding: 1rem; background: #111; border: 2px solid #D97706; border-radius: calc(var(--radius) - 4px); color: #fff; font-size: 1rem; text-align: center; transition: all 0.3s; position: relative; z-index: 1; -webkit-appearance: none; outline: none; }
        .input-field:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 1rem rgba(255, 176, 32, 0.8); }
        .error-message { color: #ff1a1a; font-size: 0.9rem; margin-top: 0.5rem; font-weight: bold; text-shadow: 0 0 0.5rem #ff0000; display: block; position: relative; z-index: 1; min-height: 1.2rem; }
        .play-btn { background: linear-gradient(135deg, #FFB020, #FF9500); color: black; border: 2px solid hsl(var(--primary)); padding: 1rem 3rem; font-size: clamp(1.1rem, 4.5vw, 1.25rem); font-weight: bold; border-radius: 3rem; cursor: pointer; box-shadow: 0 0.4rem 1.2rem rgba(255, 149, 0, 0.5); transition: all 0.4s; position: relative; overflow: hidden; z-index: 1; min-height: 3.5rem; touch-action: manipulation; width: 100%; display: flex; align-items: center; justify-content: center; }
        .play-btn:disabled { opacity: 0.5; pointer-events: none; cursor: not-allowed; }
        .social-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 176, 32, 0.2); border-radius: 20px; padding: 1.5rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); display: flex; flex-direction: column; gap: 1rem; }
        .social-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.9rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1rem; transition: all 0.3s ease; color: white; }
        .social-btn.instagram { background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%); border: 1px solid rgba(255,255,255,0.2); }
        .social-btn.instagram:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(220, 39, 67, 0.4); }
        .social-btn.telegram { background: linear-gradient(135deg, #37aee2 0%, #1e96c8 100%); border: 1px solid rgba(255,255,255,0.2); }
        .social-btn.telegram:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(55, 174, 226, 0.4); }
        @keyframes glow-pulse { from { text-shadow: 0 0 0.6rem hsl(var(--primary)), 0 0 1.2rem hsl(38 92% 50%)); } to { text-shadow: 0 0 0.9rem hsl(var(--primary)), 0 0 1.8rem hsl(38 92% 50%), 0 0 2.7rem #FF9500; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulse-icon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      `}</style>

      <canvas id="fire-canvas"></canvas>
      <div className="content-wrapper">
        <div className="main-content">
            <header>
                <h1 className="ducky-title">DUCKY DZ</h1>
                <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="duck-main" alt="Ducky" />
            </header>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center space-y-6">
                <div className="input-card">
                    <div className="card-title">أدخل ID حسابك (10 أرقام)</div>
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input type="text" {...field} className="input-field" placeholder="" maxLength={10} inputMode="numeric" autoComplete="off" />
                            </FormControl>
                            <FormMessage className="error-message" />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="input-card">
                    <div className="card-title">أدخل Key البط</div>
                     <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input type="password" {...field} className="input-field" placeholder="" autoComplete="off" />
                            </FormControl>
                            <FormMessage className="error-message" />
                        </FormItem>
                      )}
                    />
                    {authError && <div className="error-message show">{authError}</div>}
                </div>

                <button type="submit" className="play-btn" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 className="animate-spin" /> : 'ابدأ اللعب'}
                </button>
            </form>
            </Form>
            
             <div className="social-card">
              <a href="https://www.instagram.com/ducky_off_dz" target="_blank" rel="noopener noreferrer" className="social-btn instagram">
                  <Instagram />
                  <span>Instagram: @ducky_off_dz</span>
              </a>
              <a href="https://t.me/duckyoffi" target="_blank" rel="noopener noreferrer" className="social-btn telegram">
                  <Send />
                  <span>Telegram: @duckyoffi</span>
              </a>
          </div>
        </div>
      </div>
    </>
    </KillSwitch>
  );
}
