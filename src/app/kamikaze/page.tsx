
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";

export default function KamikazeLoginPage() {
  return (
    <KillSwitch pageName="kamikaze">
      <style jsx global>{`
        @keyframes glitch-v1 {
          0% { transform: translate(0); text-shadow: 0 0 10px rgba(255,77,77,0.4); }
          20% { transform: translate(-2px, 1px); text-shadow: -1px 0 red; }
          40% { transform: translate(-1px, -1px); text-shadow: 1px 0 #8b0000; }
          60% { transform: translate(2px, 1px); text-shadow: -1px 0 red; }
          80% { transform: translate(1px, -2px); text-shadow: 1px 0 #8b0000; }
          100% { transform: translate(0); text-shadow: 0 0 10px rgba(255,77,77,0.4); }
        }
        .glitch-v1 {
          animation: glitch-v1 0.25s infinite;
          display: inline-block;
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
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1" style={{ fontFamily: 'Orbitron' }}>
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
