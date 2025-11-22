
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
import { Eye, EyeOff, Lock, Loader2, AlertCircle, ArrowRight } from "lucide-react";

const formSchema = z.object({
  password: z
    .string()
    .min(1, { message: "Password is required." }),
});

export type LoginFormProps = {
  theme?: 'green' | 'red' | 'blue' | 'teal';
  welcomePath?: string;
  title?: string;
};

export default function LoginForm({ theme = 'green', welcomePath = '/Razor_1x', title = 'RAZOR TERMINAL' }: LoginFormProps) {
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
  
  const colors = {
    green: {
      glow: 'text-glow-green',
      text: 'text-neon-green',
      border: 'border-neon-green/30',
      focusBorder: 'focus:border-neon-green',
      ring: 'focus:ring-neon-green',
      placeholder: 'placeholder:text-neon-green/50',
      icon: 'text-neon-green/70',
      buttonHoverBg: 'hover:bg-neon-green/10',
      buttonHoverText: 'hover:text-neon-green',
      submitBg: 'bg-neon-green/10',
      submitHoverBg: 'hover:bg-neon-green/20',
      submitText: 'text-neon-green',
    },
    red: {
      glow: 'text-glow-red',
      text: 'text-neon-red',
      border: 'border-neon-red/30',
      focusBorder: 'focus:border-neon-red',
      ring: 'focus:ring-neon-red',
      placeholder: 'placeholder:text-neon-red/50',
      icon: 'text-neon-red/70',
      buttonHoverBg: 'hover:bg-neon-red/10',
      buttonHoverText: 'hover:text-neon-red',
      submitBg: 'bg-neon-red/10',
      submitHoverBg: 'hover:bg-neon-red/20',
      submitText: 'text-neon-red',
    },
    blue: {
      glow: 'text-glow-blue',
      text: 'text-neon-blue',
      border: 'border-neon-blue/30',
      focusBorder: 'focus:border-neon-blue',
      ring: 'focus:ring-neon-blue',
      placeholder: 'placeholder:text-neon-blue/50',
      icon: 'text-neon-blue/70',
      buttonHoverBg: 'hover:bg-neon-blue/10',
      buttonHoverText: 'hover:text-neon-blue',
      submitBg: 'bg-neon-blue/10',
      submitHoverBg: 'hover:bg-neon-blue/20',
      submitText: 'text-neon-blue',
    },
    teal: {
      glow: 'text-glow-teal',
      text: 'text-neon-teal',
      border: 'border-neon-teal/30',
      focusBorder: 'focus:border-neon-teal',
      ring: 'focus:ring-neon-teal',
      placeholder: 'placeholder:text-neon-teal/50',
      icon: 'text-neon-teal/70',
      buttonHoverBg: 'hover:bg-neon-teal/10',
      buttonHoverText: 'hover:text-neon-teal',
      submitBg: 'bg-neon-teal/10',
      submitHoverBg: 'hover:bg-neon-teal/20',
      submitText: 'text-neon-teal',
    }
  };

  const currentTheme = colors[theme];


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: values.password }),
        });

        const data = await response.json();

        if (response.ok) {
          sessionStorage.setItem('razor_session_validity', data.validity);
          router.push(welcomePath);
        } else {
          setError(data.message || "An unknown error occurred");
          form.reset({ password: "" });
        }
      } catch (error: any) {
        setError("SYSTEM ERROR: Could not connect to the server.");
        console.error("Login error:", error);
        form.reset({ password: "" });
      }
    });
  }

  return (
    <div className="w-full max-w-md font-orbitron">
      <div className="text-center mb-8">
        <h1 className={`text-4xl font-black ${currentTheme.text} ${currentTheme.glow} uppercase`}>
          {title}
        </h1>
        <p className="text-neon-white/80 text-sm mt-2 tracking-widest">
          Awaiting authentication credentials
        </p>
      </div>
      
      <div className={`border ${currentTheme.border} bg-black/50 p-6 rounded-lg backdrop-blur-sm`}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-3 rounded-md text-sm flex items-center gap-2 font-code">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="relative flex items-center">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${currentTheme.icon}`} />
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="> Enter password..."
                        className={`font-code bg-transparent border-2 ${currentTheme.border} ${currentTheme.focusBorder} ${currentTheme.ring} focus:ring-offset-0 text-neon-white pl-10 pr-24 h-12 text-base ${currentTheme.placeholder} flex-grow`}
                        {...field}
                      />
                    </FormControl>
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 ${currentTheme.icon} ${currentTheme.buttonHoverBg} ${currentTheme.buttonHoverText}`}
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
                        className={`h-9 w-9 ${currentTheme.submitText} ${currentTheme.submitBg} ${currentTheme.submitHoverBg} hover:text-neon-white disabled:opacity-50`}
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
                  <FormMessage className="text-red-400 text-xs pt-1 font-code" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      <div className={`text-center text-xs ${currentTheme.text}/40 mt-4 tracking-widest flex justify-center items-center gap-2`}>
        <span>System active.</span>
      </div>
    </div>
  );
}
