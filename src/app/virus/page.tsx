
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { database } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import Head from "next/head";
import { 
    Loader2, Cpu, Globe, Lock, Fingerprint, Database, Zap, Server, 
    ShieldCheck, ShieldAlert, CheckCircle2, User, KeyRound 
} from "lucide-react";
import KillSwitch from "@/components/kill-switch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "KEY is required." }),
});

const VERIFICATION_STEPS = [
    { text: "INITIALIZING VIRUS CORE...", icon: Cpu },
    { text: "CONNECTING TO GLOBAL NET...", icon: Globe },
    { text: "DECRYPTING SECURITY KEY...", icon: Lock },
    { text: "SCANNING DEVICE FINGERPRINT...", icon: Fingerprint },
    { text: "FETCHING TEMPORAL DATA...", icon: Database },
    { text: "BYPASSING SECURITY PROTOCOLS...", icon: Zap },
    { text: "ESTABLISHING ENCRYPTED TUNNEL...", icon: Server },
];

export default function VirusLoginPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [bitStream, setBitStream] = useState("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    if (isVerifying && verifyStep >= 0 && verifyStep < VERIFICATION_STEPS.length) {
      const interval = setInterval(() => {
        setBitStream(Math.random().toString(16).substring(2, 10).toUpperCase());
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isVerifying, verifyStep]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setAuthError(null);
    setIsVerifying(true);
    setVerifyStep(0);

    const runSequence = async () => {
        for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
            setVerifyStep(i);
            await new Promise(r => setTimeout(r, 700 + Math.random() * 300));

            if (i === 2) {
                const passwordsRef = ref(database, "passwords/crash");
                const snapshot = await get(passwordsRef);

                if (!snapshot.exists()) {
                    setVerifyStep(-1);
                    setAuthError("SYSTEM ERROR: NO KEYS FOUND");
                    return false;
                }

                const allPasswords = snapshot.val();
                let foundKeyId = null;
                let foundRecord = null;

                for (const key in allPasswords) {
                    if (allPasswords[key].password === values.password) {
                        foundKeyId = key;
                        foundRecord = allPasswords[key];
                        break;
                    }
                }

                if (!foundRecord || !foundKeyId) {
                    setVerifyStep(-1);
                    setAuthError("AUTHENTICATION FAILED: INVALID KEY");
                    return false;
                }

                // AUTO-PURGE
                const keyRef = ref(database, `passwords/crash/${foundKeyId}`);
                const isExpired = foundRecord.activated && foundRecord.expiresAt > 0 && foundRecord.expiresAt < Date.now();
                if (foundRecord.uses <= 0 || foundRecord.remainingTime <= 0 || isExpired) {
                    await remove(keyRef);
                    setVerifyStep(-1);
                    setAuthError("ACCESS DENIED: KEY EXPIRED AND PURGED");
                    return false;
                }
                
                sessionStorage.setItem('temp_virus_key', foundKeyId);
                sessionStorage.setItem('temp_virus_record', JSON.stringify(foundRecord));
            }
        }
        return true;
    };

    const success = await runSequence();

    if (success) {
        startTransition(async () => {
            try {
                const foundKeyId = sessionStorage.getItem('temp_virus_key');
                const foundRecord = JSON.parse(sessionStorage.getItem('temp_virus_record') || '{}');
                const now = Date.now();
                const expiresAt = now + foundRecord.remainingTime;

                await update(ref(database, `passwords/crash/${foundKeyId}`), {
                    uses: Math.max(0, foundRecord.uses - 1),
                    activated: true,
                    activatedAt: now,
                    expiresAt: expiresAt
                });

                setVerifyStep(VERIFICATION_STEPS.length);
                sessionStorage.setItem("razor_user_id", values.userId);
                sessionStorage.setItem("razor_expires_at", String(expiresAt));
                sessionStorage.setItem("razor_game_key", "crash");
                sessionStorage.setItem("razor_db_key_id", foundKeyId!);
                
                setTimeout(() => router.push("/virus/welcome"), 1000);
            } catch (error) {
                setVerifyStep(-1);
                setAuthError("CONNECTION ERROR: UPLINK FAILED");
            }
        });
    } else {
        setTimeout(() => setIsVerifying(false), 3000);
    }
  }

  return (
    <KillSwitch pageName="virus">
      <Head>
        <title>VIRUS — Login</title>
      </Head>
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: url("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2FkZGFlNGE5YzlmZjk5YjczYmU3ZmViYWI1ZGI0M2Y0ODFkNmRjZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sWFYgYFj22T6g/giphy.gif")
            no-repeat center center fixed;
          background-size: cover;
          font-family: "Cairo", sans-serif;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        body::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7); z-index: -1;
        }
        .login-box {
          background: rgba(0, 0, 0, 0.9); padding: 40px 35px; border-radius: 25px;
          box-shadow: 0 0 30px #ff4d4d, 0 10px 40px rgba(255, 77, 77, 0.3);
          text-align: center; backdrop-filter: blur(10px); border: 1px solid rgba(255, 77, 77, 0.3);
          width: 100%; max-width: 400px;
        }
        .logo h2 { color: #ff4d4d; font-size: 32px; font-weight: 900; text-shadow: 0 0 20px rgba(255, 77, 77, 0.7); letter-spacing: 4px; }
        .input-group input {
          width: 100%; padding: 18px 20px; border-radius: 15px; border: 2px solid rgba(255, 77, 77, 0.3);
          font-size: 16px; background: rgba(0, 0, 0, 0.5); color: #fff; text-align: center; outline: none;
        }
        .login-btn {
          width: 100%; padding: 18px; background: linear-gradient(135deg, #ff4d4d, #cc0000);
          color: white; border: none; border-radius: 15px; font-size: 20px; font-weight: 700; cursor: pointer;
        }
      `}</style>

      <AnimatePresence>
        {isVerifying && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
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
                        <div className="h-24 w-24 flex items-center justify-center border-4 border-red-500/20 rounded-full">
                            <span className="text-sm font-mono text-red-500 tracking-tighter">{bitStream}</span>
                        </div>
                        <div className="absolute -inset-2 rounded-full border-t-2 border-red-500 animate-spin" />
                    </div>
                 )}
              </div>
              
              <h2 className="text-xl font-black tracking-widest text-white uppercase" style={{ fontFamily: 'Orbitron' }}>
                {verifyStep === -1 ? 'VIRUS REJECTED' : verifyStep === VERIFICATION_STEPS.length ? 'INFECTED' : 'SYSTEM OVERRIDE'}
              </h2>

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
                          ? "bg-red-500/10 border-red-500/40 text-white scale-[1.02] shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                          : "bg-white/5 border-white/5 text-white/40"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {index < verifyStep || (verifyStep === VERIFICATION_STEPS.length) ? (
                        <CheckCircle2 size={18} className="text-green-500" />
                      ) : index === verifyStep ? (
                        <Loader2 size={18} className="animate-spin text-red-500" />
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

              {authError && <p className="text-red-600 font-black tracking-widest text-sm uppercase text-center mt-6">{authError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="login-box">
        <div className="logo mb-8"><h2>VIRUS</h2></div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="input-group">
            <input type="text" {...register("userId")} placeholder="ID" inputMode="numeric" maxLength={11} />
            {errors.userId && <p className="text-red-400 text-xs mt-1">{errors.userId.message}</p>}
          </div>
          <div className="input-group">
            <input type="password" {...register("password")} placeholder="KEY" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button className="login-btn" type="submit" disabled={isVerifying}>
            {isVerifying ? <Loader2 className="animate-spin mx-auto" /> : "LOGIN"}
          </button>
        </form>
      </div>
    </KillSwitch>
  );
}
