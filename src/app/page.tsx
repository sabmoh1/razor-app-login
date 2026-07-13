
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';

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
        <div className="text-center mb-12">
            <motion.img 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src="https://iili.io/f9iNGFj.png" 
              alt="Razor Logo" 
              className="w-56 md:w-72 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" 
            />
        </div>
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

// Helper for motion image (we need framer-motion here for consistency)
import { motion } from "framer-motion";
