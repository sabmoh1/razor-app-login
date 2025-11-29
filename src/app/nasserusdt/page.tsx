
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';

const formSchema = z.object({
  userId: z.string().min(1, { message: "الرجاء إدخال جميع البيانات." }),
  password: z.string().min(1, { message: "الرجاء إدخال جميع البيانات." }),
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
          background: url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZkZ3g5OG9jZWk0YjI4eG05cmozbWE0ejc4bXZkZzZtcW5scjBudCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9JgespA0x6l2x3S3M4/giphy.gif") no-repeat center center fixed;
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

        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
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

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="login-container relative w-full max-w-sm p-5">
        <div className="login-box relative overflow-hidden rounded-3xl bg-black/80 p-9 text-center backdrop-blur-md transition-all duration-300">
          <div className="logo relative mb-8">
             <img src="https://i.ibb.co/q5Lgvy3/shark-logo.jpg" alt="NasserUSDT Logo"/>
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
            
            {form.formState.errors.userId && <p className="mb-4 text-sm text-red-400">{form.formState.errors.userId.message}</p>}
            {form.formState.errors.password && <p className="mb-4 text-sm text-red-400">{form.formState.errors.password.message}</p>}
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
