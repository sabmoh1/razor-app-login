
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { database } from '@/lib/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Loader2, Instagram, Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import KillSwitch from '@/components/kill-switch';

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: 'Activation Code is required.' }),
});

function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}

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
          // Updated to use 'rz' field
          if (allPasswords[key].rz === values.password) {
            isValid = true;
            validity = allPasswords[key].validity || '1h';
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }

        if (isValid && passwordKey && passwordData) {
          
            if (passwordData.attemps || passwordData.attempts) {
                setAuthError("This key is not valid for this page.");
                setIsSubmitting(false);
                return;
            }
             if (!isTimeBasedValidity(passwordData.validity)) {
                setAuthError("This key is not valid for this page.");
                setIsSubmitting(false);
                return;
            }

          const passwordRef = ref(database, `passwords/${passwordKey}`);
          if (passwordData.uses && passwordData.uses > 1) {
            await update(passwordRef, { uses: passwordData.uses - 1 });
          } else if(passwordData.uses) {
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

    // Clear existing particles before creating new ones
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

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
    <KillSwitch pageName="ducky">
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
          gap: 1rem;
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
          font-family: 'Poppins', sans-serif !important;
          font-weight: 900 !important;
          font-size: clamp(2rem, 8vw, 3rem);
          color: #FFB020;
          text-shadow: 0 0 15px rgba(255,176,32,0.6), 0 0 25px rgba(255,176,32,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
        .social-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 176, 32, 0.2);
            border-radius: 20px;
            padding: 1.5rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 0.9rem 1.5rem;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            color: white;
        }
        .social-btn.instagram {
            background: linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .social-btn.instagram:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(220, 39, 67, 0.4);
        }
        .social-btn.telegram {
             background: linear-gradient(135deg, #37aee2 0%, #1e96c8 100%);
             border: 1px solid rgba(255,255,255,0.2);
        }
        .social-btn.telegram:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(55, 174, 226, 0.4);
        }
        
      `}</style>
      <div id="particles" className="bg-particles"></div>
      <div className="container">
        <div className="left-section">
          <div className="logo-container">
            <img src="https://i.ibb.co/NgJnjdc4/t-l-chargement-11-removebg-preview.png" className="logo" alt="Ducky DZ" />
          </div>
          <h1 className="brand-title">DUCKY DZ</h1>
        </div>

        <div className="right-section">
          <div className="form-card">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            className="input-field"
                            placeholder="User ID"
                            maxLength={11}
                            inputMode="numeric"
                            autoComplete="off"
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="error-message" />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="input-wrapper">
                         <i className="fas fa-key input-icon"></i>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            className="input-field"
                            placeholder="Activation Code"
                            autoComplete="off"
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="error-message" />
                    </FormItem>
                  )}
                />
                
                {authError && <div className="error-message" style={{ display: 'block', textAlign: 'center', marginBottom: '1rem' }}>{authError}</div>}
                
                <button id="play-btn" type="submit" className="play-btn" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><i className="fas fa-play"></i><span>Activate</span></>}
                </button>
              </form>
            </Form>
          </div>

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
    </KillSwitch>
  );
}
