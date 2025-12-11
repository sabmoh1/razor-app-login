
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, ChevronLeft } from "lucide-react";
import type { Platform } from "@/lib/b16/types";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserPlatformStepProps {
  userId: string;
  setUserId: (id: string) => void;
  platforms: Platform[];
  selectedPlatform: string;
  setSelectedPlatform: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function UserPlatformStep({
  userId,
  setUserId,
  platforms,
  selectedPlatform,
  setSelectedPlatform,
  onContinue,
  onBack,
}: UserPlatformStepProps) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center space-y-6 p-4 text-blue-100">
       <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-0 right-4 text-blue-300 hover:bg-blue-500/10 hover:text-white">
         <ChevronLeft className="h-6 w-6" />
      </Button>
      <h1 className="text-2xl md:text-3xl font-bold text-blue-400" style={{fontFamily: 'Audiowide, sans-serif'}}>User & Platform</h1>
      <p className="text-blue-200/70">أدخل معرف المستخدم الخاص بك وحدد المنصة التي تستخدمها.</p>

      <div className="w-full max-w-sm space-y-4">
        <div className="relative">
          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300/50" />
          <Input
            type="text"
            placeholder="Enter your ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-12 pr-10 text-center bg-black/30 border-blue-500/20 text-white placeholder:text-blue-200/40"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4 text-blue-300">Select exactly one platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={cn(
                "group flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg border-2 transition-all duration-200",
                selectedPlatform === platform.id
                  ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/10"
                  : "border-transparent hover:border-blue-500/30 hover:bg-black/40"
              )}
            >
              <div className="relative w-full h-16">
                 <Image
                    src={platform.logo}
                    alt={`${platform.name} Logo`}
                    fill
                    className="object-contain"
                  />
              </div>
              <span className="mt-2 text-sm font-semibold text-blue-200/80 group-hover:text-white">
                {platform.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <Button onClick={onBack} variant="outline" className="w-full h-12 text-lg bg-black/30 border-blue-500/20 hover:bg-blue-900/40 hover:text-white">
            Back
        </Button>
        <Button onClick={onContinue} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white">
            Continue
        </Button>
      </div>
    </div>
  );
}
