"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { database } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Loader2, AlertCircle, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  password: z
    .string()
    .min(1, { message: "Password is required." }),
});

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    startTransition(async () => {
      try {
        const dbRef = ref(database, 'secret/password');
        const snapshot = await get(dbRef);

        if (snapshot.exists() && snapshot.val() === values.password) {
          router.push("/welcome");
        } else {
          setError("ACCESS DENIED: Incorrect password");
          form.reset({ password: "" });
        }
      } catch (error: any) {
        setError("SYSTEM ERROR: Could not connect to database.");
        console.error("Firebase error:", error);
        form.reset({ password: "" });
      }
    });
  }

  return (
    <div className="w-full max-w-md font-orbitron">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-neon-green text-glow uppercase">
          RAZOR TERMINAL
        </h1>
        <p className="text-neon-white/80 text-sm mt-2 tracking-widest">
          Awaiting authentication credentials
        </p>
      </div>
      
      <div className="border border-neon-green/30 bg-black/50 p-6 rounded-lg backdrop-blur-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-green/70" />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="> Enter password..."
                        className="font-code bg-transparent border-2 border-neon-green/30 focus:border-neon-green focus:ring-neon-green focus:ring-offset-0 text-neon-white pl-10 pr-10 h-12 text-base placeholder:text-neon-green/50"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-neon-green/70 hover:bg-neon-green/10 hover:text-neon-green"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <FormMessage className="text-red-400 text-xs pt-1" />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-12 bg-neon-green/90 text-black font-bold text-base hover:bg-neon-green hover:shadow-[0_0_20px_rgba(0,255,106,0.5)] transition-all duration-300" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                "Initiate Connection"
              )}
            </Button>
          </form>
        </Form>
      </div>
       <p className="text-center text-xs text-neon-green/40 mt-4 tracking-widest">
        System active. All attempts are logged.
      </p>
    </div>
  );
}
