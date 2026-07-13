
"use client";

import { useState, useTransition } from "react";
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
  User
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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsVerifying(true);
    setVerifyStep(1); // Step 1: Verifying ID & Access Key

    await new Promise(r => setTimeout(r, 1800));

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
                setTimeout(() => setIsVerifying(false), 2500);
                return;
            }

            setVerifyStep(2); // Step 2: Establishing Server Connection
            await new Promise(r => setTimeout(r, 2000));
            
            setVerifyStep(3); // Step 3: Encrypting Entry Data
            await new Promise(r => setTimeout(r, 1500));
            
            setVerifyStep(4); // Final Success
            await new Promise(r => setTimeout(r, 800));
            
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
            setTimeout(() => setIsVerifying(false), 2500);
          }
        } else {
          setVerifyStep(-1);
          setError("SYSTEM ERROR: DATABASE UNREACHABLE");
          setTimeout(() => setIsVerifying(false), 2500);
        }
      } catch (e) {
        setVerifyStep(-1);
        setError("CONNECTION ERROR: RETRY LATER");
        setTimeout(() => setIsVerifying(false), 2500);
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
            <div className="w-full max-w-xs space-y-10">
              <div className="text-center">
                <div className="relative inline-block">
                  {verifyStep === -1 ? (
                    <ShieldAlert className="h-20 w-20 text-red-500 mx-auto" />
                  ) : verifyStep === 4 ? (
                    <ShieldCheck className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
                  ) : (
                    <div className="relative">
                      <Loader2 className="h-20 w-20 text-white/20 animate-spin mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white/40">{verifyStep * 25}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <h2 className={`text-lg font-black tracking-widest uppercase mt-6 ${verifyStep === -1 ? 'text-red-500' : 'text-white'}`}>
                  {verifyStep === -1 ? 'Security Alert' : verifyStep === 4 ? 'Access Granted' : 'System Analysis'}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Step 1: ID & Key */}
                <div className={`flex items-center justify-between transition-all duration-500 ${verifyStep >= 1 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <User size={18} className={verifyStep > 1 ? 'text-green-500' : verifyStep === -1 ? 'text-red-500' : 'text-blue-400'} />
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${verifyStep > 1 ? 'text-green-500' : 'text-white/60'}`}>Verifying ID & Access Key</span>
                  </div>
                  {verifyStep > 1 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep === -1 ? <ShieldAlert size={16} className="text-red-500" /> : <Loader2 size={14} className="animate-spin text-blue-400" />}
                </div>

                {/* Step 2: Servers */}
                <div className={`flex items-center justify-between transition-all duration-500 delay-100 ${verifyStep >= 2 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Server size={18} className={verifyStep > 2 ? 'text-green-500' : 'text-blue-400'} />
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${verifyStep > 2 ? 'text-green-500' : 'text-white/60'}`}>Establishing Server Connection</span>
                  </div>
                  {verifyStep > 2 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep >= 2 ? <Loader2 size={14} className="animate-spin text-blue-400" /> : null}
                </div>

                {/* Step 3: Encryption */}
                <div className={`flex items-center justify-between transition-all duration-500 delay-200 ${verifyStep >= 3 ? 'opacity-100 translate-x-0' : 'opacity-20 -translate-x-4'}`}>
                  <div className="flex items-center gap-3">
                    <Lock size={18} className={verifyStep > 3 ? 'text-green-500' : 'text-blue-400'} />
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${verifyStep > 3 ? 'text-green-500' : 'text-white/60'}`}>Encrypting Entry Data</span>
                  </div>
                  {verifyStep > 3 ? <CheckCircle2 size={16} className="text-green-500" /> : verifyStep >= 3 ? <Loader2 size={14} className="animate-spin text-blue-400" /> : null}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm text-center">
                  <p className="text-[10px] text-red-500 font-bold tracking-tighter uppercase">{error}</p>
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
          {/* ID Field - Floating Block */}
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

          {/* Key Field with Integrated Circular Arrow Button */}
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
