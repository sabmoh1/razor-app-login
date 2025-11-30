
"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, AlertCircle, MessageSquare, Clock, User, Trash2 } from "lucide-react";
import { format } from 'date-fns';

type SupportMessage = {
    id: string;
    telegramUser: string;
    message: string;
    createdAt: number;
};

export default function NasserusdtAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [messages, setMessages] = useState<SupportMessage[]>([]);

    useEffect(() => {
        if (!isAdmin) return;

        const messagesRef = ref(database, 'nasserusdt_support');
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const messageList: SupportMessage[] = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                })).sort((a, b) => b.createdAt - a.createdAt);
                setMessages(messageList);
            } else {
                setMessages([]);
            }
            setIsLoading(false);
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
    
    const handleDeleteMessage = async (messageId: string) => {
        if (!window.confirm("Are you sure you want to delete this message?")) {
            return;
        }
        try {
            const messageRef = ref(database, `nasserusdt_support/${messageId}`);
            await remove(messageRef);
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#0a192f] text-white flex items-center justify-center p-4">
                 <style jsx global>{`body { font-family: "Poppins", sans-serif; }`}</style>
                <div className="w-full max-w-sm space-y-4 rounded-2xl bg-black/30 p-8 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
                    <h1 className="text-2xl font-bold text-center text-cyan-400">NasserUSDT Support</h1>
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
                    <Button onClick={handleAdminLogin} disabled={isAuthenticating} className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-black font-bold">
                        {isAuthenticating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Authenticate
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a192f] text-white p-4 sm:p-8">
            <style jsx global>{`body { font-family: "Poppins", sans-serif; }`}</style>
            <div className="w-full max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-center text-cyan-400" style={{ textShadow: '0 0 15px rgba(0, 191, 255, 0.4)' }}>Support Messages</h1>
                    <p className="text-center text-cyan-200/70">Live feed of user support requests</p>
                </header>
                
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin"/>
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((msg) => (
                            <div key={msg.id} className="relative bg-black/30 border border-cyan-500/20 rounded-lg p-4 shadow-lg animate-[fadeIn_0.5s_ease-out]">
                                <div className="flex justify-between items-start mb-3 border-b border-cyan-500/10 pb-3">
                                    <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                                        <User size={16} />
                                        <span>@{msg.telegramUser}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Clock size={14} />
                                        <span>{format(new Date(msg.createdAt), "Pp")}</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MessageSquare size={18} className="text-cyan-400/70 mt-1 flex-shrink-0" />
                                    <p className="text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteMessage(msg.id)} 
                                    className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                    aria-label="Delete message"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-black/20 rounded-lg border border-cyan-500/10">
                            <MessageSquare size={40} className="mx-auto text-gray-500 mb-4"/>
                            <h3 className="text-xl font-semibold text-gray-400">No Messages Yet</h3>
                            <p className="text-gray-500">Support messages from users will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
