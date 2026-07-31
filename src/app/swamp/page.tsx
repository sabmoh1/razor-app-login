
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
        @keyframes glitch-v1-move-swamp {
          0%, 100% { transform: none; opacity: 1; }
          10% { transform: skew(-0.8deg, -0.2deg); opacity: 0.8; }
          20% { transform: none; opacity: 1; }
          60% { transform: none; opacity: 1; }
          70% { transform: skew(0.8deg, 0.2deg); opacity: 0.8; }
          80% { transform: none; opacity: 1; }
        }

        .glitch-v1-label {
          position: relative;
          display: inline-block;
          animation: glitch-v1-move-swamp 4s infinite;
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
          animation: glitch-top-v1 1.2s infinite linear alternate-reverse;
        }

        .glitch-v1-label::after {
          left: 2px;
          text-shadow: -1px 0 rgba(255,255,255,0.3);
          clip-path: inset(50% 0 0 0);
          animation: glitch-bottom-v1 1.2s infinite linear alternate-reverse;
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
                        <span className="inline-block ml-6 text-white font-sans not-italic glitch-v1-label" style={{ fontFamily: 'Orbitron' }}>
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
