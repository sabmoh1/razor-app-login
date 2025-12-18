
"use client";

import { useEffect, useState, useRef } from 'react';
import LoginForm from '@/components/login-form';
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import KillSwitch from '@/components/kill-switch';

type CrashConfig = {
  name: string;
  theme_color: string;
  expires: number;
};

const DEFAULT_CONFIG = {
  name: "CRASH",
  theme_color: "#00d9a3", // Teal
  themeGlow: 'text-glow-teal'
};

export default function CrashHome() {
  const [config, setConfig] = useState({ 
    name: DEFAULT_CONFIG.name, 
    themeColor: DEFAULT_CONFIG.theme_color, 
    themeGlow: DEFAULT_CONFIG.themeGlow,
    isCustom: false
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const configRef = ref(database, 'crash_config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: CrashConfig = snapshot.val();
        if (data.expires > Date.now()) {
          setConfig({ name: data.name, themeColor: data.theme_color, themeGlow: '', isCustom: true });
        } else {
          setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, themeGlow: DEFAULT_CONFIG.themeGlow, isCustom: false });
        }
      } else {
        setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, themeGlow: DEFAULT_CONFIG.themeGlow, isCustom: false });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let cols = Math.floor(W / 10) + 1;
    let ypos = Array(cols).fill(0);
    const letters = '01・〇●■▲▼◆CRASH';

    const matrixResize = () => {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
        cols = Math.floor(W / 10) + 1;
        ypos = Array(cols).fill(0);
    };
    window.addEventListener('resize', matrixResize);

    const drawMatrix = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0,0,W,H);
        ctx.font = '12px monospace';

        // Use the dynamic theme color from the config state
        const matrixColor = config.themeColor;

        ypos.forEach((y, ind) => {
            const text = letters.charAt(Math.floor(Math.random() * letters.length));
            const x = ind * 10;
            
            // Create a hex color with random alpha for the glow effect
            const alpha = (0.18 + Math.random() * 0.6).toString(16).substring(2, 4);
            ctx.fillStyle = `${matrixColor}${alpha.padStart(2, '0')}`;
            
            ctx.fillText(text, x, y);
            if(y > H + Math.random()*700) {
              ypos[ind] = 0;
            } else {
              ypos[ind] = y + 12 + Math.random()*8;
            }
        });
    };
    
    const matrixInterval = setInterval(drawMatrix, 40);

    return () => {
        window.removeEventListener('resize', matrixResize);
        clearInterval(matrixInterval);
    }
  }, [config.themeColor]); // Re-run effect if themeColor changes

  return (
    <KillSwitch pageName="crash">
      <div className="fixed inset-0 -z-10">
        <canvas ref={canvasRef} id="matrix"></canvas>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm 
            welcomePath="/crash/Razor_1x" 
            title={config.name}
            themeColor={config.themeColor}
            themeGlow={config.themeGlow}
            useCustomGlow={config.isCustom}
        />
      </main>
    </KillSwitch>
  );
}

    