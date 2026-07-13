
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Loader2, AlertCircle, ArrowRight, User, ShieldCheck, CheckCircle2, Server, ShieldAlert } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, get, remove, update } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z
    .string()
    .min(1, { message: "Password is required." }),
});

export type LoginFormProps = {
  welcomePath?: string;
  title?: string;
  themeColor: string;
  themeGlow: string;
  useCustomGlow?: boolean;
};

export default function LoginForm({ 
    welcomePath = '/Razor_1x', 
    title = 'RAZOR TERMINAL',
    themeColor,
    themeGlow,
    useCustomGlow = false,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [currentId, setCurrentId] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  const formStyle = {
    '--theme-color': themeColor,
    '--theme-color-op-10': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.1)` : `${themeColor}1a`,
    '--theme-color-op-30': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.3)` : `${themeColor}4d`,
    '--theme-color-op-80': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.8)` : `${themeColor}cc`,
  } as React.CSSProperties;
  
  const dynamicGlowStyle = {
      color: themeColor,
      textShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}`
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setCurrentId(values.userId);
    setIsVerifying(true);
    setVerifyStep(0);

    // Step 0: Analyzing Terminal ID
    await new Promise(r => setTimeout(r, 1200));
    setVerifyStep(1);

    startTransition(async () => {
      try {
        const passwordsRef = ref(database, 'passwords');
        const snapshot = await get(passwordsRef);

        if (snapshot.exists()) {
          const allPasswords = snapshot.val();
          let isValid = false;
          let passwordKey: string | null = null;
          let passwordData: any = null;

          for (const key in allPasswords) {
            const dbPass = allPasswords[key].password || allPasswords[key].rz;
            if (dbPass === values.password) {
              isValid = true;
              passwordKey = key;
              passwordData = allPasswords[key];
              break;
            }
          }

          if (isValid && passwordKey && passwordData) {
            const currentUses = typeof passwordData.uses === 'string' ? parseInt(passwordData.uses) : passwordData.uses;
            
            if (currentUses !== undefined && currentUses <= 0) {
                setVerifyStep(-1);
                setError("ACCESS DENIED: KEY USAGE DEPLETED");
                setTimeout(() => setIsVerifying(false), 2000);
                return;
            }

            // Step 1 Success: Validating Security Key
            await new Promise(r => setTimeout(r, 1200));
            setVerifyStep(2);

            // Step 2 Success: Connecting to Servers
            await new Promise(r => setTimeout(r, 1500));
            setVerifyStep(3);

            // Final Step Success: Access Granted
            await new Promise(r => setTimeout(r, 1000));
            
            sessionStorage.setItem('razor_user_id', values.userId);
            const validityValue = passwordData.validity || '11m';
            sessionStorage.setItem('razor_session_validity', validityValue);

            const keyRef = ref(database, `passwords/${passwordKey}`);
            if (currentUses !== undefined) {
              if (currentUses > 1) {
                await update(keyRef, { uses: currentUses - 1 });
              } else {
                await remove(keyRef);
              }
            }
            router.push(welcomePath);
          } else {
            setVerifyStep(-1);
            setError("AUTHENTICATION FAILED: INVALID KEY");
            setTimeout(() => setIsVerifying(false), 2000);
          }
        } else {
          setVerifyStep(-1);
          setError("SYSTEM ERROR: DATABASE UNREACHABLE");
          setTimeout(() => setIsVerifying(false), 2000);
        }
      } catch (error: any) {
        setVerifyStep(-1);
        setError("CONNECTION ERROR: RETRY LATER");
        setTimeout(() => setIsVerifying(false), 2000);
      }
    });
  }

  return (
    <div className="w-full max-w-md font-orbitron" style={formStyle}>
      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <div className="w-full max-w-xs space-y-8">
              <div className="text-center space-y-2">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-white/10 blur-xl rounded-full"></div>
                  {verifyStep === -1 ? (
                    <ShieldAlert className="relative h-16 w-16 text-red-500 mx-auto" />
                  ) : verifyStep === 3 ? (
                    <ShieldCheck className="relative h-16 w-16 text-green-500 mx-auto animate-pulse" />
                  ) : (
                    <Loader2 className="relative h-16 w-16 text-white/40 animate-spin mx-auto" />
                  )}
                </div>
                <h2 className={`text-xl font-bold tracking-widest uppercase mt-4 ${verifyStep === -1 ? 'text-red-500' : 'text-white'}`}>
                  {verifyStep === -1 ? 'Security Alert' : 'System Analysis'}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Step 1: Terminal ID */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <User size={16} className={verifyStep >= 1 ? 'text-green-500' : 'text-white/20'} />
                    <span className={`text-[10px] tracking-widest uppercase ${verifyStep >= 1 ? 'text-green-500' : 'text-white/40'}`}>Scanning Terminal ID</span>
                  </div>
                  {verifyStep >= 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-green-500 font-mono">[{currentId}]</span>
                      <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                  ) : <Loader2 size={12} className="animate-spin text-white/20" />}
                </div>

                {/* Step 2: Access Key */}
                <div className={`flex items-center justify-between transition-opacity duration-500 ${verifyStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="flex items-center gap-3">
                    <Lock size={16} className={verifyStep >= 2 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-white/20'} />
                    <span className={`text-[10px] tracking-widest uppercase ${verifyStep >= 2 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-white/40'}`}>Verifying Access Key</span>
                  </div>
                  {verifyStep >= 2 ? <CheckCircle2 size={14} className="text-green-500" /> : verifyStep === -1 ? <ShieldAlert size={14} className="text-red-500" /> : verifyStep >= 1 ? <Loader2 size={12} className="animate-spin text-white/20" /> : null}
                </div>

                {/* Step 3: Server Connection */}
                <div className={`flex items-center justify-between transition-opacity duration-500 ${verifyStep >= 2 ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="flex items-center gap-3">
                    <Server size={16} className={verifyStep >= 3 ? 'text-green-500' : 'text-white/20'} />
                    <span className={`text-[10px] tracking-widest uppercase ${verifyStep >= 3 ? 'text-green-500' : 'text-white/40'}`}>Establishing Uplink</span>
                  </div>
                  {verifyStep >= 3 ? <CheckCircle2 size={14} className="text-green-500" /> : verifyStep >= 2 ? <Loader2 size={12} className="animate-spin text-white/20" /> : null}
                </div>
              </div>

              {verifyStep === -1 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 text-center">
                   <p className="text-red-500 text-[9px] font-bold tracking-widest uppercase">{error}</p>
                </div>
              )}

              {verifyStep === 3 && (
                <div className="text-center animate-pulse">
                   <p className="text-green-500 text-[10px] font-black tracking-[0.4em] uppercase">Access Granted</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-10">
        {title && (
          <h1 
            className={`text-5xl font-black uppercase tracking-tighter ${!useCustomGlow ? themeGlow : ''}`} 
            style={useCustomGlow ? dynamicGlowStyle : {color: themeColor}}
          >
            {title}
          </h1>
        )}
        <div className="flex items-center justify-center gap-2 text-white/40 text-[10px] mt-2 tracking-[0.3em] uppercase">
          <ShieldCheck size={12} />
          <span>Security Protocol Active</span>
        </div>
      </div>
      
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--theme-color)] shadow-[0_0_15px_var(--theme-color)]"></div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && !isVerifying && (
              <div className="bg-red-500/10 border-l-4 border-red-500 text-red-500 p-4 text-xs font-mono flex items-center gap-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                   <div className="relative group">
                     <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="TERMINAL ID"
                        className="bg-black/40 border-white/10 focus:border-[var(--theme-color)] text-white pl-12 h-14 text-sm tracking-widest rounded-none focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-500 text-[10px] uppercase mt-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="ACCESS KEY"
                        className="bg-black/40 border-white/10 focus:border-[var(--theme-color)] text-white pl-12 pr-24 h-14 text-sm tracking-widest rounded-none focus:ring-0"
                        {...field}
                      />
                    </FormControl>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 text-white/30 hover:text-white transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                       <button 
                        type="submit" 
                        className="bg-[var(--theme-color)] text-black p-3 hover:brightness-125 disabled:opacity-50 transition-all"
                        disabled={isPending || isVerifying}
                      >
                        {isPending || isVerifying ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <FormMessage className="text-red-500 text-[10px] uppercase mt-1" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      <div className="mt-6 flex justify-between items-center px-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-[var(--theme-color)] animate-pulse"></div>
          <div className="w-1.5 h-1.5 bg-white/20"></div>
          <div className="w-1.5 h-1.5 bg-white/20"></div>
        </div>
        <span className="text-[9px] text-white/20 tracking-widest uppercase">RAZOR V2 CRASH</span>
      </div>
    </div>
  );
}
