
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
                        <span className="inline-block ml-4 text-white font-sans not-italic glitch-v2" style={{ fontFamily: 'Orbitron' }}>
                            V2
                        </span>
                    </h1>
                </div>
            </motion.div>
        </div>
        
        <style jsx global>{`
          @keyframes scatter-glitch {
            0% { clip-path: inset(20% 0 50% 0); transform: translate(-5px, -2px); }
            10% { clip-path: inset(10% 0 80% 0); transform: translate(5px, 2px); }
            20% { clip-path: inset(50% 0 10% 0); transform: translate(-8px, -1px); }
            30% { clip-path: inset(80% 0 5% 0); transform: translate(8px, 1px); }
            40% { clip-path: inset(30% 0 30% 0); transform: translate(-4px, 2px); }
            50% { clip-path: inset(60% 0 20% 0); transform: translate(4px, -2px); }
            60% { clip-path: inset(15% 0 65% 0); transform: translate(-6px, 1px); }
            70% { clip-path: inset(45% 0 45% 0); transform: translate(6px, -1px); }
            80% { clip-path: inset(5% 0 90% 0); transform: translate(-3px, 2px); }
            90% { clip-path: inset(70% 0 10% 0); transform: translate(3px, -2px); }
            100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          }
          .glitch-v2 {
            display: inline-block;
            position: relative;
            animation: scatter-glitch 0.25s infinite linear;
            text-shadow: 2px 0 #888, -2px 0 #fff;
            color: #fff;
          }
          .glitch-v2::before, .glitch-v2::after {
            content: 'V2';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
          }
          .glitch-v2::before {
            left: 2px;
            text-shadow: -2px 0 #ccc;
            clip-path: inset(10% 0 80% 0);
            animation: scatter-glitch 0.3s infinite reverse;
          }
          .glitch-v2::after {
            left: -2px;
            text-shadow: 2px 0 #fff;
            clip-path: inset(80% 0 10% 0);
            animation: scatter-glitch 0.2s infinite;
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
