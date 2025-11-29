
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Head from 'next/head';

const formSchema = z.object({
  userId: z
    .string()
    .min(1, { message: "الرجاء إدخال جميع البيانات." }),
  password: z.string().min(1, { message: "الرجاء إدخال جميع البيانات." }),
  game: z.string({ required_error: "يرجى اختيار لعبة واحدة على الأقل." }),
});

export default function NasserusdtLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      password: '',
    },
  });
  
  const handleCheckboxChange = (game: string) => {
      if (selectedGame === game) {
          setSelectedGame(null);
          form.setValue('game', '');

      } else {
          setSelectedGame(game);
          form.setValue('game', game);
      }
  }

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
          setAuthError("بيانات الاعتماد غير صحيحة. يرجى المحاولة مرة أخرى.");
          form.reset({ userId: values.userId, password: '' });
        }
      } else {
        setAuthError("خطأ في النظام: لا يمكن التحقق من بيانات الاعتماد.");
      }
    } catch (error) {
      setAuthError("خطأ في الشبكة. يرجى التحقق من اتصالك.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Head>
          <title>Login - NasserUSDT</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap"
            rel="stylesheet"
          />
      </Head>
      <style jsx global>{`
        body {
          background: url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtscjZ6M3JtMTZ2b2x3d2lldmNsd2VjejVqcDBkN2ZtYm53bWJ6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VbL2nL2r0r0m4/giphy.gif") no-repeat center center fixed;
          background-size: cover;
          font-family: "Cairo", sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        body::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: -1;
        }

        .login-box {
          background: rgba(0, 0, 0, 0.85);
          box-shadow: 0 0 30px #ff4d4d, 0 10px 40px rgba(255, 77, 77, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 77, 77, 0.2);
          animation: fadeInUp 0.8s ease-out;
        }

        .login-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 40px #ff4d4d, 0 15px 50px rgba(255, 77, 77, 0.4);
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
            rgba(255, 77, 77, 0.1),
            transparent
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        .logo h2 {
          color: #ff4d4d;
          text-shadow: 0 0 20px rgba(255, 77, 77, 0.7);
        }

        .logo h2::after {
          background: linear-gradient(90deg, transparent, #ff4d4d, transparent);
        }

        .input-group input {
          border: 2px solid rgba(255, 77, 77, 0.3);
          background: rgba(255, 255, 255, 0.95);
        }

        .input-group input:focus {
          border-color: #ff4d4d;
          background: white;
          box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);
        }
        
        .checkbox-label {
           background: rgba(255, 77, 77, 0.1);
        }
        .checkbox-label:hover {
            background: rgba(255, 77, 77, 0.2);
        }
        .checkbox-label input[type="checkbox"] {
            accent-color: #ff4d4d;
            background-color: #222;
            border: 2px solid #ff4d4d;
        }
        .checkbox-label input[type="checkbox"]:checked {
            background-color: #ff4d4d;
            border-color: #ff4d4d;
            box-shadow: 0 0 10px rgba(255, 77, 77, 0.5);
        }

        .login-btn {
            background: linear-gradient(135deg, #ff4d4d, #cc0000);
            box-shadow: 0 5px 15px rgba(255, 77, 77, 0.4);
        }

        .login-btn:hover {
            box-shadow: 0 8px 25px rgba(255, 77, 77, 0.6);
            background: linear-gradient(135deg, #ff6666, #ff0000);
        }

        .login-btn::before {
             background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="login-container relative w-full max-w-sm p-5">
        <div className="login-box relative overflow-hidden rounded-3xl bg-black/80 p-9 text-center backdrop-blur-md transition-all duration-300">
          <div className="logo relative mb-8">
            <h2 className="relative inline-block text-3xl font-bold tracking-wider">NasserUSDT</h2>
            <div className="logo-after absolute bottom-[-10px] left-1/2 h-1 w-16 -translate-x-1/2"></div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="input-group relative mb-6" style={{ animation: 'fadeInUp 0.8s ease-out 0.2s both' }}>
              <input
                type="text"
                {...form.register('userId')}
                placeholder="ID"
                className="w-full rounded-2xl border-2 p-4 text-center font-cairo text-base text-gray-800 outline-none transition-all duration-300 placeholder:text-gray-500"
              />
            </div>

            <div className="input-group relative mb-6" style={{ animation: 'fadeInUp 0.8s ease-out 0.4s both' }}>
              <input
                type="password"
                {...form.register('password')}
                placeholder="KEY"
                className="w-full rounded-2xl border-2 p-4 text-center font-cairo text-base text-gray-800 outline-none transition-all duration-300 placeholder:text-gray-500"
              />
            </div>
            
             <div className="checkbox-group mb-8 flex flex-wrap justify-center gap-5" style={{ animation: 'fadeInUp 0.8s ease-out 0.6s both' }}>
                <label className="checkbox-label flex cursor-pointer select-none items-center gap-3 rounded-xl p-3 text-white transition-all duration-300">
                    <input type="checkbox" checked={selectedGame === 'crash'} onChange={() => handleCheckboxChange('crash')} className="h-5 w-5 cursor-pointer appearance-none rounded-md border-2 relative transition-all duration-300"/>
                    <span className="text-base font-semibold">Crash</span>
                </label>
                <label className="checkbox-label flex cursor-pointer select-none items-center gap-3 rounded-xl p-3 text-white transition-all duration-300">
                    <input type="checkbox" checked={selectedGame === 'apple'} onChange={() => handleCheckboxChange('apple')} className="h-5 w-5 cursor-pointer appearance-none rounded-md border-2 relative transition-all duration-300"/>
                    <span className="text-base font-semibold">Apple</span>
                </label>
            </div>
            {form.formState.errors.game && <p className="mb-4 text-sm text-red-400">{form.formState.errors.game.message}</p>}
            {authError && <p className="mb-4 text-sm text-red-400">{authError}</p>}

            <button type="submit" className="login-btn relative w-full overflow-hidden rounded-2xl border-none p-4 text-xl font-bold text-white transition-all duration-300" disabled={isSubmitting} style={{ animation: 'fadeInUp 0.8s ease-out 0.8s both' }}>
              {isSubmitting ? <Loader2 className="mx-auto animate-spin" /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
