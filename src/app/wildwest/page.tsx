
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function WildWestLoginPage() {
  return (
    <KillSwitch pageName="wildwest">
      <style jsx global>{`
        @keyframes glitch-v1-gold {
          0% { transform: translate(0); text-shadow: 0 0 10px rgba(255,215,0,0.4); }
          20% { transform: translate(-2px, 1px); text-shadow: -1px 0 #b8860b; }
          40% { transform: translate(-1px, -2px); text-shadow: 1px 0 #ffd700; }
          60% { transform: translate(2px, 1px); text-shadow: -1px 0 #b8860b; }
          80% { transform: translate(1px, -1px); text-shadow: 1px 0 #ffd700; }
          100% { transform: translate(0); text-shadow: 0 0 10px rgba(255,215,0,0.4); }
        }
        .glitch-v1 {
          animation: glitch-v1-gold 0.25s infinite;
          display: inline-block;
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
