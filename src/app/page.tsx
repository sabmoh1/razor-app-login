"use client";

import { useEffect, useRef, useState } from 'react';
import LoginForm from '@/components/login-form';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HeartCrack, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const router = useRouter();

  const handleAdminSubmit = () => {
    if (adminPassword === "ZR1") {
      router.push('/virus');
    } else {
      setAdminError("Incorrect admin password.");
      setAdminPassword("");
    }
  };

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
      <div className="fixed top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsDialogOpen(true)}
          className="text-neon-white/70 hover:text-neon-red hover:bg-neon-red/10"
        >
          <HeartCrack className="h-6 w-6" />
        </Button>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm />
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-black/80 border-neon-red/50 text-neon-white font-orbitron">
          <DialogHeader>
            <DialogTitle className="text-neon-red text-glow-red">VIRUS MODE ACCESS</DialogTitle>
            <DialogDescription className="text-neon-white/70 font-code">
              Enter admin credentials to switch modes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
             {adminError && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm flex items-center gap-2 font-code">
                <AlertCircle className="h-5 w-5" />
                <span>{adminError}</span>
              </div>
            )}
            <Input
              type="password"
              placeholder="> Admin Password..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
              className="font-code bg-transparent border-2 border-neon-red/50 focus:border-neon-red focus:ring-neon-red text-neon-white placeholder:text-neon-red/50"
            />
            <Button 
              onClick={handleAdminSubmit} 
              className="w-full bg-neon-red/80 text-black font-bold hover:bg-neon-red"
            >
              INITIATE
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
