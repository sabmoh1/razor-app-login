
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
            const currentUses = passwordData.uses;
            if (currentUses !== undefined && currentUses <= 0) {
                setVerifyStep(-1);
                setError("ACCESS DENIED: KEY USAGE DEPLETED");
                setTimeout(() => setIsVerifying(false), 2000);
                return;
            }

            await new Promise(r => setTimeout(r, 1200));
            setVerifyStep(2);
            await new Promise(r => setTimeout(r, 1500));
            setVerifyStep(3);
            await new Promise(r => setTimeout(r, 1000));
            
            sessionStorage.setItem('razor_user_id', values.userId);
            sessionStorage.setItem('razor_session_validity', passwordData.validity || '11m');

            const keyRef = ref(database, `passwords/${passwordKey}`);
            if (currentUses !== undefined) {
              if (currentUses > 1) { await update(keyRef, { uses: currentUses - 1 }); }
              else { await remove(keyRef); }
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
      } catch (e) {
        setVerifyStep(-1);
        setError("CONNECTION ERROR: RETRY LATER");
        setTimeout(() => setIsVerifying(false), 2000);
      }
    });
  }

  return (
    <div className="w-full max-w-md" style={formStyle}>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User size={16} className={verifyStep >= 1 ? 'text-green-500' : 'text-white/20'} />
                    <span className={`text-[10px] tracking-widest uppercase ${verifyStep >= 1 ? 'text-green-500' : 'text-white/40'}`}>Scanning Terminal ID</span>
                  </div>
                  {verifyStep >= 1 ? <CheckCircle2 size={14} className="text-green-500" /> : <Loader2 size={12} className="animate-spin text-white/20" />}
                </div>
                <div className={`flex items-center justify-between ${verifyStep >= 1 ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="flex items-center gap-3">
                    <Lock size={16} className={verifyStep >= 2 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-white/20'} />
                    <span className={`text-[10px] tracking-widest uppercase ${verifyStep >= 2 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-white/40'}`}>Verifying Access Key</span>
                  </div>
                  {verifyStep >= 2 ? <CheckCircle2 size={14} className="text-green-500" /> : verifyStep === -1 ? <ShieldAlert size={14} className="text-red-500" /> : null}
                </div>
              </div>
              {verifyStep === 3 && <p className="text-green-500 text-center font-bold uppercase tracking-widest">Access Granted</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-10">
        {title && <h1 className={`text-5xl font-black uppercase tracking-tighter ${!useCustomGlow ? themeGlow : ''}`} style={useCustomGlow ? dynamicGlowStyle : {color: themeColor}}>{title}</h1>}
      </div>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem><FormControl><Input type="text" placeholder="TERMINAL ID" className="bg-black/40 border-white/10 text-white h-14" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormControl><Input type={showPassword ? "text" : "password"} placeholder="ACCESS KEY" className="bg-black/40 border-white/10 text-white h-14" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full h-14 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200" disabled={isPending || isVerifying}>
                {isPending || isVerifying ? <Loader2 className="animate-spin" /> : "Authorize Entry"}
            </Button>
          </form>
        </Form>
      </div>
      <div className="mt-6 text-center">
        <span className="text-[9px] text-white/20 tracking-widest uppercase">RAZOR V2 CRASH</span>
      </div>
    </div>
  );
}
