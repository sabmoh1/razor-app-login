
"use client";

import { useState, useTransition } from "react";
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
import { Eye, EyeOff, Lock, Loader2, AlertCircle, ArrowRight, User } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, get, set, remove, update } from "firebase/database";

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
  validityType?: 'time' | 'attempts';
};

const parseValidityToAttempts = (validity: string | null): number => {
    if (!validity) return 1;
    // Extracts the number part, e.g., from "11m" to 11
    const value = parseInt(validity);
    if (isNaN(value) || value < 1) return 1;
    return value;
};


export default function LoginForm({ 
    welcomePath = '/Razor_1x', 
    title = 'RAZOR TERMINAL',
    themeColor,
    themeGlow,
    useCustomGlow = false,
    validityType = 'time',
}: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
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
    '--theme-color-op-20': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.2)` : `${themeColor}33`,
    '--theme-color-op-30': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.3)` : `${themeColor}4d`,
    '--theme-color-op-50': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.5)` : `${themeColor}80`,
    '--theme-color-op-80': themeColor.startsWith('hsl') ? `hsla(var(--primary-hsl), 0.8)` : `${themeColor}cc`,
  } as React.CSSProperties;
  
  const dynamicGlowStyle = {
      color: themeColor,
      textShadow: `
        0 0 5px ${themeColor},
        0 0 10px ${themeColor},
        0 0 15px ${themeColor},
        0 0 20px ${themeColor},
        0 0 80px ${themeColor}80
      `
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    startTransition(async () => {
      try {
        const passwordsRef = ref(database, 'passwords');
        const snapshot = await get(passwordsRef);

        if (snapshot.exists()) {
          const allPasswords = snapshot.val();
          let isValid = false;
          let validityValue: string | number = '1h'; // Default for time
          let passwordKey: string | null = null;
          let passwordData: any = null;

          for (const key in allPasswords) {
            if (allPasswords[key].password === values.password) {
              isValid = true;
              passwordKey = key;
              passwordData = allPasswords[key];
              if (validityType === 'attempts') {
                  validityValue = parseValidityToAttempts(passwordData.validity);
              } else {
                  validityValue = passwordData.validity || '1h';
              }
              break;
            }
          }

          if (isValid && passwordKey && passwordData) {
            
            sessionStorage.setItem('razor_user_id', values.userId);
            if (validityType === 'attempts') {
                sessionStorage.setItem('razor_session_attempts', String(validityValue));
                sessionStorage.setItem('razor_key_id', passwordKey);
            } else {
                sessionStorage.setItem('razor_session_validity', String(validityValue));
            }
            router.push(welcomePath);
          } else {
            setError("ACCESS DENIED: Incorrect credentials");
            form.reset({ password: "", userId: values.userId });
          }
        } else {
          setError("ACCESS DENIED: No passwords found in database");
          form.reset({ password: "", userId: "" });
        }
      } catch (error: any) {
        setError("SYSTEM ERROR: Could not connect to the server.");
        console.error("Login error:", error);
        form.reset({ password: "", userId: "" });
      }
    });
  }

  return (
    <div className="w-full max-w-md font-orbitron" style={formStyle}>
      <div className="text-center mb-8">
        <h1 
          className={`text-4xl font-black uppercase ${!useCustomGlow ? themeGlow : ''}`} 
          style={useCustomGlow ? dynamicGlowStyle : {color: themeColor}}
        >
          {title}
        </h1>
        <p className="text-neon-white/80 text-sm mt-2 tracking-widest">
          Awaiting authentication credentials
        </p>
      </div>
      
      <div className="bg-transparent p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm flex items-center gap-2 font-code">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                   <div className="relative group">
                     <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--theme-color)] opacity-70 transition-all duration-300 group-focus-within:text-[var(--theme-color)]`} />
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="> user id"
                        className={`font-code bg-black/50 border-2 border-[var(--theme-color-op-30)] focus:border-[var(--theme-color)] text-neon-white pl-12 pr-12 h-14 text-base placeholder:text-[var(--theme-color-op-50)] w-full rounded-full focus:outline-none transition-all duration-300 focus:shadow-[0_0_15px_var(--theme-color-op-80)] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0`}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="text-red-400 text-xs pt-1 font-code pl-4" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative group">
                     <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--theme-color)] opacity-70 transition-all duration-300 group-focus-within:text-[var(--theme-color)]`} />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="> password"
                        className={`font-code bg-black/50 border-2 border-[var(--theme-color-op-30)] focus:border-[var(--theme-color)] text-neon-white pl-12 pr-24 h-14 text-base placeholder:text-[var(--theme-color-op-50)] w-full rounded-full focus:outline-none transition-all duration-300 focus:shadow-[0_0_15px_var(--theme-color-op-80)] focus:ring-0 focus-visible:ring-0 focus:ring-offset-0`}
                        {...field}
                      />
                    </FormControl>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-full text-[var(--theme-color)] opacity-70 hover:bg-[var(--theme-color-op-10)] hover:text-[var(--theme-color)]`}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                       <Button 
                        type="submit" 
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full text-[var(--theme-color)] hover:bg-[var(--theme-color-op-20)] hover:text-white disabled:opacity-50`}
                        disabled={isPending}
                        aria-label="Initiate Connection"
                      >
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <ArrowRight className="h-6 w-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <FormMessage className="text-red-400 text-xs pt-1 font-code pl-4" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      <div className={`text-center text-xs text-[var(--theme-color)] opacity-40 mt-4 tracking-widest flex justify-center items-center gap-2`}>
        <span>System active.</span>
      </div>
    </div>
  );
}
