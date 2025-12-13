
"use client";

import { useEffect, useState } from 'react';
import LoginForm from '@/components/login-form';
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import KillSwitch from '@/components/kill-switch';
import { cn } from '@/lib/utils';

type LadybetConfig = {
  name: string;
  theme_color: string;
  expires: number;
};

const DEFAULT_CONFIG = {
  name: "LADYBET",
  theme_color: "#ff69b4", // Pink
};

export default function LadybetHome() {
  const [config, setConfig] = useState({ 
    name: DEFAULT_CONFIG.name, 
    themeColor: DEFAULT_CONFIG.theme_color, 
    isCustom: false
  });

  useEffect(() => {
    const configRef = ref(database, 'ladybet_config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: LadybetConfig = snapshot.val();
        if (data.expires > Date.now()) {
          setConfig({ name: data.name, themeColor: data.theme_color, isCustom: true });
        } else {
          setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, isCustom: false });
        }
      } else {
        setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, isCustom: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <KillSwitch pageName="ladybet">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://i.pinimg.com/originals/d2/3e/e2/d23ee267eeddba306eb19d98198a72e0.gif')",
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/40"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm 
            welcomePath="/ladybet/Razor_1x" 
            title={config.name}
            themeColor={config.themeColor}
            themeGlow={''}
            useCustomGlow={true}
        />
      </main>
    </KillSwitch>
  );
}
