
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <KillSwitch pageName="razor">
      <style jsx global>{`
        @keyframes glitch-fracture-v2 {
          0%, 100% { clip-path: inset(0 0 0 0); opacity: 1; }
          2% { clip-path: inset(20% 0 80% 0); opacity: 0.8; }
          4% { clip-path: inset(60% 0 10% 0); opacity: 0.9; }
          6% { clip-path: inset(10% 0 70% 0); opacity: 0.7; }
          8% { clip-path: inset(80% 0 20% 0); opacity: 1; }
          10% { clip-path: inset(0 0 0 0); }
        }
        .glitch-v2 {
          animation: glitch-fracture-v2 3s infinite linear alternate-reverse;
          display: inline-block;
          position: relative;
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
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v2" style={{ fontFamily: 'Orbitron' }}>
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
        />
      </main>
    </KillSwitch>
  );
}
