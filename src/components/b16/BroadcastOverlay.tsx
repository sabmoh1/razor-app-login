
"use client";

import { useState, useEffect } from 'react';

const messages = [
  "Connecting...",
  "Authenticating...",
  "Fetching values...",
  "Applying sequence...",
  "Connected Successfully!"
];

interface BroadcastOverlayProps {
  userId: string;
  platformName: string;
  onComplete: () => void;
}

export default function BroadcastOverlay({ userId, platformName, onComplete }: BroadcastOverlayProps) {
  const [currentMessage, setCurrentMessage] = useState(`Connecting to ID ${userId}...`);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const totalDuration = 4500;
    const stepDuration = totalDuration / messages.length;

    const timer = setInterval(() => {
      setStep(prevStep => {
        if (prevStep < messages.length - 1) {
          setCurrentMessage(messages[prevStep + 1]);
          return prevStep + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 850);
          return prevStep;
        }
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [onComplete]);

  const fullMessage = (index: number) => {
    let msg = messages[index];
    if (index === 0) return `Connecting to ID ${userId}...`;
    if (index === 1) return `Connecting to platform ${platformName}...`;
    return msg;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-2xl text-center">
        <div className="w-16 h-16 border-8 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
        <p id="bmsg" className="text-xl mb-2">{fullMessage(step)}</p>
        <p id="bsub" className="text-blue-300/70">{`Step ${step + 1} of ${messages.length}`}</p>
      </div>
    </div>
  );
}
