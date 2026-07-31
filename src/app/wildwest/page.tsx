
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function WildWestLoginPage() {
  return (
    <KillSwitch pageName="wildwest">
      <style jsx global>{`
        @keyframes glitch-fracture-v1-simple {
          0%, 100% { clip-path: inset(0 0 0 0); opacity: 1; }
          4% { clip-path: inset(30% 0 60% 0); opacity: 0.8; }
          8% { clip-path: inset(65% 0 5% 0); opacity: 0.9; }
          12% { clip-path: inset(15% 0 75% 0); opacity: 1; }
          16% { clip-path: inset(0 0 0 0); }
        }
        .glitch-v1 {
          animation: glitch-fracture-v1-simple 3.2s infinite linear;
          display: inline-block;
          position: relative;
        }
      `}</style>
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'sepia(0.5) brightness(0.6) hue-rotate(-30deg)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/70"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 antialiased bg-transparent">
        <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
                <div className="relative group">
                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.1em] uppercase" style={{ fontFamily: 'Orbitron', color: '#FFD700', textShadow: '0 0 30px rgba(255,215,0,0.4)' }}>
                        WILD WEST GOLD
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1" style={{ fontFamily: 'Orbitron' }}>
                            V1
                        </span>
                    </h1>
                </div>
                <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mt-2 font-bold">Official Gold Path Predictor</p>
            </motion.div>
        </div>
        
        <LoginForm 
          welcomePath="/wildwest/terminal" 
          themeColor="#FFD700"
          themeGlow=""
          useCustomGlow={true}
          versionLabel="V1"
          gameKey="west"
        />
      </main>
    </KillSwitch>
  );
}
