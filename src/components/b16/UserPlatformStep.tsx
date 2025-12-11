
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
    <div className="relative flex flex-col items-center justify-center text-center space-y-6 p-4">
       <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-0 left-4">
         <ChevronLeft className="h-6 w-6" />
      </Button>
      <h1 className="text-2xl md:text-3xl font-bold text-primary">معرف المستخدم والمنصة</h1>
      <p className="text-muted-foreground max-w-md">
        أدخل معرف المستخدم الخاص بك وحدد المنصة التي تستخدمها.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="معرف المستخدم الخاص بك"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-12 pl-10 text-center"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">اختر المنصة</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={cn(
                "group flex flex-col items-center justify-center p-4 bg-secondary rounded-lg border-2 transition-all",
                selectedPlatform === platform.id
                  ? "border-primary scale-105"
                  : "border-transparent hover:border-primary/50"
              )}
            >
              <Image
                src={platform.logo}
                alt={`${platform.name} Logo`}
                width={80}
                height={40}
                className="h-10 object-contain grayscale group-hover:grayscale-0 transition-all"
                style={{ filter: selectedPlatform === platform.id ? 'none' : 'grayscale(100%)' }}
              />
              <span className="mt-2 text-sm font-semibold text-muted-foreground group-hover:text-foreground">
                {platform.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={onContinue} className="w-full max-w-sm h-12 text-lg mt-6">
        متابعة
      </Button>
    </div>
  );
}
