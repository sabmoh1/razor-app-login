
"use client";

import { useEffect, useState } from 'react';
import LoginForm from '@/components/login-form';
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import KillSwitch from '@/components/kill-switch';

type NasserbetsConfig = {
  name: string;
  theme_color: string;
  expires: number;
};

const DEFAULT_CONFIG = {
  name: "NASSERBETS",
  theme_color: "#00d9a3", // Teal
  themeGlow: 'text-glow-teal'
};

export default function NasserbetsHome() {
  const [config, setConfig] = useState({ 
    name: DEFAULT_CONFIG.name, 
    themeColor: DEFAULT_CONFIG.theme_color, 
    themeGlow: DEFAULT_CONFIG.themeGlow,
    isCustom: false
  });

  useEffect(() => {
    const configRef = ref(database, 'nasserbets_config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data: NasserbetsConfig = snapshot.val();
        if (data.expires > Date.now()) {
          setConfig({ name: data.name, themeColor: data.theme_color, themeGlow: '', isCustom: true });
        } else {
          setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, themeGlow: DEFAULT_CONFIG.themeGlow, isCustom: false });
        }
      } else {
        setConfig({ name: DEFAULT_CONFIG.name, themeColor: DEFAULT_CONFIG.theme_color, themeGlow: DEFAULT_CONFIG.themeGlow, isCustom: false });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <KillSwitch pageName="nasserbets">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'hue-rotate(120deg) brightness(0.9)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm 
            welcomePath="/nasserbets/Razor_1x" 
            title={config.name}
            themeColor={config.themeColor}
            themeGlow={config.themeGlow}
            useCustomGlow={config.isCustom}
        />
      </main>
    </KillSwitch>
  );
}
