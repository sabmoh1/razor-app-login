"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2, Send, User, KeyRound } from 'lucide-react';
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
            if (isTimeBasedValidity(passwordData.validity)) {
                setAuthError("This key is not valid for this game.");
                setIsSubmitting(false);
                return;
            }

            if (typeof passwordData.attemps === 'undefined' && typeof passwordData.attempts === 'undefined') {
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

  return (
    <KillSwitch pageName="ducky">
    <>
      <Head>
        <title>DUCKY DZ | Apple Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      </Head>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=Orbitron:wght@900&display=swap');
        :root {
            --bg-dark: #05080d;
            --bg-light: #0a101a;
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
        .content-wrapper { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1.5rem; }
        .main-card { position: relative; background: #0c111a; border: 2px solid var(--border-color); border-radius: 1rem; padding: 2rem; width: 100%; max-width: 400px; box-shadow: 0 0 40px var(--primary-glow); transform: skewY(-2deg); transition: transform 0.3s ease; }
        .main-card:hover { transform: skewY(0); }
        .card-content { transform: skewY(2deg); }
        .title { font-family: 'Orbitron', sans-serif; font-size: 2.2rem; color: var(--primary); text-shadow: 0 0 10px var(--primary-glow), 0 0 20px var(--primary); text-transform: uppercase; letter-spacing: 3px; }
        .logo { width: 100px; height: 100px; margin: 0 auto 1.5rem; filter: drop-shadow(0 0 20px var(--primary-glow)); animation: float 4s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .form-group { position: relative; margin-bottom: 1.5rem; }
        .input-field { background: #000; border: 2px solid var(--border-color); color: #fff; width: 100%; padding: 0.8rem 2.8rem; border-radius: 8px; font-size: 1.1rem; font-family: 'Chakra Petch', sans-serif; transition: all 0.3s ease; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%); }
        .input-field:focus { outline: none; border-color: var(--border-hover); box-shadow: 0 0 15px var(--primary-glow); }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--primary); opacity: 0.6; transition: all 0.3s ease; }
        .form-group:focus-within .input-icon { opacity: 1; transform: translateY(-50%) scale(1.1); }
        .submit-btn { background: linear-gradient(45deg, var(--primary), #FF9500); color: #000; width: 100%; border: none; border-radius: 8px; padding: 1rem; font-size: 1.25rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 15px var(--primary-glow); clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 0 25px var(--primary-glow); }
        .submit-btn:disabled { background: #333; cursor: not-allowed; box-shadow: none; }
        .error-message { color: #ff4d4d; font-size: 0.9rem; text-shadow: 0 0 5px #ff4d4d; text-align: center; min-height: 1.25rem; margin-top: 0.5rem;}
        .social-link { display: flex; align-items: center; justify-content: center; gap: 0.75rem; text-decoration: none; color: #fff; margin-top: 2rem; background: rgba(0,0,0,0.3); padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); transition: all 0.3s ease; }
        .social-link:hover { background: var(--border-color); color: #000; }
        .social-link .fab { font-size: 1.5rem; color: var(--secondary); }
      `}</style>
      <div className="cyber-grid-bg"></div>
      <div className="content-wrapper">
        <div className="main-card">
         <div className="card-content">
          <header className="text-center">
            <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="logo" alt="Ducky" />
            <h1 className="title">DUCKY DZ</h1>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-8">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <User className="input-icon" />
                    <FormControl>
                      <Input type="text" {...field} className="input-field" placeholder="ID حسابك" maxLength={10} inputMode="numeric" autoComplete="off" />
                    </FormControl>
                    <FormMessage className="error-message" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="form-group">
                    <KeyRound className="input-icon" />
                    <FormControl>
                      <Input type="password" {...field} className="input-field" placeholder="KEY البط" autoComplete="off" />
                    </FormControl>
                    <FormMessage className="error-message" />
                  </FormItem>
                )}
              />

              {authError && <div className="error-message">{authError}</div>}

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'بدء اللعب'}
              </button>
            </form>
          </Form>

          <a href="https://t.me/duckyoffi" target="_blank" rel="noopener noreferrer" className="social-link">
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
