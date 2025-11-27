
"use client";

import { useEffect, useRef, useState } from 'react';
import LoginForm from '@/components/login-form';
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

type NasserbetsConfig = {
  name: string;
  theme_color: string;
  expires: number;
};

const DEFAULT_CONFIG = {
  name: "NASSERBETS",
  theme_color: "#00d9a3", // Teal
  themeGlow: 'text-glow-teal'
};

export default function NasserbetsHome() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState({ 
    name: DEFAULT_CONFIG.name, 
    themeColor: DEFAULT_CONFIG.theme_color, 
    themeGlow: DEFAULT_CONFIG.themeGlow,
    isCustom: false
  });

  useEffect(() => {
    const configRef = ref(database, 'nasserbets_config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: NasserbetsConfig = snapshot.val();
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
    const letters = '01・〇●■▲▼◆abcdefghijklmnopqrstuvwxyz0123456789';

    function matrixResize(){
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.floor(W / 10) + 1;
      ypos = Array(cols).fill(0);
    }
    window.addEventListener('resize', matrixResize);

    function drawMatrix(){
      if (!ctx) return;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0,0,W,H);
      ctx.font = '12px monospace';
      ypos.forEach((y, ind) => {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        const x = ind * 10;
        ctx.fillStyle = config.themeColor + (0.18 + Math.random()*0.6).toString(16).slice(2,4);
        ctx.fillText(text, x, y);
        if(y > H + Math.random()*700) {
          ypos[ind] = 0;
        } else {
          ypos[ind] = y + 12 + Math.random()*8;
        }
      });
    }
    const matrixInterval = setInterval(drawMatrix, 40);

    return () => {
      window.removeEventListener('resize', matrixResize);
      clearInterval(matrixInterval);
    }
  }, [config.themeColor]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 block"></canvas>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm 
            welcomePath="/nasserbets/Razor_1x" 
            title={config.name}
            themeColor={config.themeColor}
            themeGlow={config.themeGlow}
            useCustomGlow={config.isCustom}
        />
      </main>
    </>
  );
}
