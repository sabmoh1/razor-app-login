"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { database } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { Loader2, AlertCircle, User, KeyRound, ArrowRight } from "lucide-react";
import KillSwitch from "@/components/kill-switch";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Helper function to check if a validity string is time-based
function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}

export default function B16Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      const passwordsRef = ref(database, 'passwords');
      const snapshot = await get(passwordsRef);

      if (!snapshot.exists()) {
        setError("System error: Could not verify credentials.");
        setIsSubmitting(false);
        return;
      }

      const allPasswords = snapshot.val();
      let isValid = false;
      let passwordKey: string | null = null;
      let passwordData: any = null;

      // Find the correct password entry
      for (const key in allPasswords) {
        if (allPasswords[key].password === values.password) {
          isValid = true;
          passwordKey = key;
          passwordData = allPasswords[key];
          break;
        }
      }

      if (!isValid || !passwordKey || !passwordData) {
        setError("Invalid credentials. Please try again.");
        setIsSubmitting(false);
        return;
      }
      
      // Custom validation: Reject time-based keys
      if (isTimeBasedValidity(passwordData.validity)) {
        setError("This key is not valid for this page. Please use a key with attempts-based access.");
        setIsSubmitting(false);
        return;
      }

      // CRITICAL FIX: Correctly read 'attemps' or 'attempts' from the database record
      // The user's database has a typo 'attemps' sometimes.
      const attempts = passwordData.attemps || passwordData.attempts || '0';
      
      // Store user ID and the correct attempts value in session storage
      sessionStorage.setItem('razor_user_id', values.userId);
      sessionStorage.setItem('razor_session_attempts', attempts);
      sessionStorage.setItem('razor_key_id', passwordKey);
      
      // Handle 'uses' logic for login sessions
      const passwordRef = ref(database, `passwords/${passwordKey}`);
      // Only decrement or remove if 'uses' field exists.
      if (typeof passwordData.uses !== 'undefined') {
          if (passwordData.uses > 1) {
            await update(passwordRef, { uses: passwordData.uses - 1 });
          } else {
            await remove(passwordRef); // Last use, so remove.
          }
      }

      router.push('/b16/welcome');

    } catch (e) {
      setError("Network error. Please check your connection.");
      console.error("Login error:", e);
    } finally {
        // We don't set isSubmitting to false on success because we are navigating away
        if (error) {
             setIsSubmitting(false);
        }
    }
  }

  return (
    <KillSwitch pageName="b16">
       <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://cdn.dribbble.com/userupload/20787734/file/original-6a95ade3f7286f5da2b16669f6ff93c3.gif')",
            filter: 'hue-rotate(190deg) brightness(0.9)',
          }}
        ></div>
        <div className="absolute inset-0 w-full h-full bg-black/60"></div>
      </div>
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 antialiased bg-transparent">
        <div className="w-full max-w-sm">
             <div className="text-center mb-8">
                <h1 className="text-4xl font-black uppercase text-glow-blue" style={{color: 'var(--neon-blue)'}}>
                    B16 TERMINAL
                </h1>
             </div>
             <div className="bg-black/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 shadow-2xl shadow-blue-500/10">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="bg-red-900/30 border border-red-500/40 text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400/60" />
                        <input
                            {...form.register('userId')}
                            type="text"
                            inputMode="numeric"
                            placeholder="User ID"
                            className="w-full bg-gray-900/50 border-2 border-blue-500/20 h-14 pl-12 pr-4 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50"
                        />
                         {form.formState.errors.userId && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.userId.message}</p>}
                    </div>

                     <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400/60" />
                        <input
                            {...form.register('password')}
                            type="password"
                            placeholder="Password"
                            className="w-full bg-gray-900/50 border-2 border-blue-500/20 h-14 pl-12 pr-4 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50"
                        />
                         {form.formState.errors.password && <p className="text-red-400 text-xs mt-2 ml-2">{form.formState.errors.password.message}</p>}
                    </div>

                    <button 
                        type="submit" 
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold flex items-center justify-center gap-2 rounded-lg transition-all duration-300 transform active:scale-95 disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                        <>
                            Login <ArrowRight className="h-5 w-5" />
                        </>
                        )}
                    </button>
                </form>
            </div>
        </div>
      </main>
    </KillSwitch>
  );
}
