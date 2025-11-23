
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
import { Loader2, AlertCircle, ArrowRight, User, KeyRound, Server, Scan, Link2, CheckCircle } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { cn } from "@/lib/utils";

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

const activationSteps = [
    { text: "Fetching data...", icon: Server },
    { text: "Analyzing vulnerabilities...", icon: Scan },
    { text: "Connecting to ID: ", icon: User },
    { text: "Connecting to platform: ", icon: Link2 },
    { text: "SUCCESSFULLY CONNECTED", icon: CheckCircle }
]

export default function OnePercentBetLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      activationCode: "",
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActivating && activationStatus < activationSteps.length -1) {
        interval = setInterval(() => {
            setActivationStatus(prev => {
                if (prev < activationSteps.length - 1) {
                    return prev + 1;
                }
                clearInterval(interval);
                return prev;
            });
        }, 1500);
    }
    return () => clearInterval(interval);
  }, [isActivating, activationStatus]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setIsActivating(true);
    setActivationStatus(0);

    try {
        const codesRef = ref(database, 'passwords');
        const snapshot = await get(codesRef);

        if (snapshot.exists()) {
            const allCodes = snapshot.val();
            let isValid = false;
            let validity = '1h';
            let codeKey: string | null = null;
            let codeData: any = null;

            for (const key in allCodes) {
                if (allCodes[key].password === values.activationCode && (!allCodes[key].userId || allCodes[key].userId === values.userId)) {
                    isValid = true;
                    validity = allCodes[key].validity || '1h';
                    codeKey = key;
                    codeData = allCodes[key];
                    break;
                }
            }

            if (isValid && codeKey && codeData) {
                const codeRef = ref(database, `passwords/${codeKey}`);
                const updates: any = {};
                if (codeData.uses && codeData.uses > 1) {
                    updates.uses = codeData.uses - 1;
                }
                if (!codeData.userId) {
                    updates.userId = values.userId;
                }
                if (Object.keys(updates).length > 0) {
                    await update(codeRef, updates);
                } else if (!codeData.uses || codeData.uses <= 1) {
                    await remove(codeRef);
                }
                
                // Simulate activation steps
                setTimeout(() => {
                    sessionStorage.setItem('onepercentbet_session_validity', validity);
                    sessionStorage.setItem('onepercentbet_user_id', values.userId);
                    sessionStorage.setItem('onepercentbet_platform', selectedPlatform.name);
                    router.push('/onepercentbet/welcome');
                }, 1500 * activationSteps.length);

            } else {
                setTimeout(() => {
                    setError("Invalid User ID or Activation Code.");
                    setIsActivating(false);
                    form.reset();
                }, 1000);
            }
        } else {
            setTimeout(() => {
                 setError("SYSTEM ERROR: Could not verify activation codes.");
                 setIsActivating(false);
                 form.reset();
            }, 1000);
        }
    } catch (error: any) {
        setTimeout(() => {
            setError("SYSTEM ERROR: Could not connect to the server.");
            setIsActivating(false);
            console.error("Login error:", error);
            form.reset();
        }, 1000);
    }
  }
  
  if (isActivating) {
    const CurrentIcon = activationSteps[activationStatus].icon;
    let currentText = activationSteps[activationStatus].text;

    if (activationStatus === 2) currentText += form.getValues("userId");
    if (activationStatus === 3) currentText += selectedPlatform.name;


    return (
        <div className="min-h-screen w-full bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 font-rajdhani">
             <div className="w-full max-w-sm text-center">
                 <div className="flex justify-center mb-4">
                     <CurrentIcon className={cn("h-8 w-8 text-blue-400", activationStatus < activationSteps.length -1 ? "animate-spin" : "")} />
                 </div>
                 <p className="text-lg text-gray-300 font-semibold animate-pulse">{currentText}</p>
             </div>
        </div>
    )
  }

  return (
    <>
        <div className="min-h-screen w-full bg-[#0D1117] text-white flex flex-col items-center justify-center p-4 font-rajdhani overflow-x-hidden">
            <style jsx global>{`
                body {
                    background-color: #0D1117;
                }
            `}</style>
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="font-bebas text-5xl tracking-wider text-gray-100">1%<span className="text-blue-400">BET</span></h1>
                    <p className="text-gray-400 text-sm">Activate Your Access</p>
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
                            {error && (
                                <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="User ID"
                                            className="bg-[#0D1117] border-gray-700 h-12 pl-10 pr-4 text-base focus:border-blue-500 focus:ring-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs pt-1 pl-2" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="activationCode"
                                render={({ field }) => (
                                    <FormItem>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Activation Code"
                                            className="bg-[#0D1117] border-gray-700 h-12 pl-10 pr-4 text-base focus:border-blue-500 focus:ring-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            {...field}
                                        />
                                        </FormControl>
                                    </div>
                                    <FormMessage className="text-red-400 text-xs pt-1 pl-2" />
                                    </FormItem>
                                )}
                            />
                            
                            <Button 
                                type="submit" 
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base font-bold flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95"
                                disabled={isActivating}
                            >
                                {isActivating ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                <>
                                    Activate
                                    <ArrowRight className="h-5 w-5" />
                                </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
                <p className="text-center text-gray-600 text-xs mt-4">
                    © 2024 1%BET. All rights reserved.
                </p>
            </div>
        </div>
    </>
  );
}

    