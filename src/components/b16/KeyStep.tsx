
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";

interface KeyStepProps {
  appKey: string;
  setAppKey: (key: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
}

export default function KeyStep({ appKey, setAppKey, onVerify, isVerifying }: KeyStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-4 text-blue-100">
      <h1 className="text-3xl md:text-4xl font-bold text-blue-400" style={{fontFamily: 'Audiowide, sans-serif'}}>B16 VIP</h1>
      <p className="text-blue-200/70 max-w-md">
        Enter the application key then press Verify
      </p>
      <div className="w-full max-w-sm space-y-4">
        <div className="relative">
          <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300/50" />
          <Input
            type="password"
            placeholder="Enter key"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            className="h-12 pr-10 text-center tracking-widest bg-black/30 border-blue-500/20 text-white placeholder:text-blue-200/40"
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
          />
        </div>
        <Button onClick={onVerify} disabled={isVerifying} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white">
          {isVerifying ? <Loader2 className="animate-spin" /> : "Verify"}
        </Button>
      </div>
    </div>
  );
}
