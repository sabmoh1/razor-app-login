
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

const MAX_PREDICTIONS = 10;

export default function RazoorAdminPage() {
    const router = useRouter();
    const [predictions, setPredictions] = useState<string[]>(Array(MAX_PREDICTIONS).fill(''));
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        try {
            const savedPredictions = localStorage.getItem('razoor_predictions');
            if (savedPredictions) {
                const parsed = JSON.parse(savedPredictions);
                const newPredictions = Array(MAX_PREDICTIONS).fill('');
                parsed.forEach((p: string, i: number) => {
                    if (i < MAX_PREDICTIONS) {
                        newPredictions[i] = p;
                    }
                });
                setPredictions(newPredictions);
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

    const handleSave = () => {
        setError(null);
        setSaveSuccess(false);

        const filledPredictions = predictions.map(p => p.trim()).filter(p => p !== '');
        
        if (filledPredictions.some(p => isNaN(parseFloat(p)))) {
            setError("Please enter valid numbers for predictions (e.g., 2.13).");
            return;
        }

        try {
            localStorage.setItem('razoor_predictions', JSON.stringify(filledPredictions));
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                router.push('/razoor/welcome');
            }, 1500);
        } catch (e) {
            setError("Failed to save predictions. Storage might be full.");
        }
    };
    
    const handleClear = () => {
        setPredictions(Array(MAX_PREDICTIONS).fill(''));
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Button onClick={() => router.push('/razoor/welcome')} variant="ghost" className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to Terminal
                </Button>
                
                <div className="rounded-lg bg-gray-800 border border-gray-700 p-6 space-y-6 shadow-2xl">
                    <h1 className="text-2xl font-bold text-center text-white">Admin Predictions</h1>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {predictions.map((value, index) => (
                            <div key={index} className="space-y-1">
                                <Label htmlFor={`pred-${index}`} className="text-sm font-medium text-gray-400">
                                    Prediction #{index + 1}
                                </Label>
                                <Input
                                    id={`pred-${index}`}
                                    type="text"
                                    inputMode="decimal"
                                    value={value}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    placeholder="e.g., 2.13"
                                    className="bg-gray-900 border-gray-600 focus:border-white focus:ring-white"
                                />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {error}</p>
                    )}

                    {saveSuccess && (
                        <p className="text-sm text-green-400">Predictions saved successfully!</p>
                    )}

                    <div className="flex justify-between gap-4 pt-4">
                         <Button onClick={handleClear} variant="destructive" className="flex-1">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All
                        </Button>
                        <Button onClick={handleSave} className="bg-white text-black hover:bg-gray-200 flex-1">
                            <Save className="mr-2 h-4 w-4" />
                            Save & Return
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
