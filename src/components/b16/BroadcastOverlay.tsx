
"use client";

import { useState, useEffect } from 'react';

const messages = [
  "جارٍ إنشاء اتصال آمن...",
  "معرف المستخدم قيد التحقق: ",
  "التحقق من سلامة المنصة: ",
  "تجاوز إجراءات مكافحة الغش...",
  "إلغاء قفل واجهة برمجة تطبيقات اللعبة...",
  "حقن البيانات...",
  "تمكين وضع الشبح...",
  "إلغاء تنشيط سجلات الخادم...",
  "جارٍ فك تشفير حزم البيانات...",
  "تم الاتصال بنجاح!",
];

interface BroadcastOverlayProps {
  userId: string;
  platformName: string;
  onComplete: () => void;
}

export default function BroadcastOverlay({ userId, platformName, onComplete }: BroadcastOverlayProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (currentMessageIndex >= messages.length) {
      setTimeout(onComplete, 1000); // Wait a bit after the last message
      return;
    }

    const timer = setTimeout(() => {
      setCurrentMessageIndex(currentMessageIndex + 1);
    }, 700 + Math.random() * 500); // Random delay for realism

    return () => clearTimeout(timer);
  }, [currentMessageIndex, onComplete]);

  const getMessage = (index: number) => {
    let msg = messages[index];
    if (index === 1) msg += userId;
    if (index === 2) msg += platformName;
    return msg;
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 font-mono text-green-400">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-8 animate-pulse">B16 BROADCAST</h1>
        <div className="text-left space-y-2 text-lg">
          {messages.slice(0, currentMessageIndex + 1).map((msg, i) => (
            <p key={i} className="animate-fadeIn">
              <span className="text-green-600">&gt; </span>{getMessage(i)}
            </p>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
