
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
import { 
    Loader2, AlertCircle, ArrowRight, User, KeyRound, Server, Scan, Link2, 
    CheckCircle, Cpu, Globe, Lock, Fingerprint, Database, Zap, ShieldCheck, ShieldAlert 
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { cn } from "@/lib/utils";
import KillSwitch from "@/components/kill-switch";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  activationCode: z
    .string()
    .min(1, { message: "Activation code is required." }),
});

const platforms = [
    { name: "1XBET", color: "#29A4E8" },
    { name: "LINEBET", color: "#50B948" },
    { name: "MELBET", color: "#B8860B" },
    { name: "XBARI", color: "#F26922" },
    { name: "888STARS", color: "#FFD700" },
];

const VERIFICATION_STEPS = [
    { text: "INITIALIZING QUANTUM CORE...", icon: Cpu },
    { text: "ESTABLISHING GLOBAL UPLINK...", icon: Globe },
    { text: "AUTHENTICATING SECURITY KEY...", icon: Lock },
    { text: "SCANNING BIOMETRIC DATA...", icon: Fingerprint },
    { text: "FETCHING 1% ANALYTICS...", icon: Database },
    { text: "BYPASSING PLATFORM FIREWALL...", icon: Zap },
    { text: "FINALIZING ACTIVATION...", icon: Server },
];

export default function OnePercentBetLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [bitStream, setBitStream] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { userId: "", activationCode: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsVerifying(true);
    setVerifyStep(0);

    const runSequence = async () => {
        for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
            setVerifyStep(i);
            const interval = setInterval(() => {
                setBitStream(Math.random().toString(16).substring(2, 10).toUpperCase());
            }, 60);
            await new Promise(r => setTimeout(r, 900 + Math.random() * 500));
            clearInterval(interval);

            if (i === 2) {
                const codesRef = ref(database, 'passwords/crash'); // Using global pool or per-game
                const snapshot = await get(codesRef);

                if (!snapshot.exists()) {
                    setVerifyStep(-1);
                    setError("SYSTEM ERROR: NO KEYS FOUND");
                    return false;
                }

                const allCodes = snapshot.val();
                let foundKeyId = null;
                let foundRecord = null;

                for (const key in allCodes) {
                    if (allCodes[key].password === values.activationCode) {
                        foundKeyId = key;
                        foundRecord = allCodes[key];
                        break;
                    }
                }

                if (!foundRecord || !foundKeyId) {
                    setVerifyStep(-1);
                    setError("INVALID ACTIVATION CODE");
                    return false;
                }

                if (foundRecord.remainingTime <= 0) {
                    setVerifyStep(-1);
                    setError("ACTIVATION CODE EXPIRED");
                    return false;
                }
                
                sessionStorage.setItem('one_temp_key', foundKeyId);
                sessionStorage.setItem('one_temp_record', JSON.stringify(foundRecord));
            }
        }
        return true;
    };

    const success = await runSequence();

    if (success) {
        startTransition(async () => {
            try {
                const foundKeyId = sessionStorage.getItem('one_temp_key');
                const foundRecord = JSON.parse(sessionStorage.getItem('one_temp_record') || '{}');
                
                const now = Date.now();
                const expiresAt = now + foundRecord.remainingTime;

                await update(ref(database, `passwords/crash/${foundKeyId}`), {
                    uses: Math.max(0, (foundRecord.uses || 1) - 1),
                    activated: true,
                    activatedAt: now,
                    expiresAt: expiresAt
                });

                setVerifyStep(VERIFICATION_STEPS.length);
                sessionStorage.setItem('razor_user_id', values.userId);
                sessionStorage.setItem('razor_expires_at', String(expiresAt));
                sessionStorage.setItem('onepercentbet_platform', selectedPlatform.name);
                
                setTimeout(() => router.push('/onepercentbet/welcome'), 1000);
            } catch (e) {
                setVerifyStep(-1);
                setError("CONNECTION FAILED");
            }
        });
    } else {
        setTimeout(() => setIsVerifying(false), 3000);
    }
  }
  
  return (
    <KillSwitch pageName="onepercentbet">
        <div className="min-h-screen w-full bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 font-rajdhani overflow-x-hidden">
            
            <AnimatePresence>
                {isVerifying && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#0D1117] flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-sm space-y-12 text-center">
                            <div className="relative inline-block mb-4">
                                {verifyStep === -1 ? (
                                    <ShieldAlert className="h-24 w-24 text-red-500 mx-auto" />
                                ) : verifyStep === VERIFICATION_STEPS.length ? (
                                    <ShieldCheck className="h-24 w-24 text-blue-500 mx-auto animate-pulse" />
                                ) : (
                                    <div className="relative flex items-center justify-center">
                                        <div className="h-32 w-32 flex items-center justify-center border-4 border-blue-500/10 rounded-full">
                                            <span className="text-xl font-mono text-blue-400 font-bold tracking-widest">{bitStream}</span>
                                        </div>
                                        <div className="absolute -inset-2 rounded-full border-t-2 border-blue-500 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            <h2 className="text-2xl font-black tracking-[0.2em] text-white uppercase font-bebas">
                                {verifyStep === -1 ? 'AUTHENTICATION FAILED' : verifyStep === VERIFICATION_STEPS.length ? '1% ACCESS GRANTED' : 'QUANTUM VERIFICATION'}
                            </h2>

                            <div className="space-y-3 h-20 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {verifyStep >= 0 && verifyStep < VERIFICATION_STEPS.length && (
                                        <motion.div 
                                            key={verifyStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="flex items-center gap-3 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10"
                                        >
                                            {VERIFICATION_STEPS[verifyStep] && (
                                                <>
                                                    {(() => { const StepIcon = VERIFICATION_STEPS[verifyStep].icon; return <StepIcon className="h-4 w-4 text-blue-400" />; })()}
                                                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-300 font-mono">
                                                        {VERIFICATION_STEPS[verifyStep].text}
                                                    </span>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {error && <p className="text-red-500 font-black tracking-widest text-sm uppercase">{error}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="font-bebas text-5xl tracking-wider text-gray-100">1%<span className="text-blue-400">BET</span></h1>
                    <p className="text-gray-400 text-sm">Secure Activation System</p>
                </div>
                
                <div className="mb-8">
                    <div className="flex justify-center items-center space-x-3 mb-2">
                        {platforms.map(p => (
                           <button 
                             key={p.name} 
                             onClick={() => setSelectedPlatform(p)}
                             className={cn("text-xs font-bold transition-all duration-300", selectedPlatform.name === p.name ? 'opacity-100' : 'opacity-50 hover:opacity-75')} 
                             style={{color: p.color, textShadow: selectedPlatform.name === p.name ? `0 0 12px ${p.color}80` : 'none'}}
                           >
                                {p.name}
                           </button>
                        ))}
                    </div>
                     <div className="flex justify-center items-center space-x-3">
                       {platforms.map(p => (
                         <div key={`${p.name}-dot`} className="flex-1 h-1 transition-all duration-300" style={{backgroundColor: selectedPlatform.name === p.name ? p.color : '#374151'}}></div>
                       ))}
                    </div>
                </div>

                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="userId" render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <FormControl>
                                            <Input type="text" inputMode="numeric" placeholder="User ID" className="bg-[#0D1117] border-gray-700 h-12 pl-10 pr-4 text-base focus:border-blue-500" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="activationCode" render={({ field }) => (
                                <FormItem>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <FormControl>
                                            <Input type="password" placeholder="Activation Code" className="bg-[#0D1117] border-gray-700 h-12 pl-10 pr-4 text-base focus:border-blue-500" {...field} />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs" />
                                </FormItem>
                            )} />
                            
                            <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-bold flex items-center justify-center gap-2" disabled={isVerifying}>
                                {isVerifying ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Activate <ArrowRight className="h-5 w-5" /></>}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    </KillSwitch>
  );
}
