
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function KamikazeLoginPage() {
  return (
    <KillSwitch pageName="kamikaze">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'hue-rotate(280deg) brightness(0.7) contrast(1.2)',
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
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1" style={{ fontFamily: 'Orbitron' }}>
                            V1
                        </span>
                    </h1>
                </div>
                <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mt-2 font-bold">Secure Tactical Path Predictor</p>
            </motion.div>
        </div>
        
        <style jsx global>{`
          @keyframes break-top {
            0%, 100% { clip-path: inset(0 0 50% 0); transform: translate(0); opacity: 1; }
            15% { clip-path: inset(0 0 50% 0); transform: translate(-12px, 0); color: #ccc; }
            30% { clip-path: inset(0 0 50% 0); transform: translate(6px, 0); }
            45% { clip-path: inset(0 0 50% 0); transform: translate(-4px, 0); }
          }
          
          @keyframes break-bottom {
            0%, 100% { clip-path: inset(50% 0 0 0); transform: translate(0); opacity: 1; }
            20% { clip-path: inset(50% 0 0 0); transform: translate(12px, 0); color: #999; }
            40% { clip-path: inset(50% 0 0 0); transform: translate(-8px, 0); }
            60% { clip-path: inset(50% 0 0 0); transform: translate(4px, 0); }
          }

          .glitch-v1 {
            display: inline-block;
            position: relative;
            color: #fff;
          }

          .glitch-v1::before, .glitch-v1::after {
            content: 'V1';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            pointer-events: none;
          }

          .glitch-v1::before {
            animation: break-top 2.5s infinite steps(1);
            text-shadow: 2px 0 #888;
          }

          .glitch-v1::after {
            animation: break-bottom 2s infinite steps(1);
            text-shadow: -2px 0 #fff;
          }

          .glitch-v1 {
            color: rgba(255,255,255,0.1);
          }
        `}</style>

        <LoginForm 
          welcomePath="/kamikaze/terminal" 
          themeColor="#ff4d4d"
          themeGlow=""
          useCustomGlow={true}
          versionLabel="V1"
        />
      </main>
    </KillSwitch>
  );
}
