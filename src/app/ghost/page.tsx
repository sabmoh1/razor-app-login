
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { database } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import { Loader2, AlertCircle, User, KeyRound } from "lucide-react";
import KillSwitch from "@/components/kill-switch";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "KEY is required." }),
});

function isTimeBasedValidity(validity: string | null | undefined): boolean {
    if (!validity) return false;
    const lastChar = validity.slice(-1).toLowerCase();
    return ['h', 'd', 'm', 's'].includes(lastChar);
}

export default function GhostLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
          if (passwordData.attemps || passwordData.attempts || !isTimeBasedValidity(passwordData.validity)) {
              setError("This key is not valid for this page.");
              setIsSubmitting(false);
              return;
          }

          const passwordRef = ref(database, `passwords/${passwordKey}`);
          if (passwordData.uses && passwordData.uses > 1) {
            await update(passwordRef, { uses: passwordData.uses - 1 });
          } else if(passwordData.uses) {
            await remove(passwordRef);
          }

          sessionStorage.setItem('razor_user_id', values.userId);
          sessionStorage.setItem('razor_session_validity', passwordData.validity || '1h');
          router.push('/ghost/welcome');

        } else {
          setError("Invalid credentials. Please try again.");
          setIsSubmitting(false);
        }
      } else {
        setError("System error: Could not verify credentials.");
        setIsSubmitting(false);
      }
    } catch (e) {
      setError("Network error. Please check your connection.");
      console.error("Login error:", e);
      setIsSubmitting(false);
    }
  }

  return (
    <KillSwitch pageName="ghost">
       <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex; justify-content: center; align-items: center;
          min-height: 100vh; background-color: #0a0a0a; color: #00ff41;
          font-family: "Courier New", monospace; overflow: hidden; position: relative;
        }
        .background-grid {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-image: linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
          background-size: 50px 50px; z-index: 1;
        }
        .login-container { position: relative; z-index: 10; width: 100%; max-width: 400px; padding: 1rem; }
        .login-box {
          background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(5px);
          border: 1px solid rgba(0, 255, 65, 0.2); border-radius: 15px;
          padding: 30px; box-shadow: 0 0 40px rgba(0, 255, 65, 0.2);
          text-align: center;
        }
        .title {
          font-size: 2.2rem; margin-bottom: 5px; letter-spacing: 4px;
          text-transform: uppercase; text-shadow: 0 0 15px #00ff41;
          font-weight: 700;
        }
        .ghost-image {
          width: 120px;
          height: auto;
          margin: 10px auto;
          filter: drop-shadow(0 0 15px rgba(0, 255, 65, 0.7));
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }
        .input-wrapper { position: relative; margin-bottom: 20px; }
        .input-icon {
          position: absolute; left: 15px; top: 50%;
          transform: translateY(-50%); color: rgba(0, 255, 65, 0.6);
        }
        .input-field {
          width: 100%; padding: 12px 12px 12px 45px;
          background-color: rgba(0, 255, 65, 0.05); border: 1px solid rgba(0, 255, 65, 0.3);
          border-radius: 8px; color: #00ff41; font-family: "Courier New", monospace;
          font-size: 1rem; outline: none; transition: all 0.3s;
        }
        .input-field::placeholder { color: rgba(0, 255, 65, 0.4); }
        .input-field:focus {
          border-color: #00ff41; box-shadow: 0 0 15px rgba(0, 255, 65, 0.3);
        }
        .submit-btn {
          width: 100%; padding: 14px; background: #00ff41; color: #0a0a0a;
          border: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem;
          cursor: pointer; transition: all 0.3s; text-transform: uppercase;
          letter-spacing: 2px;
        }
        .submit-btn:hover { box-shadow: 0 0 20px #00ff41; }
        .submit-btn:disabled { background: #009926; cursor: not-allowed; }
        .error-msg { color: #ff4d4d; font-size: 0.9rem; min-height: 20px; margin-top: 10px; }
      `}</style>
      
      <div className="background-grid"></div>

      <div className="login-container">
        <div className="login-box">
          <h1 className="title">GHOST</h1>
          <img src="https://iili.io/fE2Ejrg.png" alt="Ghost" className="ghost-image" />
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {error && (
              <div className="error-msg flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input
                {...form.register('userId')}
                type="text"
                placeholder="User ID"
                className="input-field"
                inputMode="numeric"
                maxLength={11}
              />
            </div>
             {form.formState.errors.userId && <p className="text-red-400 text-xs text-left pl-1">{form.formState.errors.userId.message}</p>}

            <div className="input-wrapper">
              <KeyRound className="input-icon" size={20} />
              <input
                {...form.register('password')}
                type="password"
                placeholder="KEY"
                className="input-field"
              />
            </div>
            {form.formState.errors.password && <p className="text-red-400 text-xs text-left pl-1">{form.formState.errors.password.message}</p>}

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </KillSwitch>
  );
}
