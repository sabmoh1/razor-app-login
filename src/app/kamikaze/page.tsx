
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function KamikazeLoginPage() {
  return (
    <KillSwitch pageName="kamikaze">
      <style jsx global>{`
        @keyframes glitch-v1-move {
          0%, 100% { transform: none; opacity: 1; }
          5% { transform: skew(-1deg, -0.5deg); opacity: 0.8; }
          10% { transform: none; opacity: 1; }
          45% { transform: none; opacity: 1; }
          50% { transform: skew(1deg, 0.1deg); opacity: 0.8; }
          55% { transform: none; opacity: 1; }
        }

        .glitch-v1-label {
          position: relative;
          display: inline-block;
          animation: glitch-v1-move 3.5s infinite;
        }

        .glitch-v1-label::before,
        .glitch-v1-label::after {
          content: 'V1';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-v1-label::before {
          left: -2px;
          text-shadow: 1px 0 rgba(255,255,255,0.3);
          clip-path: inset(0 0 50% 0);
          animation: glitch-top-v1 1s infinite linear alternate-reverse;
        }

        .glitch-v1-label::after {
          left: 2px;
          text-shadow: -1px 0 rgba(255,255,255,0.3);
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom-v1 1s infinite linear alternate-reverse;
        }

        @keyframes glitch-top-v1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-3px); }
        }

        @keyframes glitch-bottom-v1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(3px); }
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
                <div className="relative group">
                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.1em] uppercase" style={{ fontFamily: 'Orbitron', color: '#ff4d4d', textShadow: '0 0 30px rgba(255,77,77,0.4)' }}>
                        KAMIKAZE
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1-label" style={{ fontFamily: 'Orbitron' }}>
                            V1
                        </span>
                    </h1>
                </div>
                <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mt-2 font-bold">Secure Tactical Path Predictor</p>
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
