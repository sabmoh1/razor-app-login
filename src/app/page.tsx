"use client";

import { useEffect, useRef } from 'react';
import CreatePasswordForm from '@/components/create-password-form';
import LoginForm from '@/components/login-form';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        ctx.fillStyle = 'rgba(0,255,120,'+ (0.18 + Math.random()*0.6) +')';
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
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 block"></canvas>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <div className="absolute top-4 right-4">
          <CreatePasswordForm adminPassword={process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''} />
        </div>
        <LoginForm />
      </main>
    </>
  );
}
