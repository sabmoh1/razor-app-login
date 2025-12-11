
"use client";

import { Button } from "@/components/ui/button";
import { RotateCw, Play } from "lucide-react";
import Image from "next/image";
import type { Row } from "@/lib/b16/types";

interface GalleryStepProps {
  rows: Row[];
  hasStarted: boolean;
  onStart: () => void;
  onReset: () => void;
  attemptsLeft: number;
}

const SequenceCell = ({ char, revealed }: { char: string; revealed: boolean }) => {
  const isGood = char === '+';
  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20">
      <Image
        src={revealed ? (isGood ? '/apple_good.png' : '/apple_bad.png') : '/wood.jpg'}
        alt={revealed ? (isGood ? 'Good Apple' : 'Bad Apple') : 'Wood'}
        fill
        className="object-contain transition-all duration-500"
        style={{ opacity: revealed ? 1 : 0.5, transform: revealed ? 'scale(1)' : 'scale(0.9)' }}
      />
    </div>
  );
};

export default function GalleryStep({
  rows,
  hasStarted,
  onStart,
  onReset,
  attemptsLeft
}: GalleryStepProps) {
  const reversedRows = [...rows].reverse();

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-4 text-blue-100">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-400" style={{fontFamily: 'Audiowide, sans-serif'}}>B16 VIP</h1>
      <p className="text-blue-200/70 max-w-md text-sm">
        * You are only one step away from achieving financial freedom with B16.
        <br/>
        You have <span className="font-bold text-blue-300">{attemptsLeft}</span> attempts left.
      </p>

      <div className="w-full max-w-2xl space-y-2">
        {reversedRows.map((row) => (
          <div key={row.id} className="grid grid-cols-[1fr,5fr] items-center gap-4 py-1">
            <div className="text-right">
              <p className="font-semibold text-sm md:text-base text-blue-200/80">{row.rate} ×</p>
            </div>
            <div className="flex justify-center items-center gap-1 md:gap-2">
              {row.seq.split('').map((char, index) => (
                <SequenceCell key={index} char={char} revealed={hasStarted} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
         <Button onClick={onReset} variant="outline" className="w-32 h-12 text-lg bg-black/30 border-blue-500/20 hover:bg-blue-900/40 hover:text-white">
            <RotateCw className="mr-2 h-5 w-5" />
            Reset
        </Button>
        <Button onClick={onStart} disabled={attemptsLeft <= 0} className="w-32 h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white">
            <Play className="mr-2 h-5 w-5" />
            {hasStarted ? "Again" : "Start"}
        </Button>
      </div>
    </div>
  );
}
