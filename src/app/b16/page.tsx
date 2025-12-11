
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';

function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}


export default function B16Home() {
  return (
    <KillSwitch pageName="b16">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'hue-rotate(190deg) brightness(0.9)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <LoginForm 
            welcomePath="/b16/welcome" 
            title="B16 TERMINAL"
            themeColor="var(--neon-blue)"
            themeGlow="text-glow-blue"
            validityType="attempts"
            customValidation={(passwordData) => {
                if (isTimeBasedValidity(passwordData?.validity)) {
                    return "This key is not valid for this page. Please use a key with attempts-based access.";
                }
                return null; // No error
            }}
        />
      </main>
    </KillSwitch>
  );
}
