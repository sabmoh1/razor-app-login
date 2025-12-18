
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, get, set, push, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Palette, Edit3, Link, Clock, Save, AlertCircle, History } from "lucide-react";
import { cn } from "@/lib/utils";

type CrashConfig = {
    name: string;
    social_handle: string;
    theme_color: string;
    expires: number;
};

type HistoryEntry = {
    name: string;
    social_handle: string;
    durationLabel: string;
    theme_color: string;
    timestamp: number;
    user?: string; // Optional: to track which admin made the change
};

const DURATION_OPTIONS = [
    { label: "30 Minutes", value: 30 * 60 * 1000 },
    { label: "1 Hour", value: 60 * 60 * 1000 },
    { label: "6 Hours", value: 6 * 60 * 60 * 1000 },
    { label: "12 Hours", value: 12 * 60 * 60 * 1000 },
    { label: "24 Hours", value: 24 * 60 * 60 * 1000 },
];

export default function CrashAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const [config, setConfig] = useState<Omit<CrashConfig, 'expires'>>({
        name: "CRASH",
        social_handle: "Instagram : nasserbets",
        theme_color: "#00d9a3",
    });
    const [duration, setDuration] = useState(DURATION_OPTIONS[1].value);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    useEffect(() => {
        if(!isAdmin) return;

        // Fetch current config
        const configRef = ref(database, 'crash_config');
        const fetchConfig = async () => {
            const snapshot = await get(configRef);
            if (snapshot.exists()) {
                const data: CrashConfig = snapshot.val();
                if (data.expires > Date.now()) {
                    setConfig({
                        name: data.name,
                        social_handle: data.social_handle,
                        theme_color: data.theme_color
                    });
                }
            }
        };
        fetchConfig();

        // Listen for history changes
        const historyRef = ref(database, 'crash_config_history');
        const unsubscribe = onValue(historyRef, (snapshot) => {
            const data: Record<string, HistoryEntry> = snapshot.val();
            if (data) {
                const historyList = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
                setHistory(historyList);
            }
        });

        return () => unsubscribe();

    }, [isAdmin]);

    const handleAdminLogin = async () => {
        setAuthError(null);
        setIsAuthenticating(true);
        try {
            const adminCodeRef = ref(database, 'admin/password');
            const snapshot = await get(adminCodeRef);
            if (snapshot.exists() && snapshot.val() === adminCode) {
                setIsAdmin(true);
            } else {
                setAuthError("Incorrect admin code.");
            }
        } catch (e) {
            setAuthError("Error verifying admin code.");
        } finally {
            setIsAuthenticating(false);
        }
    };
    
    const handleSaveConfig = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        const expires = Date.now() + duration;
        const newConfig: CrashConfig = { ...config, expires };
        const selectedDuration = DURATION_OPTIONS.find(d => d.value === duration);

        try {
            // 1. Save the current config
            const configRef = ref(database, 'crash_config');
            await set(configRef, newConfig);

            // 2. Log the change to history
            const historyRef = ref(database, 'crash_config_history');
            const logEntry: HistoryEntry = {
                name: config.name,
                social_handle: config.social_handle,
                theme_color: config.theme_color,
                durationLabel: selectedDuration ? selectedDuration.label : "Unknown",
                timestamp: Date.now()
            };
            await push(historyRef, logEntry);

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error("Failed to save config:", e);
        } finally {
            setIsSaving(false);
        }
    }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, theme_color: e.target.value }));
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-4">
                    <h1 className="text-2xl font-bold text-center text-teal-400" style={{ textShadow: '0 0 8px #059669' }}>Crash Admin</h1>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            type="password"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            placeholder="Enter Admin Code"
                            className="bg-gray-800 border-gray-700 h-12 pl-10 pr-4"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                        />
                    </div>
                    {authError && <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {authError}</p>}
                    <Button onClick={handleAdminLogin} disabled={isAuthenticating} className="w-full h-12 bg-teal-500 hover:bg-teal-600">
                        {isAuthenticating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Authenticate
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-start p-4 space-y-8">
            <div className="w-full max-w-lg rounded-lg bg-gray-800 border border-gray-700 p-6 space-y-6">
                <h1 className="text-2xl font-bold text-center text-teal-400" style={{ textShadow: '0 0 12px #14b8a6' }}>Crash Control Panel</h1>

                <div className="space-y-2">
                    <Label htmlFor="page-name" className="flex items-center gap-2"><Edit3 size={16}/> Page Name</Label>
                    <Input id="page-name" value={config.name} onChange={(e) => setConfig(prev => ({...prev, name: e.target.value}))} className="bg-gray-700 border-gray-600"/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="social-handle" className="flex items-center gap-2"><Link size={16}/> Social Handle</Label>
                    <Input id="social-handle" value={config.social_handle} onChange={(e) => setConfig(prev => ({...prev, social_handle: e.target.value}))} className="bg-gray-700 border-gray-600"/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="theme-color" className="flex items-center gap-2"><Palette size={16}/> Theme Color</Label>
                    <div className="flex items-center gap-4">
                        <Input id="theme-color" type="color" value={config.theme_color} onChange={handleColorChange} className="p-1 h-10 w-16 bg-gray-700 border-gray-600 cursor-pointer"/>
                        <div className="w-full h-10 rounded" style={{backgroundColor: config.theme_color, boxShadow: `0 0 15px ${config.theme_color}`}}></div>
                    </div>
                </div>

                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Clock size={16}/> Activation Duration</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DURATION_OPTIONS.map(opt => (
                            <Button key={opt.value} variant="outline" onClick={() => setDuration(opt.value)} className={cn("bg-gray-700 border-gray-600 hover:bg-gray-600", duration === opt.value && "ring-2 ring-teal-400")}>
                                {opt.label}
                            </Button>
                        ))}
                    </div>
                </div>
                
                <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-lg font-bold">
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {saveSuccess ? "Saved Successfully!" : "Save and Activate"}
                </Button>
            </div>
            
            <div className="w-full max-w-lg rounded-lg bg-gray-800 border border-gray-700 p-6 space-y-4">
                 <h2 className="text-xl font-bold text-center text-teal-400 flex items-center justify-center gap-2"><History size={20}/> History</h2>
                 <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                    {history.length > 0 ? (
                        history.map((entry, index) => (
                            <div key={index} className="bg-gray-700/50 p-3 rounded-md text-sm border-l-4" style={{borderColor: entry.theme_color}}>
                                <div className="flex justify-between items-start">
                                    <div className="font-bold">{entry.name}</div>
                                    <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</div>
                                </div>
                                <div className="text-gray-300 text-xs mt-1">{entry.social_handle}</div>
                                <div className="text-xs mt-1">Duration: <span className="font-semibold">{entry.durationLabel}</span></div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No history yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
}
