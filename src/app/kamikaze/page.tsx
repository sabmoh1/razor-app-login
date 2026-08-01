
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function KamikazeLoginPage() {
  return (
    <KillSwitch pageName="kamikaze">
      <style jsx global>{`
        @keyframes glitch-v1-top {
          0% { transform: translate(0); clip-path: inset(0 0 50% 0); }
          20% { transform: translate(-3px, -1px); clip-path: inset(0 0 50% 0); }
          40% { transform: translate(3px, 1px); clip-path: inset(0 0 50% 0); }
          60% { transform: translate(-3px, 1px); clip-path: inset(0 0 50% 0); }
          80% { transform: translate(3px, -1px); clip-path: inset(0 0 50% 0); }
          100% { transform: translate(0); clip-path: inset(0 0 50% 0); }
        }

        @keyframes glitch-v1-bottom {
          0% { transform: translate(0); clip-path: inset(50% 0 0 0); }
          20% { transform: translate(3px, 1px); clip-path: inset(50% 0 0 0); }
          40% { transform: translate(-3px, -1px); clip-path: inset(50% 0 0 0); }
          60% { transform: translate(3px, -1px); clip-path: inset(50% 0 0 0); }
          80% { transform: translate(-3px, 1px); clip-path: inset(50% 0 0 0); }
          100% { transform: translate(0); clip-path: inset(50% 0 0 0); }
        }

        .glitch-v1-label {
          position: relative;
          display: inline-block;
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          color: white;
        }

        .glitch-v1-label::before,
        .glitch-v1-label::after {
          content: 'V1';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .glitch-v1-label::before {
          animation: glitch-v1-top 0.1s infinite linear;
          text-shadow: 2px 0 rgba(255,255,255,0.4);
        }

        .glitch-v1-label::after {
          animation: glitch-v1-bottom 0.1s infinite linear;
          text-shadow: -2px 0 rgba(150,150,150,0.4);
        }
      `}</style>
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'brightness(0.7) contrast(1.2)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/75"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 antialiased bg-transparent">
        <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
                <img 
                  src="https://iili.io/f9iNGFj.png" 
                  alt="Razor Logo" 
                  className="w-48 md:w-56 drop-shadow-[0_0_30px_rgba(255,77,77,0.3)] mb-4" 
                />
                <div className="relative group">
                    <h1 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase" style={{ fontFamily: 'Orbitron', color: '#ff4d4d', textShadow: '0 0 30px rgba(255,77,77,0.4)' }}>
                        KAMIKAZE
                        <span className="inline-block ml-4 not-italic glitch-v1-label">
                            V1
                        </span>
                    </h1>
                </div>
            </motion.div>
        </div>
        
        <LoginForm 
          welcomePath="/kamikaze/terminal" 
          themeColor="#ff4d4d"
          themeGlow=""
          useCustomGlow={true}
          versionLabel="V1"
          gameKey="kamikaze"
        />
      </main>
    </KillSwitch>
  );
}
