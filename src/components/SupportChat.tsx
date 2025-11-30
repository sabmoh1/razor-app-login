
"use client";

import { useState } from 'react';
import { X, Send, Loader2, Headset, AtSign } from 'lucide-react';
import axios from 'axios';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportChat({ isOpen, onClose }: SupportChatProps) {
  const [telegramUser, setTelegramUser] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!telegramUser.trim()) {
        setError("Please provide your Telegram username.");
        return;
    }
    if (!message.trim()) {
      setError("Please write a message.");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/api/support', {
        telegramUser,
        message
      });
      setSuccess("Your message has been sent successfully!");
      setTelegramUser('');
      setMessage('');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2500);

    } catch (err) {
      setError("Failed to send message. Please try again later.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
        <style jsx>{`
            .chat-widget {
                animation: slideInUp 0.3s ease-out;
            }
            @keyframes slideInUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            .chat-backdrop {
                animation: fadeIn 0.3s ease;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `}</style>
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 chat-backdrop"
            onClick={onClose}
        ></div>
        <div className="chat-widget fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:max-w-sm h-auto sm:max-h-[80vh] bg-[#0a192f] border border-cyan-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Headset size={20} className="text-cyan-400" />
                    Support
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {success && <div className="text-green-400 text-sm p-3 bg-green-500/10 border border-green-500/20 rounded-lg">{success}</div>}
                {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
                
                <div className="relative">
                     <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/70" />
                     <input
                        value={telegramUser}
                        onChange={(e) => setTelegramUser(e.target.value)}
                        placeholder="Your Telegram Username"
                        className="w-full p-3 pl-10 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                        disabled={isSending}
                    />
                </div>

                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue..."
                    className="w-full h-36 p-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    disabled={isSending}
                />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-cyan-500/20">
                <button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim() || !telegramUser.trim()}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                    {isSending ? "Sending..." : "Send Message"}
                </button>
            </div>
        </div>
    </>
  );
}
