
"use client";

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Loader2, ServerCrash } from 'lucide-react';

interface KillSwitchProps {
    pageName: string;
    children: React.ReactNode;
}

export default function KillSwitch({ pageName, children }: KillSwitchProps) {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

    useEffect(() => {
        const pageStatusRef = ref(database, `pages/${pageName}/enabled`);
        const unsubscribe = onValue(pageStatusRef, (snapshot) => {
            // If the value is null or undefined, default to true (enabled)
            setIsEnabled(snapshot.val() ?? true);
        });

        return () => unsubscribe();
    }, [pageName]);

    if (isEnabled === null) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500"/>
                <p className="mt-4 text-gray-500">Connecting to server...</p>
            </div>
        );
    }

    if (!isEnabled) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <ServerCrash className="h-24 w-24 text-red-500" />
                <h1 className="text-4xl font-bold mt-8 text-red-500" style={{textShadow: '0 0 10px rgba(239, 68, 68, 0.5)'}}>SYSTEM OFFLINE</h1>
                <p className="mt-4 text-lg text-gray-400 text-center">The system is currently undergoing maintenance. Please try again later.</p>
            </div>
        );
    }

    return <>{children}</>;
}
