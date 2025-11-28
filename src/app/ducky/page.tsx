
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 11 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function DuckyLoginPage() {
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
          router.push('/ducky/welcome');
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

  useEffect(() => {
    const container = document.getElementById('particles');
    if (!container) return;

    const createParticles = () => {
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 100 + 50;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.opacity = (Math.random() * 0.3).toString();
        const duration = Math.random() * 20 + 10;
        particle.style.animation = `floatParticle ${duration}s ease-in-out infinite`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
      }
    };
    
    createParticles();
  }, []);

  return (
    <>
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        html, body {
          min-height: 100vh;
          overflow-x: hidden;
          overflow-y: auto;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
          color: #fff;
        }
        .bg-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          overflow: hidden;
        }
        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(255,176,32,0.4), transparent);
          border-radius: 50%;
          pointer-events: none;
        }
        @keyframes floatParticle {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(20px, -30px) scale(1.1); }
            50% { transform: translate(-20px, -60px) scale(0.9); }
            75% { transform: translate(30px, -30px) scale(1.05); }
        }
        .container {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100vh;
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          gap: 2rem;
        }
        @media (min-width: 768px) {
          .container {
            grid-template-columns: 1fr 1fr;
            align-items: center;
            padding: 3rem;
          }
        }
        .left-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 2rem;
        }
        .logo {
          width: clamp(100px, 30vw, 200px);
          height: auto;
          filter: drop-shadow(0 10px 30px rgba(255,176,32,0.6));
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(2deg); }
          75% { transform: translateY(-10px) rotate(-2deg); }
        }
        .brand-title {
          font-size: clamp(2rem, 8vw, 4rem);
          font-weight: 900;
          background: linear-gradient(135deg, #FFB020 0%, #FFA726 50%, #FF9500 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        .brand-subtitle {
          font-size: clamp(0.85rem, 2vw, 1.1rem);
          color: #FFA726;
          font-weight: 600;
          letter-spacing: 0.2em;
          opacity: 0.9;
        }
        .right-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 176, 32, 0.2);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
        .form-card:hover {
          border-color: rgba(255, 176, 32, 0.4);
          box-shadow: 0 12px 40px rgba(255, 176, 32, 0.2);
        }
        .input-group { margin-bottom: 1.5rem; }
        .input-wrapper { position: relative; }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #FFB020;
          font-size: 1.2rem;
        }
        .input-field {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(255, 176, 32, 0.3);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
        }
        .input-field::placeholder { color: rgba(255, 255, 255, 0.3); }
        .input-field:focus {
          outline: none;
          border-color: #FFB020;
          background: rgba(0, 0, 0, 0.6);
          box-shadow: 0 0 20px rgba(255, 176, 32, 0.3);
        }
        .error-message {
          color: #ef4444;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          font-weight: 500;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .play-btn {
          width: 100%;
          padding: 1.2rem;
          background: linear-gradient(135deg, #FFB020 0%, #FF9500 100%);
          border: none;
          border-radius: 12px;
          color: #000;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
          font-family: 'Poppins', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .play-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .play-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 176, 32, 0.6);
        }
         .play-btn:not(:disabled)::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: 0.5s;
        }
        .play-btn:not(:disabled):hover::before {
            left: 100%;
        }
        
      `}</style>
      <div id="particles" className="bg-particles"></div>
      <div className="container">
        <div className="left-section">
          <div className="logo-container">
            <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="logo" alt="Ducky DZ" />
          </div>
          <div className="brand">
            <h1 className="brand-title">DUCKY DZ</h1>
            <p className="brand-subtitle">VIP ACCESS</p>
          </div>
        </div>

        <div className="right-section">
          <div className="form-card">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="input-group">
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    {...form.register('userId')}
                    className="input-field"
                    placeholder="User ID"
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                {form.formState.errors.userId && <div className="error-message">{form.formState.errors.userId.message}</div>}
              </div>
              <div className="input-group">
                <div className="input-wrapper">
                  <i className="fas fa-key input-icon"></i>
                  <input
                    type="password"
                    {...form.register('password')}
                    className="input-field"
                    placeholder="Activation Code"
                    autoComplete="off"
                  />
                </div>
                {form.formState.errors.password && <div className="error-message">{form.formState.errors.password.message}</div>}
              </div>
              {authError && <div className="error-message" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>{authError}</div>}
              <button id="play-btn" type="submit" className="play-btn" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><i className="fas fa-play"></i><span>Activate</span></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
