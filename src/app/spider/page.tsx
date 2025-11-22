
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SpiderIntroPage = () => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationState, setAnimationState] = useState('intro'); // intro, text, final

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    // Matrix effect
    const letters = '0123456789ABCDEF';
    const fontSize = 14;
    let cols = Math.floor(W / fontSize);
    let drops = Array(cols).fill(1);

    // Spider
    const spiderAscii = [
        "  /\\  ",
        " (  ) ",
        "  \\/  ",
        "/_  _\\",
        "  /\\  ",
        " /  \\ "
    ];
    let spiderX = Math.random() * W;
    let spiderY = -50;
    let spiderSpeedX = (Math.random() - 0.5) * 4;
    let spiderSpeedY = 1.5;
    
    let frameId: number;

    const draw = () => {
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff003c';
      ctx.font = `${fontSize}px monospace`;

      // Matrix characters
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > H && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      // Spider drawing and logic
      if (animationState === 'intro') {
        spiderX += spiderSpeedX;
        spiderY += spiderSpeedY;

        if(spiderX > W || spiderX < 0) spiderSpeedX *= -1;
        if(spiderY > H/2.5) {
             spiderSpeedY = 0;
             spiderSpeedX = (W/2 - spiderX) / 100;
             if (Math.abs(W/2 - spiderX) < 10) {
                 setAnimationState('text');
             }
        }
        
        ctx.font = `18px monospace`;
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 10;
        spiderAscii.forEach((line, index) => {
            ctx.fillText(line, spiderX - 30, spiderY + (index * 18));
        });
        ctx.shadowBlur = 0;
      }
      
      if (animationState === 'text' || animationState === 'final') {
          // Explosion effect
          if(animationState === 'text') {
            for(let i=0; i<30; i++) {
                ctx.fillStyle = `rgba(255, 0, 60, ${Math.random()})`;
                ctx.fillRect(W/2 + (Math.random() - 0.5) * 150, H/2 + (Math.random() - 0.5) * 150, 3, 3);
            }
          }

          ctx.textAlign = 'center';
          if (animationState === 'text') {
              ctx.font = 'bold 70px monospace';
              ctx.fillText("SPIDER BET", W/2, H/2);
          } else { // final state
              ctx.font = 'bold 70px Orbitron, sans-serif';
              ctx.shadowColor = '#ff003c';
              ctx.shadowBlur = 20;
              ctx.fillText("SPIDER BET", W/2, H/2);
              ctx.shadowBlur = 0;
          }
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();
    
    // Sequence timeouts
    if (animationState === 'intro') {
      // This timeout is now handled by spider position
    }
    
    const textTimeout = setTimeout(() => {
        if(animationState === 'text') setAnimationState('final');
    }, 2000);

    const redirectTimeout = setTimeout(() => {
        router.push('/spider/login');
    }, 4000);


    const handleResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      cols = Math.floor(W / fontSize);
      drops = Array(cols).fill(1);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(textTimeout);
      clearTimeout(redirectTimeout);
    };
  }, [router, animationState]);

  return (
    <div style={{ background: '#000', overflow: 'hidden', height: '100vh', width: '100vw' }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SpiderIntroPage;
