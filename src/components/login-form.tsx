
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
  Cpu,
  Globe,
  Zap
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  versionLabel?: string;
  gameKey: 'crash' | 'west' | 'kamikaze' | 'swamp' | 'sharlok';
};

const VERIFICATION_STEPS = [
    { text: "INITIALIZING SECURITY CORE...", icon: Cpu },
    { text: "ESTABLISHING SECURE HANDSHAKE...", icon: Globe },
    { text: "DECRYPTING SECURITY KEY...", icon: Lock },
    { text: "SCANNING DEVICE FINGERPRINT...", icon: Fingerprint },
    { text: "VERIFYING TEMPORAL ACCESS...", icon: Database },
    { text: "BYPASSING SECURE FIREWALLS...", icon: Zap },
    { text: "FINALIZING AUTHENTICATION...", icon: Server },
];

export default function LoginForm({ 
    welcomePath = '/Razor_1x', 
    title = '',
    themeColor = '#FFFFFF',
    themeGlow = '',
    useCustomGlow = true,
    versionLabel = 'V2',
    gameKey
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
    if (isVerifying && verifyStep >= 0 && verifyStep < VERIFICATION_STEPS.length) {
      const interval = setInterval(() => {
        setBitStream(Math.random().toString(16).substring(2, 10).toUpperCase());
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isVerifying, verifyStep]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsVerifying(true);
    setVerifyStep(0); 

    const runSequence = async () => {
        for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
            setVerifyStep(i);
            await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
            
            if (i === 2) {
                const gamePasswordsRef = ref(database, `passwords/${gameKey}`);
                const snapshot = await get(gamePasswordsRef);

                if (!snapshot.exists()) {
                    setVerifyStep(-1);
                    setError("ACCESS DENIED: NO KEYS FOUND");
                    return false;
                }

                const allRecords = snapshot.val();
                let foundKeyId = null;
                let foundRecord = null;

                for (const key in allRecords) {
                    if (allRecords[key].password === values.password) {
                        foundKeyId = key;
                        foundRecord = allRecords[key];
                        break;
                    }
                }

                if (!foundRecord || !foundKeyId) {
                    setVerifyStep(-1);
                    setError("AUTHENTICATION FAILED: INVALID KEY");
                    return false;
                }

                if (foundRecord.uses <= 0) {
                    setVerifyStep(-1);
                    setError("ACCESS DENIED: KEY USAGE DEPLETED");
                    return false;
                }

                if (foundRecord.remainingTime <= 0) {
                    setVerifyStep(-1);
                    setError("ACCESS DENIED: KEY EXPIRED");
                    return false;
                }

                sessionStorage.setItem('temp_key_id', foundKeyId);
                sessionStorage.setItem('temp_record', JSON.stringify(foundRecord));
            }
        }
        return true;
    };

    const success = await runSequence();

    if (success) {
        startTransition(async () => {
            try {
                const foundKeyId = sessionStorage.getItem('temp_key_id');
                const foundRecord = JSON.parse(sessionStorage.getItem('temp_record') || '{}');
                
                const now = Date.now();
                const expiresAt = now + foundRecord.remainingTime;

                const updates: any = {
                    uses: foundRecord.uses - 1,
                };

                if (!foundRecord.activated) {
                    updates.activated = true;
                    updates.activatedAt = now;
                    updates.expiresAt = expiresAt;
                } else {
                    updates.expiresAt = expiresAt;
                }

                await update(ref(database, `passwords/${gameKey}/${foundKeyId}`), updates);

                setVerifyStep(VERIFICATION_STEPS.length);
                
                sessionStorage.setItem('razor_user_id', values.userId);
                sessionStorage.setItem('razor_expires_at', String(expiresAt));
                sessionStorage.setItem('razor_game_key', gameKey);
                sessionStorage.setItem('razor_db_key_id', foundKeyId!);
                
                sessionStorage.removeItem('temp_key_id');
                sessionStorage.removeItem('temp_record');

                setTimeout(() => router.push(welcomePath), 1000);
            } catch (e) {
                setVerifyStep(-1);
                setError("CONNECTION ERROR: UPLINK FAILED");
            }
        });
    } else {
        setTimeout(() => setIsVerifying(false), 3000);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <style jsx>{`
        @keyframes glitch-fracture-mini {
          0%, 100% { clip-path: inset(0 0 0 0); opacity: 1; }
          5% { clip-path: inset(40% 0 45% 0); opacity: 0.8; }
          10% { clip-path: inset(10% 0 80% 0); opacity: 0.9; }
          15% { clip-path: inset(0 0 0 0); }
        }
        .glitch-mini {
          animation: glitch-fracture-mini 2s infinite linear;
          display: inline-block;
          position: relative;
        }
      `}</style>
      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 overflow-y-auto"
          >
            <div className="w-full max-w-md space-y-8 py-10">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  {verifyStep === -1 ? (
                    <ShieldAlert className="h-20 w-20 text-red-600 mx-auto drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
                  ) : verifyStep === VERIFICATION_STEPS.length ? (
                    <ShieldCheck className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      <div className="h-24 w-24 flex items-center justify-center border-4 border-white/5 rounded-full">
                         <span className="text-sm font-mono text-cyan-400 tracking-[0.2em] font-bold">{bitStream}</span>
                      </div>
                      <div className="absolute -inset-2 rounded-full border-t-2 border-cyan-500/60 animate-spin" />
                    </div>
                  )}
                </div>
                <h2 className={`text-xl font-black tracking-[0.3em] uppercase ${verifyStep === -1 ? 'text-red-600' : 'text-white'}`} style={{ fontFamily: 'Orbitron' }}>
                  {verifyStep === -1 ? 'SYSTEM BREACH' : verifyStep === VERIFICATION_STEPS.length ? 'ACCESS GRANTED' : <><span className="glitch-mini">{versionLabel}</span> DEEP ENCRYPTION</>}
                </h2>
              </div>

              <div className="space-y-3">
                {VERIFICATION_STEPS.map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: index <= verifyStep || verifyStep === VERIFICATION_STEPS.length ? 1 : 0.2, 
                      x: 0 
                    }}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border transition-all duration-300",
                      index < verifyStep || (verifyStep === VERIFICATION_STEPS.length)
                        ? "bg-green-500/5 border-green-500/20 text-green-400" 
                        : index === verifyStep 
                          ? "bg-cyan-500/10 border-cyan-500/40 text-white scale-[1.02] shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                          : "bg-white/5 border-white/5 text-white/40"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {index < verifyStep || (verifyStep === VERIFICATION_STEPS.length) ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : index === verifyStep ? (
                        <Loader2 size={18} className="animate-spin text-cyan-400" />
                      ) : (
                        <step.icon size={18} className="opacity-40" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase font-mono">
                      {step.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {error && (
                <div className="text-center mt-6">
                  <p className="text-lg text-red-600 font-black tracking-widest uppercase" style={{ fontFamily: 'Orbitron', textShadow: '0 0 20px rgba(220,38,38,0.5)' }}>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <FormField control={form.control} name="userId" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-cyan-400 transition-all duration-300" />
                    <Input 
                      type="text" 
                      placeholder="TERMINAL ID" 
                      className="bg-black/40 backdrop-blur-xl border-2 border-white/5 focus:border-cyan-500/60 text-white h-16 pl-14 rounded-2xl tracking-[0.2em] font-black placeholder:text-white/10 transition-all text-lg shadow-2xl" 
                      {...field} 
                    />
                  </div>
                </FormControl>
              </FormItem>
            )} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative group">
                    <div className="flex items-center">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-cyan-400 transition-all duration-300" />
                      <Input 
                        type="password" 
                        placeholder="ACCESS KEY" 
                        className="bg-black/40 backdrop-blur-xl border-2 border-white/5 focus:border-cyan-500/60 text-white h-16 pl-14 pr-16 rounded-2xl tracking-[0.2em] font-black placeholder:text-white/10 transition-all text-lg shadow-2xl w-full" 
                        {...field} 
                      />
                      <button 
                        type="submit" 
                        disabled={isVerifying || isPending}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center text-cyan-400/40 hover:text-cyan-400 active:scale-90 transition-all disabled:opacity-30"
                      >
                        {isVerifying || isPending ? <Loader2 className="h-8 w-8 animate-spin" /> : <ArrowRightCircle className="h-10 w-10 stroke-[1px]" />}
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
           RAZOR <span className="glitch-mini">{versionLabel}</span> SYSTEM
        </span>
      </div>
    </div>
  );
}
