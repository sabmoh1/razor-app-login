
"use client";

import { useEffect, useRef } from 'react';
import LoginForm from '@/components/login-form';

export default function SpiderLoginPage() {
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
    
    const spiders: {x: number, y: number, speed: number}[] = [];
    for(let i = 0; i < 20; i++) {
        spiders.push({
            x: Math.random() * W,
            y: Math.random() * H,
            speed: 1 + Math.random() * 2
        });
    }

    const drawSpider = (spider: {x: number, y: number}) => {
        ctx.fillStyle = 'rgba(255,0,60,0.7)';
        ctx.font = '10px monospace';
        ctx.fillText("╱|╲", spider.x, spider.y);
        ctx.fillText("╭(🕷)╮", spider.x-5, spider.y + 10);
        ctx.fillText("╱ ╲", spider.x, spider.y + 20);
    };


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
      
      // Draw spiders
      spiders.forEach(spider => {
          drawSpider(spider);
          spider.y += spider.speed;
          if (spider.y > H) {
              spider.y = -20;
              spider.x = Math.random() * W;
          }
      });

      // Draw matrix
      ctx.fillStyle = 'rgba(255,0,60,0.7)';
      ctx.font = '12px monospace';
      ypos.forEach((y, ind) => {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        const x = ind * 10;
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
        <LoginForm theme="red" welcomePath="/spider/Razor_1x" title="SPIDER BET" />
      </main>
    </>
  );
}
