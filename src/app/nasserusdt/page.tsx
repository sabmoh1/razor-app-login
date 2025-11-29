
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2, User, KeyRound, ArrowRightCircle } from 'lucide-react';

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: 'Activation code is required.' }),
});

export default function NasserusdtLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
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
        let validity = '1h';
        let passwordKey: string | null = null;
        let passwordData: any = null;

        for (const key in allPasswords) {
          if (allPasswords[key].password === values.password) {
            isValid = true;
            validity = allPasswords[key].validity || '1h';
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }

        if (isValid && passwordKey && passwordData) {
          const passwordRef = ref(database, `passwords/${passwordKey}`);
          if (passwordData.uses && passwordData.uses > 1) {
            await update(passwordRef, { uses: passwordData.uses - 1 });
          } else {
            await remove(passwordRef);
          }
          sessionStorage.setItem('razor_user_id', values.userId);
          sessionStorage.setItem('razor_session_validity', validity);
          router.push('/nasserusdt/welcome');
        } else {
          setAuthError("Invalid credentials. Please try again.");
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

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap');
        
        :root {
            --nasser-bg: #0D1F23;
            --nasser-dark: #040D0F;
            --nasser-primary: #4FC3F7;
            --nasser-accent: #81D4FA;
            --nasser-light: #E1F5FE;
        }

        .nasserusdt-body {
          background: linear-gradient(135deg, var(--nasser-dark) 0%, var(--nasser-bg) 100%);
          font-family: 'Poppins', sans-serif;
        }

        .shark-logo {
          animation: float 6s ease-in-out infinite, pulse-shadow 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-shadow {
            0%, 100% { filter: drop-shadow(0 25px 25px rgba(79, 195, 247, 0.2)); }
            50% { filter: drop-shadow(0 25px 40px rgba(79, 195, 247, 0.4)); }
        }

        .form-container {
            background: linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(129, 212, 250, 0.2);
        }

        .input-field {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(129, 212, 250, 0.3);
            transition: all 0.3s ease;
        }
        .input-field:focus {
            outline: none;
            border-color: var(--nasser-primary);
            box-shadow: 0 0 15px rgba(79, 195, 247, 0.3);
        }

        .submit-btn {
            background: linear-gradient(135deg, var(--nasser-primary) 0%, var(--nasser-accent) 100%);
            box-shadow: 0 8px 20px rgba(79, 195, 247, 0.3);
            transition: all 0.3s ease;
        }

        .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(79, 195, 247, 0.5);
        }
      `}</style>

      <div className="nasserusdt-body min-h-screen flex flex-col items-center justify-center p-4 text-white overflow-hidden">
        <div className="w-full max-w-md mx-auto">
          
          <div className="text-center mb-8">
            <div className="relative w-48 h-48 mx-auto mb-4">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"></div>
                <img 
                    src="https://i.ibb.co/b3p3pWw/shark-logo.png" 
                    alt="NasserUSDT Shark Logo"
                    className="w-full h-full object-contain shark-logo rounded-full p-2" 
                />
            </div>
            <h1 className="text-4xl font-black uppercase" style={{ textShadow: '0 0 15px rgba(79,195,247,0.5)'}}>NASSERUSDT</h1>
            <p className="text-sm text-nasser-accent opacity-80 tracking-widest">FOURNISSEUR BOT 1XBET</p>
          </div>

          <div className="form-container p-8 rounded-2xl">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-nasser-primary" />
                  <input
                    type="text"
                    {...form.register('userId')}
                    className="input-field w-full h-14 pl-12 pr-4 rounded-xl text-white placeholder:text-gray-400"
                    placeholder="User ID"
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                {form.formState.errors.userId && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.userId.message}</p>}
              </div>

              <div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-nasser-primary" />
                  <input
                    type="password"
                    {...form.register('password')}
                    className="input-field w-full h-14 pl-12 pr-4 rounded-xl text-white placeholder:text-gray-400"
                    placeholder="Activation Code"
                    autoComplete="off"
                  />
                </div>
                {form.formState.errors.password && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.password.message}</p>}
              </div>
              
              {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
              
              <button type="submit" className="submit-btn w-full h-14 rounded-xl text-black font-bold text-lg flex items-center justify-center gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <span>ACTIVATE</span>
                    <ArrowRightCircle />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
