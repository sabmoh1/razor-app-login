
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
  Fingerprint,
  Database,
  Cpu
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

  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setBitStream(Math.random().toString(16).substring(2, 10).toUpperCase());
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isVerifying]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsVerifying(true);
    setVerifyStep(1); // Step 1: Scanning ID & Access Key

    await new Promise(r => setTimeout(r, 3000));

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
            if (allPasswords[key].password === values.password) {
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
                setTimeout(() => setIsVerifying(false), 4000);
                return;
            }

            setVerifyStep(2); // Step 2: Establishing Server Connection
            await new Promise(r => setTimeout(r, 2800));

            setVerifyStep(3); // Step 3: Encrypting Entry Data
            await new Promise(r => setTimeout(r, 2500));
            
            setVerifyStep(4); // Final Success
            await new Promise(r => setTimeout(r, 1200));
            
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
            setError("AUTHENTICATION FAILED: INVALID SECURITY KEY");
            setTimeout(() => setIsVerifying(false), 4000);
          }
        } else {
          setVerifyStep(-1);
          setError("SYSTEM ERROR: DATABASE UNREACHABLE");
          setTimeout(() => setIsVerifying(false), 4000);
        }
      } catch (e) {
        setVerifyStep(-1);
        setError("CONNECTION ERROR: UPLINK FAILED");
        setTimeout(() => setIsVerifying(false), 4000);
      }
    });
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <div className="w-full max-w-xl space-y-12">
              <div className="text-center">
                <div className="relative inline-block mb-10">
                  {verifyStep === -1 ? (
                    <ShieldAlert className="h-32 w-32 text-red-600 mx-auto drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                  ) : verifyStep === 4 ? (
                    <ShieldCheck className="h-32 w-32 text-green-500 mx-auto animate-bounce drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <div className="h-40 w-40 flex items-center justify-center border-4 border-white/5 rounded-full">
                         <span className="text-xl font-mono text-cyan-400 tracking-[0.2em] uppercase font-bold">{bitStream}</span>
                      </div>
                      <div className="absolute -inset-4 rounded-full border-t-2 border-cyan-500/60 animate-spin" />
                      <div className="absolute -inset-2 rounded-full border-b-2 border-white/10 animate-spin-slow" />
                    </div>
                  )}
                </div>
                <h2 className={`text-3xl font-black tracking-[0.4em] uppercase ${verifyStep === -1 ? 'text-red-600' : 'text-white'}`} style={{ fontFamily: 'Orbitron' }}>
                  {verifyStep === -1 ? 'System Breach' : verifyStep === 4 ? 'Access Granted' : 'V2 DEEP ANALYSIS'}
                </h2>
              </div>

              <div className="space-y-8 max-w-md mx-auto">
                {/* Step 1: ID & Key Validation */}
                <div className={`flex items-center justify-between transition-all duration-700 ${verifyStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-6">
                    <Fingerprint size={32} className={verifyStep > 1 ? 'text-green-500' : verifyStep === -1 ? 'text-red-600' : 'text-cyan-400 animate-pulse'} />
                    <span className={`text-lg font-bold tracking-widest uppercase ${verifyStep > 1 ? 'text-green-500' : 'text-white/80'}`} style={{ fontFamily: 'Acme' }}>ID & Access Key Analysis</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {verifyStep >= 1 && <span className="text-sm font-mono text-cyan-500/60">{form.getValues('userId')}</span>}
                    {verifyStep > 1 ? <CheckCircle2 size={24} className="text-green-500" /> : verifyStep === -1 ? <ShieldAlert size={24} className="text-red-600" /> : <Loader2 size={22} className="animate-spin text-cyan-400" />}
                  </div>
                </div>

                {/* Step 2: Server Connection */}
                <div className={`flex items-center justify-between transition-all duration-700 delay-100 ${verifyStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-6">
                    <Server size={32} className={verifyStep > 2 ? 'text-green-500' : verifyStep === -1 ? 'text-red-600/30' : 'text-cyan-400'} />
                    <span className={`text-lg font-bold tracking-widest uppercase ${verifyStep > 2 ? 'text-green-500' : 'text-white/80'}`} style={{ fontFamily: 'Acme' }}>Uplink Authorization</span>
                  </div>
                  {verifyStep > 2 ? <CheckCircle2 size={24} className="text-green-500" /> : verifyStep >= 2 ? <Loader2 size={22} className="animate-spin text-cyan-400" /> : null}
                </div>

                {/* Step 3: Data Encryption */}
                <div className={`flex items-center justify-between transition-all duration-700 delay-200 ${verifyStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-10 -translate-x-4'}`}>
                  <div className="flex items-center gap-6">
                    <Cpu size={32} className={verifyStep > 3 ? 'text-green-500' : verifyStep === -1 ? 'text-red-600/30' : 'text-cyan-400'} />
                    <span className={`text-lg font-bold tracking-widest uppercase ${verifyStep > 3 ? 'text-green-500' : 'text-white/80'}`} style={{ fontFamily: 'Acme' }}>Data Stream Encryption</span>
                  </div>
                  {verifyStep > 3 ? <CheckCircle2 size={24} className="text-green-500" /> : verifyStep >= 3 ? <Loader2 size={22} className="animate-spin text-cyan-400" /> : null}
                </div>
              </div>

              {error && (
                <div className="text-center mt-12">
                  <p className="text-4xl md:text-5xl text-red-600 font-black tracking-widest uppercase" style={{ fontFamily: 'Orbitron', textShadow: '0 0 30px rgba(220,38,38,0.8)' }}>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-cyan-400 transition-all duration-300" />
                    <Input 
                      type="text" 
                      placeholder="TERMINAL ID" 
                      className="bg-black/40 backdrop-blur-xl border-2 border-white/5 hover:border-cyan-500/30 focus:border-cyan-500/60 text-white h-16 pl-14 rounded-2xl tracking-[0.2em] font-black placeholder:text-white/10 transition-all text-lg shadow-2xl" 
                      {...field} 
                    />
                  </div>
                </FormControl>
              </FormItem>
            )} />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <div className="flex items-center">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-cyan-400 transition-all duration-300" />
                      <Input 
                        type="password" 
                        placeholder="ACCESS KEY" 
                        className="bg-black/40 backdrop-blur-xl border-2 border-white/5 hover:border-cyan-500/30 focus:border-cyan-500/60 text-white h-16 pl-14 pr-16 rounded-2xl tracking-[0.2em] font-black placeholder:text-white/10 transition-all text-lg shadow-2xl w-full" 
                        {...field} 
                      />
                      <button 
                        type="submit" 
                        disabled={isVerifying || isPending}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center text-cyan-400/40 hover:text-cyan-400 active:scale-90 transition-all disabled:opacity-30 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                      >
                        {isVerifying || isPending ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <ArrowRightCircle className="h-10 w-10 stroke-[1px]" />
                        )}
                      </button>
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )} />
          </motion.div>
        </form>
      </Form>

      <div className="pt-10 text-center opacity-30">
        <span className="text-[11px] text-white tracking-[0.5em] uppercase font-black" style={{ fontFamily: 'Orbitron' }}>
           RAZOR V2 CRASH
        </span>
      </div>
    </div>
  );
}
