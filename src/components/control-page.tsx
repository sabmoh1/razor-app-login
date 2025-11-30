
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, get, set, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, AlertCircle, Power, PowerOff } from "lucide-react";

interface ControlPageProps {
    pageName: string;
}

export default function ControlPage({ pageName }: ControlPageProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isPageEnabled, setIsPageEnabled] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) return;

        const pageStatusRef = ref(database, `pages/${pageName}/enabled`);
        const unsubscribe = onValue(pageStatusRef, (snapshot) => {
            setIsPageEnabled(snapshot.val() ?? true);
        });

        return () => unsubscribe();
    }, [isAuthenticated, pageName]);


    const handleAuth = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const adminPassRef = ref(database, 'adminoff/pass');
            const snapshot = await get(adminPassRef);
            if (snapshot.exists() && snapshot.val() === password) {
                setIsAuthenticated(true);
            } else {
                setError("Incorrect password.");
            }
        } catch (e) {
            setError("Error verifying password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            const pageStatusRef = ref(database, `pages/${pageName}/enabled`);
            await set(pageStatusRef, !isPageEnabled);
        } catch (e) {
            console.error("Failed to toggle page status", e);
        } finally {
            setIsToggling(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-4">
                    <h1 className="text-2xl font-bold text-center text-red-500">Control Panel</h1>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Master Code"
                            className="bg-gray-800 border-gray-700 h-12 pl-10 pr-4"
                            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
                    <Button onClick={handleAuth} disabled={isLoading} className="w-full h-12 bg-red-600 hover:bg-red-700">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Authenticate
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center space-y-6">
                <h1 className="text-3xl font-bold text-center text-gray-300">
                    <span className="capitalize">{pageName}</span> Control
                </h1>
                <div className={`p-8 rounded-full inline-flex items-center justify-center transition-all duration-300 ${isPageEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className={`p-8 rounded-full inline-flex items-center justify-center ${isPageEnabled ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                        <Button 
                            onClick={handleToggle}
                            disabled={isToggling}
                            className={`w-32 h-32 rounded-full transition-all duration-300 text-white shadow-2xl ${isPageEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                            {isToggling ? (
                                <Loader2 className="h-12 w-12 animate-spin" />
                            ) : isPageEnabled ? (
                                <Power className="h-16 w-16" />
                            ) : (
                                <PowerOff className="h-16 w-16" />
                            )}
                        </Button>
                    </div>
                </div>
                 <div>
                    <p className="text-lg font-semibold">
                        Page is currently: 
                        <span className={isPageEnabled ? 'text-green-400' : 'text-red-500'}>
                            {isPageEnabled ? ' ON' : ' OFF'}
                        </span>
                    </p>
                    <p className="text-xs text-gray-500">Click the button to toggle status.</p>
                </div>
            </div>
        </div>
    );
}
