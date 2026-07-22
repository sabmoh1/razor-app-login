
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, ArrowLeft, AlertCircle, Plus, LayoutDashboard } from "lucide-react";

export default function B16VipAdminPage() {
    const router = useRouter();
    const [predictions, setPredictions] = useState<string[]>(['']);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        try {
            const savedPredictions = localStorage.getItem('b16vip_predictions');
            if (savedPredictions) {
                const parsed = JSON.parse(savedPredictions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPredictions(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load predictions from localStorage", e);
        }
    }, []);

    const handleInputChange = (index: number, value: string) => {
        const newPredictions = [...predictions];
        newPredictions[index] = value;
        setPredictions(newPredictions);
    };

    const handleAddField = () => {
        setPredictions([...predictions, '']);
    };

    const handleRemoveField = (index: number) => {
        if (predictions.length <= 1) {
            setPredictions(['']);
            return;
        }
        const newPredictions = predictions.filter((_, i) => i !== index);
        setPredictions(newPredictions);
    };

    const handleSave = () => {
        setError(null);
        setSaveSuccess(false);

        const filledPredictions = predictions.map(p => p.trim()).filter(p => p !== '');
        
        if (filledPredictions.length === 0) {
            setError("Please enter at least one prediction value.");
            return;
        }

        if (filledPredictions.some(p => isNaN(parseFloat(p)))) {
            setError("All values must be valid numbers (e.g., 1.50, 2.00).");
            return;
        }

        try {
            localStorage.setItem('b16vip_predictions', JSON.stringify(filledPredictions));
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                router.push('/b16vip/welcome');
            }, 1200);
        } catch (e) {
            setError("Failed to save to local storage.");
        }
    };
    
    const handleClear = () => {
        if (confirm("Are you sure you want to clear all fields?")) {
            setPredictions(['']);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center p-4 py-10 md:py-20 font-orbitron">
            <div className="w-full max-w-xl">
                <div className="flex items-center justify-between mb-8">
                    <Button onClick={() => router.push('/b16vip/welcome')} variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <ArrowLeft size={18} className="mr-2" />
                        Terminal
                    </Button>
                    <div className="flex items-center gap-2 text-blue-500/50">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-black tracking-widest uppercase">Admin Panel</span>
                    </div>
                </div>
                
                <div className="rounded-3xl bg-black/40 backdrop-blur-2xl border border-blue-500/20 p-6 md:p-10 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">B16VIP SEQUENCE</h1>
                        <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">Manual Input System — Data persistency enabled</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar mb-8">
                        {predictions.map((value, index) => (
                            <div key={index} className="group relative">
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-end gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5 px-1">
                                            <Label className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest">
                                                Prediction Unit {index + 1}
                                            </Label>
                                            {predictions.length > 1 && (
                                                <button 
                                                    onClick={() => handleRemoveField(index)}
                                                    className="text-gray-600 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={value}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            placeholder="X.XX"
                                            className="bg-white/5 border-white/5 h-14 focus:border-blue-500/50 text-blue-400 font-mono text-xl pl-4 rounded-xl transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button 
                        onClick={handleAddField} 
                        variant="ghost" 
                        className="w-full h-14 border-2 border-dashed border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-gray-500 hover:text-blue-400 transition-all rounded-xl mb-10"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        <span className="font-bold tracking-widest uppercase text-xs">Append New Entry</span>
                    </Button>

                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <AlertCircle size={18}/> {error}
                            </div>
                        )}

                        {saveSuccess && (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                                Uplink Successful — Sequence Updated
                            </div>
                        )}

                        <div className="flex gap-4">
                             <Button onClick={handleClear} variant="ghost" className="h-14 px-8 text-gray-600 hover:text-white uppercase text-[10px] font-black tracking-widest">
                                Flush
                            </Button>
                            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black h-14 rounded-2xl shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">
                                <Save className="mr-2 h-5 w-5" />
                                Commit Sequence
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.4); }
            `}</style>
        </div>
    );
}
