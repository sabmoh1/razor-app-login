
"use client";

import LoginForm from '@/components/login-form';
import KillSwitch from '@/components/kill-switch';

// This is a new page for 'razoor' that reuses the login form component.
// It keeps the visual style of the original 'razor' page.

export default function RazoorHome() {
  return (
    <KillSwitch pageName="razor">
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'grayscale(1) brightness(3)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <div className="text-center mb-8">
            <img src="https://iili.io/f9iNGFj.png" alt="Razor Logo" className="w-64 md:w-80" />
        </div>
        <LoginForm 
          welcomePath="/razoor/welcome" // Changed to navigate to the new razoor welcome page
          title=""
          themeColor="#FFFFFF"
          themeGlow=""
          useCustomGlow={true}
        />
      </main>
    </KillSwitch>
  );
}
