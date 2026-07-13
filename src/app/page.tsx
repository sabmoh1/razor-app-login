
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function Home() {
  return (
    <KillSwitch pageName="razor">
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
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight italic" style={{ fontFamily: 'Sedgwick Ave', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                        RAZOR CRASH
                        <span className="inline-block ml-4 text-blue-500 font-sans not-italic glitch-v2" style={{ fontFamily: 'Orbitron' }}>
                            V2
                        </span>
                    </h1>
                </div>
            </motion.div>
        </div>
        
        <style jsx global>{`
          @keyframes split-glitch {
            0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, -1px); }
            10% { clip-path: inset(92% 0 1% 0); transform: translate(1px, 2px); }
            20% { clip-path: inset(25% 0 58% 0); transform: translate(-1px, -2px); }
            30% { clip-path: inset(75% 0 7% 0); transform: translate(2px, 1px); }
            40% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, 2px); }
            50% { clip-path: inset(16% 0 78% 0); transform: translate(1px, -1px); }
            60% { clip-path: inset(62% 0 12% 0); transform: translate(-1px, 2px); }
            70% { clip-path: inset(34% 0 34% 0); transform: translate(2px, -2px); }
            80% { clip-path: inset(84% 0 5% 0); transform: translate(-2px, 1px); }
            90% { clip-path: inset(11% 0 61% 0); transform: translate(1px, 2px); }
            100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          }
          .glitch-v2 {
            display: inline-block;
            position: relative;
            animation: split-glitch 0.2s infinite;
            text-shadow: 2px 0 #ff0000, -2px 0 #0000ff;
          }
        `}</style>

        <LoginForm 
          welcomePath="/Razor_1x" 
          themeColor="#FFFFFF"
          themeGlow=""
          useCustomGlow={true}
        />
      </main>
    </KillSwitch>
  );
}
