
"use client";

import { Button } from "@/components/ui/button";
import { BarChart, RotateCw, Play } from "lucide-react";
import type { Row } from "@/lib/b16/types";

interface GalleryStepProps {
  rows: Row[];
  hasStarted: boolean;
  onStart: () => void;
  onReset: () => void;
  attemptsLeft: number;
}

const SequenceCell = ({ char }: { char: string }) => {
  const isPositive = char === '+';
  return (
    <div className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-sm font-mono text-lg ${
      isPositive ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
    }`}>
      {char}
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
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-4">
      <div className="flex items-center gap-2 text-primary text-2xl md:text-3xl font-bold">
        <BarChart className="w-8 h-8" />
        <h1>معرض B16</h1>
      </div>
      <p className="text-muted-foreground max-w-md">
        اضغط على "بدء" للكشف عن التسلسل. لديك <span className="font-bold text-primary">{attemptsLeft}</span> محاولات متبقية.
      </p>

      <div className="w-full max-w-2xl space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-3 items-center gap-4 p-3 bg-secondary rounded-lg">
            <div className="text-left">
              <p className="font-semibold text-sm md:text-base">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.value}</p>
            </div>
            <div className="col-span-2 flex justify-end items-center gap-1 md:gap-2">
              {row.seq.split('').map((char, index) => (
                <SequenceCell key={index} char={char} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={onStart} disabled={attemptsLeft <= 0} className="w-32 h-12 text-lg bg-green-600 hover:bg-green-700">
            <Play className="mr-2 h-5 w-5" />
            {hasStarted ? "إعادة" : "بدء"}
        </Button>
        <Button onClick={onReset} variant="outline" className="w-32 h-12 text-lg">
            <RotateCw className="mr-2 h-5 w-5" />
            إعادة ضبط
        </Button>
      </div>
    </div>
  );
}
