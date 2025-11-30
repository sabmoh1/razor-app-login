
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2, Headset } from 'lucide-react';
import Head from 'next/head';

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "KEY is required." }),
});

export default function NasserusdtLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  });

  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(loadingTimeout);
  }, []);


  useEffect(() => {
    if (isLoading) return;

    const container = document.getElementById('particles-background');
    if (!container) return;

    // Clear existing particles before creating new ones
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    const particleCount = 30; // Increased density
    const imageUrl = "https://i.ibb.co/GvqLP66v/ROUND-NASSER.jpg";

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
  }, [isLoading]);

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

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading... - NasserUSDT</title>
        </Head>
        <div className="flex items-center justify-center min-h-screen bg-[#0a192f]">
          <img src="https://i.postimg.cc/W3Z2C3ZW/loading.gif" alt="Loading..." />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
          <title>Login - NasserUSDT</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap"
            rel="stylesheet"
          />
      </Head>
      <div id="particles-background" className="fixed inset-0 -z-10 overflow-hidden"></div>
      <style jsx global>{`
        body {
          background-color: #0a192f;
          font-family: "Poppins", sans-serif;
        }

        .login-box {
          background: rgba(10, 25, 47, 0.85);
          box-shadow: 0 0 30px #00BFFF, 0 10px 40px rgba(0, 191, 255, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 191, 255, 0.2);
          animation: fadeInUp 0.8s ease-out;
        }

        .login-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 40px #00BFFF, 0 15px 50px rgba(0, 191, 255, 0.4);
        }

        .login-box::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(0, 191, 255, 0.1),
            transparent
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }
        
        .logo {
          display: flex;
          justify-content: center;
        }

        .logo img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 20px;
          box-shadow: 0 0 30px rgba(0, 191, 255, 0.6);
          border: 3px solid #00BFFF;
        }

        .input-group input {
          border: 2px solid rgba(0, 191, 255, 0.3);
          background: rgba(255, 255, 255, 0.95);
        }

        .input-group input:focus {
          border-color: #00BFFF;
          background: white;
          box-shadow: 0 0 15px rgba(0, 191, 255, 0.3);
        }

        .login-btn {
            background: linear-gradient(135deg, #00BFFF, #007BFF);
            box-shadow: 0 5px 15px rgba(0, 191, 255, 0.4);
        }

        .login-btn:hover {
            box-shadow: 0 8px 25px rgba(0, 191, 255, 0.6);
            background: linear-gradient(135deg, #33ccff, #0066cc);
        }
        
        .support-fab {
          position: fixed;
          bottom: 25px;
          right: 25px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00BFFF, #007BFF);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 5px 20px rgba(0, 191, 255, 0.5);
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .support-fab:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 8px 30px rgba(0, 191, 255, 0.7);
        }


        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        .particle {
            position: absolute;
            border-radius: 50%;
            background-size: cover;
            opacity: 0.15;
            pointer-events: none;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) scale(1);
                opacity: 0.15;
            }
            100% {
                transform: translateY(-100px) scale(0.5);
                opacity: 0;
            }
        }
      `}</style>
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="login-container relative w-full max-w-sm p-5">
          <div className="login-box relative overflow-hidden rounded-3xl p-9 text-center transition-all duration-300">
            <div className="logo relative mb-8">
               <img src="https://i.ibb.co/GvqLP66v/ROUND-NASSER.jpg" alt="NasserUSDT Logo"/>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="input-group relative" style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
                <input
                  type="text"
                  {...form.register('userId')}
                  placeholder="User ID"
                  className="w-full rounded-2xl border-2 p-4 text-center font-poppins text-base text-gray-800 outline-none transition-all duration-300 placeholder:text-gray-500"
                  maxLength={11}
                  inputMode="numeric"
                />
                 {form.formState.errors.userId && <p className="mt-2 text-sm text-red-400">{form.formState.errors.userId.message}</p>}
              </div>

              <div className="input-group relative" style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}>
                <input
                  type="password"
                  {...form.register('password')}
                  placeholder="KEY"
                  className="w-full rounded-2xl border-2 p-4 text-center font-poppins text-base text-gray-800 outline-none transition-all duration-300 placeholder:text-gray-500"
                />
                 {form.formState.errors.password && <p className="mt-2 text-sm text-red-400">{form.formState.errors.password.message}</p>}
              </div>
              
              {authError && <p className="mb-4 text-sm text-red-400">{authError}</p>}

              <button type="submit" className="login-btn relative w-full overflow-hidden rounded-2xl border-none p-4 text-xl font-bold text-white transition-all duration-300" disabled={isSubmitting} style={{ animation: 'fadeInUp 0.8s ease-out 0.8s both' }}>
                {isSubmitting ? <Loader2 className="mx-auto animate-spin" /> : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <a href="https://t.me/nasserusdtt" target="_blank" rel="noopener noreferrer" className="support-fab">
          <Headset size={28} />
      </a>
    </>
  );
}

