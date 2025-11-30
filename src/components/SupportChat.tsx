
"use client";

import { useState, useRef } from 'react';
import { X, Send, Paperclip, Loader2, Headset } from 'lucide-react';
import axios from 'axios';

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportChat({ isOpen, onClose }: SupportChatProps) {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Limit file size to 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size cannot exceed 5MB.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !file) {
      setError("Please write a message or select a file.");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('message', message);
    if (file) {
      formData.append('photo', file);
    }
    
    // Get user ID from session storage if available
    const userId = sessionStorage.getItem('razor_user_id');

    try {
      await axios.post('/api/support', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-user-id': userId || 'Unknown User'
        },
      });
      setSuccess("Your message has been sent successfully!");
      setMessage('');
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);

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
        <div className="chat-widget fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:max-w-sm h-[70vh] sm:h-auto sm:max-h-[80vh] bg-[#0a192f] border border-cyan-500/30 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Headset size={20} className="text-cyan-400" />
                    Support Chat
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {success && <div className="text-green-400 text-sm">{success}</div>}
                {error && <div className="text-red-400 text-sm">{error}</div>}
                
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full h-32 p-3 bg-gray-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                    disabled={isSending}
                />
                
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                        disabled={isSending}
                    >
                        <Paperclip size={18} />
                        <span className="truncate max-w-[200px]">{file ? file.name : "Attach Image"}</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-cyan-500/20">
                <button
                    onClick={handleSendMessage}
                    disabled={isSending || (!message.trim() && !file)}
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
