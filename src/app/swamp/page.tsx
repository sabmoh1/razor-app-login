"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SwampLoginPage() {
  return (
    <KillSwitch pageName="swamp">
      <style jsx global>{`
        @keyframes glitch-v1-top-swamp {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }

        @keyframes glitch-v1-bottom-swamp {
          0% { transform: translateX(0); }
          25% { transform: translateX(4px); }
          50% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        .glitch-v1-label {
          position: relative;
          display: inline-block;
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
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
          clip-path: inset(0 0 50% 0);
          animation: glitch-v1-top-swamp 0.1s infinite linear;
          text-shadow: 2px 0 rgba(255,255,255,0.3);
        }

        .glitch-v1-label::after {
          clip-path: inset(50% 0 0 0);
          animation: glitch-v1-bottom-swamp 0.1s infinite linear;
          text-shadow: -2px 0 rgba(255,255,255,0.2);
        }
      `}</style>
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'hue-rotate(60deg) brightness(0.6) contrast(1.1)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/75"></div>
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-green-400 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
        </Link>
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6 antialiased bg-transparent">
        <div className="text-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
                <div className="relative group">
                    <h1 className="text-4xl md:text-6xl font-black tracking-[0.1em] uppercase" style={{ fontFamily: 'Orbitron', color: '#22c55e', textShadow: '0 0 30px rgba(34,197,94,0.4)' }}>
                        SWAMP LAND
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1-label">
                            V1
                        </span>
                    </h1>
                </div>
                <p className="text-gray-400 tracking-[0.3em] uppercase text-xs mt-2 font-bold">Secure Tactical Path Predictor</p>
            </motion.div>
        </div>
        
        <LoginForm 
          welcomePath="/swamp/terminal" 
          themeColor="#22c55e"
          themeGlow=""
          useCustomGlow={true}
          versionLabel="V1"
          gameKey="swamp"
        />
      </main>
    </KillSwitch>
  );
}