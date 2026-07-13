
"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  ArrowRightCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Server, 
  Lock, 
  ShieldAlert,
  User,
  Fingerprint
} from "lucide-react";
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
    title = '',
    themeColor = '#FFFFFF',
    themeGlow = '',
    useCustomGlow = true,
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [bitStream, setBitStream] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  // Bit stream effect for the placeholder
  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setBitStream(Math.random().toString(2).substring(2, 10));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isVerifying]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsVerifying(true);
    setVerifyStep(1); // Step 1: Scanning ID

    // Simulation delay for ID scan
    await new Promise(r => setTimeout(r, 2200));

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
            const dbPass = allPasswords[key].password;
            if (dbPass === values.password) {
              isValid = true;
              passwordKey = key;
              passwordData = allPasswords[key];
              break;
            }
          }

          if (isValid && passwordKey && passwordData) {
            const currentUses = passwordData.uses;
            
            setVerifyStep(2); // Step 2: Validating Access Key
            await new Promise(r => setTimeout(r, 2500));

            if (currentUses !== undefined && currentUses <= 0) {
                setVerifyStep(-1);
                setError("ACCESS DENIED: KEY USAGE DEPLETED");
                setTimeout(() => setIsVerifying(false), 3000);
                return;
            }

            setVerifyStep(3); // Step 3: Establishing Server Connection
            await new Promise(r => setTimeout(r, 2000));
            
            setVerifyStep(4); // Step 4: Encrypting Entry Data
            await new Promise(r => setTimeout(r, 1800));
            
            setVerifyStep(5); // Final Success
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
            await new Promise(r => setTimeout(r, 1500));
            setVerifyStep(-1);
            setError("AUTHENTICATION FAILED: INVALID SECURITY KEY");
            setTimeout(() => setIsVerifying(false), 3000);
          }
        } else {
          setVerifyStep(-1);
          setError("SYSTEM ERROR: DATABASE UNREACHABLE");
          setTimeout(() => setIsVerifying(false), 3000);
        }
      } catch (e) {
        setVerifyStep(-1);
        setError("CONNECTION ERROR: UPLINK FAILED");
        setTimeout(() => setIsVerifying(false), 3000);
      }
    });
  }

  const dynamicGlowStyle = {
      color: themeColor,
      textShadow: `0 0 10px ${themeColor}, 0 0 20px ${themeColor}`
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm space-y-12">
              <div className="text-center">
                <div className="relative inline-block">
                  {verifyStep === -1 ? (
                    <ShieldAlert className="h-24 w-24 text-red-500 mx-auto" />
                  ) : verifyStep === 5 ? (
                    <ShieldCheck className="h-24 w-24 text-green-500 mx-auto animate-bounce" />
                  ) : (
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-2 border-white/5 flex items-center justify-center overflow-hidden">
                         <div className="absolute inset-0 bg-white/5 animate-pulse" />
                         <span className="text-[10px] font-mono text-white/40 tracking-tighter">0x{bitStream}</span>
                      </div>
                      <div className="absolute -inset-2 rounded-full border-t-2 border-white/20 animate-spin" />
                    </div>
                  )}
                </div>
                <h2 className={`text-xl font-black tracking-[0.3em] uppercase mt-8 ${verifyStep === -1 ? 'text-red-500' : 'text-white'}`}>
                  {verifyStep === -1 ? 'System Breach Detected' : verifyStep === 5 ? 'Authentication Complete' : 'Deep Protocol Analysis'}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Step 1: ID Scan */}
                <div className={`flex items-center justify-between transition-all duration-700 ${verifyStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Fingerprint size={20} className={verifyStep > 1 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-blue-400 animate-pulse'} />
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${verifyStep > 1 ? 'text-green-500' : 'text-white/60'}`}>Scanning Terminal ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {verifyStep >= 1 && <span className="text-[10px] font-mono text-white/30">{form.getValues('userId')}</span>}
                    {verifyStep > 1 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep === -1 ? <ShieldAlert size={16} className="text-red-500" /> : <Loader2 size={14} className="animate-spin text-blue-400" />}
                  </div>
                </div>

                {/* Step 2: Key Validation */}
                <div className={`flex items-center justify-between transition-all duration-700 delay-100 ${verifyStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Lock size={20} className={verifyStep > 2 ? 'text-green-500' : 'text-blue-400'} />
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${verifyStep > 2 ? 'text-green-500' : 'text-white/60'}`}>Validating Access Key</span>
                  </div>
                  {verifyStep > 2 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep >= 2 ? <Loader2 size={14} className="animate-spin text-blue-400" /> : null}
                </div>

                {/* Step 3: Server Connection */}
                <div className={`flex items-center justify-between transition-all duration-700 delay-200 ${verifyStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Server size={20} className={verifyStep > 3 ? 'text-green-500' : 'text-blue-400'} />
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${verifyStep > 3 ? 'text-green-500' : 'text-white/60'}`}>Establishing Uplink</span>
                  </div>
                  {verifyStep > 3 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep >= 3 ? <Loader2 size={14} className="animate-spin text-blue-400" /> : null}
                </div>

                {/* Step 4: Data Encryption */}
                <div className={`flex items-center justify-between transition-all duration-700 delay-300 ${verifyStep >= 4 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Lock size={20} className={verifyStep > 4 ? 'text-green-500' : 'text-blue-400'} />
                    <span className={`text-[11px] font-bold tracking-widest uppercase ${verifyStep > 4 ? 'text-green-500' : 'text-white/60'}`}>Encrypting Data stream</span>
                  </div>
                  {verifyStep > 4 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep >= 4 ? <Loader2 size={14} className="animate-spin text-blue-400" /> : null}
                </div>
              </div>

              {error && (
                <div className="text-center animate-shake mt-8">
                  <p className="text-2xl md:text-3xl text-red-600 font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                    {error}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mb-12">
        {title && <h1 className="text-4xl font-black uppercase tracking-tighter" style={dynamicGlowStyle}>{title}</h1>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <Input 
                      type="text" 
                      placeholder="TERMINAL ID" 
                      className="bg-white/[0.03] backdrop-blur-md border-white/10 hover:border-white/20 focus:border-white/40 text-white h-16 pl-12 rounded-xl tracking-widest font-bold placeholder:text-white/10" 
                      {...field} 
                    />
                  </div>
                </FormControl>
              </FormItem>
            )} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group"
          >
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <Input 
                      type="password" 
                      placeholder="ACCESS KEY" 
                      className="bg-white/[0.03] backdrop-blur-md border-white/10 hover:border-white/20 focus:border-white/40 text-white h-16 pl-12 pr-16 rounded-xl tracking-widest font-bold placeholder:text-white/10" 
                      {...field} 
                    />
                    <button 
                      type="submit" 
                      disabled={isVerifying || isPending}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all disabled:opacity-30"
                    >
                      {isVerifying || isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <ArrowRightCircle className="h-8 w-8 stroke-[1.5px]" />
                      )}
                    </button>
                  </div>
                </FormControl>
              </FormItem>
            )} />
          </motion.div>
        </form>
      </Form>

      <div className="pt-6 text-center">
        <span className="text-[9px] text-white/10 tracking-[0.3em] uppercase font-black">RAZOR V2 CRASH</span>
      </div>
    </div>
  );
}
