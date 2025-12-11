
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound } from "lucide-react";
import Image from "next/image";

interface KeyStepProps {
  appKey: string;
  setAppKey: (key: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
}

export default function KeyStep({ appKey, setAppKey, onVerify, isVerifying }: KeyStepProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 p-4">
      <Image src="https://i.ibb.co/bFv3x9M/B16-VIP-logo.png" alt="B16 VIP Logo" width={200} height={200} className="mb-4" />
      <h1 className="text-2xl md:text-3xl font-bold text-primary">أدخل مفتاح التطبيق</h1>
      <p className="text-muted-foreground max-w-md">
        للوصول إلى النظام، يرجى إدخال مفتاح واجهة برمجة التطبيقات (API) المقدم لك.
      </p>
      <div className="w-full max-w-sm space-y-4">
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="password"
            placeholder="المفتاح الخاص بك"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            className="h-12 pl-10 text-center tracking-widest"
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
          />
        </div>
        <Button onClick={onVerify} disabled={isVerifying} className="w-full h-12 text-lg">
          {isVerifying ? <Loader2 className="animate-spin" /> : "تحقق"}
        </Button>
      </div>
    </div>
  );
}
