"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <KillSwitch pageName="razor">
      <style jsx global>{`
        @keyframes glitch-v2-top {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }

        @keyframes glitch-v2-bottom {
          0% { transform: translateX(0); }
          25% { transform: translateX(4px); }
          50% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        .glitch-v2-label {
          position: relative;
          display: inline-block;
          color: white;
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
        }

        .glitch-v2-label::before,
        .glitch-v2-label::after {
          content: 'V2';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }

        .glitch-v2-label::before {
          clip-path: inset(0 0 50% 0);
          animation: glitch-v2-top 0.1s infinite linear;
          text-shadow: 2px 0 rgba(255,255,255,0.4);
        }

        .glitch-v2-label::after {
          clip-path: inset(50% 0 0 0);
          animation: glitch-v2-bottom 0.1s infinite linear;
          text-shadow: -2px 0 rgba(150,150,150,0.4);
        }
      `}</style>
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'grayscale(1) brightness(1.2)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/80"></div>
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
                  className="w-48 md:w-56 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4" 
                />
                <div className="relative group">
                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.1em] uppercase" style={{ fontFamily: 'Orbitron', color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.4)' }}>
                        RAZOR CRASH
                        <span className="inline-block ml-6 not-italic glitch-v2-label">
                            V2
                        </span>
                    </h1>
                </div>
            </motion.div>
        </div>
        
        <LoginForm 
          welcomePath="/Razor_1x" 
          themeColor="#FFFFFF"
          themeGlow=""
          useCustomGlow={true}
          gameKey="crash"
          versionLabel="V2"
        />
      </main>
    </KillSwitch>
  );
}