
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

          .glitch-v2 {
            display: inline-block;
            position: relative;
            color: #fff;
          }

          /* نحت النص الأساسي لجعله شفافاً وقت الانكسار لإظهار القطع المتحركة فقط */
          .glitch-v2::before, .glitch-v2::after {
            content: 'V2';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            pointer-events: none;
          }

          /* الشريحة العلوية المنكسرة */
          .glitch-v2::before {
            animation: break-top 2.2s infinite steps(1);
            text-shadow: 2px 0 #888;
          }

          /* الشريحة السفلية المنكسرة */
          .glitch-v2::after {
            animation: break-bottom 1.8s infinite steps(1);
            text-shadow: -2px 0 #fff;
          }

          /* إخفاء النص الأساسي جزئياً لإبراز أثر التمزق */
          .glitch-v2 {
            color: rgba(255,255,255,0.1);
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
