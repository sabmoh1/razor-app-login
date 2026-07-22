
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
            setError("All values must be valid numbers (e.g., 1.50).");
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
        if (confirm("Clear all?")) {
            setPredictions(['']);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center p-4 py-10 md:py-20 font-orbitron">
            <div className="w-full max-w-xl">
                <div className="flex items-center justify-between mb-8">
                    <Button onClick={() => router.push('/b16vip/welcome')} variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <div className="flex items-center gap-2 text-blue-500/50">
                        <LayoutDashboard size={20} />
                        <span className="text-xs font-black uppercase">Admin Panel</span>
                    </div>
                </div>
                
                <div className="rounded-2xl bg-black/40 backdrop-blur-2xl border border-blue-500/20 p-6 md:p-10">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">B16VIP SEQUENCE</h1>
                        <p className="text-gray-500 text-[10px] uppercase">Manual Prediction Input</p>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                        {predictions.map((value, index) => (
                            <div key={index} className="flex items-end gap-4">
                                <div className="flex-1">
                                    <Label className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-1 block">
                                        Slot {index + 1}
                                    </Label>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={value}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        placeholder="X.XX"
                                        className="bg-gray-900 border-blue-500/20 h-12 text-blue-400 font-mono text-xl"
                                    />
                                </div>
                                {predictions.length > 1 && (
                                    <button 
                                        onClick={() => handleRemoveField(index)}
                                        className="text-gray-600 hover:text-red-500 pb-3"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button 
                        onClick={handleAddField} 
                        variant="ghost" 
                        className="w-full h-12 border-2 border-dashed border-blue-500/20 hover:border-blue-500/40 text-gray-500 hover:text-blue-400 mb-8"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New Slot
                    </Button>

                    <div className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                <AlertCircle size={16}/> {error}
                            </div>
                        )}

                        {saveSuccess && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center">
                                Predictions Saved Successfully!
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button onClick={handleClear} variant="ghost" className="text-gray-500 hover:text-white uppercase text-xs">
                                Reset
                            </Button>
                            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black h-12 rounded-xl uppercase text-xs">
                                <Save className="mr-2 h-4 w-4" />
                                Save Sequence
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,191,255,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
}
