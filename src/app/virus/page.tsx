
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { database } from "@/lib/firebase";
import { ref, get, update, remove } from "firebase/database";
import Head from "next/head";
import { Loader2 } from "lucide-react";
import KillSwitch from "@/components/kill-switch";

const formSchema = z.object({
  userId: z
    .string()
    .min(9, { message: "ID must be between 9 and 11 digits." })
    .max(11, { message: "ID must be between 9 and 11 digits." })
    .regex(/^[0-9]+$/, { message: "ID must contain only numbers." }),
  password: z.string().min(1, { message: "KEY is required." }),
  game: z.enum(["crash", "apple"], {
    required_error: "You need to select a game.",
  }),
});

export default function VirusLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: "",
      password: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;
  const selectedGame = watch("game");

  const handleCheckboxChange = (game: "crash" | "apple") => {
    if (selectedGame === game) {
      setValue("game", undefined as any);
    } else {
      setValue("game", game);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const passwordsRef = ref(database, "passwords");
      const snapshot = await get(passwordsRef);

      if (snapshot.exists()) {
        const allPasswords = snapshot.val();
        let isValid = false;
        let validity = "1h";
        let passwordKey: string | null = null;
        let passwordData: any = null;

        for (const key in allPasswords) {
          if (allPasswords[key].password === values.password) {
            isValid = true;
            validity = allPasswords[key].validity || "1h";
            passwordKey = key;
            passwordData = allPasswords[key];
            break;
          }
        }

        if (isValid && passwordKey && passwordData) {
          const passwordRef = ref(database, `passwords/${passwordKey}`);
          if (passwordData.uses && passwordData.uses > 1) {
            await update(passwordRef, { uses: passwordData.uses - 1 });
          } else {
            await remove(passwordRef);
          }
          sessionStorage.setItem("razor_user_id", values.userId);
          sessionStorage.setItem("razor_session_validity", validity);
          // Here you could potentially route to different welcome pages based on values.game
          router.push("/virus/welcome");
        } else {
          setAuthError("Invalid credentials. Please try again.");
        }
      } else {
        setAuthError("System error: Could not verify credentials.");
      }
    } catch (error) {
      setAuthError("Network error. Please check your connection.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KillSwitch pageName="virus">
      <Head>
        <title>VIRUS &mdash; Login</title>
      </Head>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
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
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: -1;
        }
        .login-box {
          background: rgba(0, 0, 0, 0.85);
          padding: 40px 35px;
          border-radius: 25px;
          box-shadow: 0 0 30px #ff4d4d, 0 10px 40px rgba(255, 77, 77, 0.3);
          text-align: center;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 77, 77, 0.2);
          position: relative;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: fadeInUp 0.8s ease-out;
        }
        .login-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 40px #ff4d4d, 0 15px 50px rgba(255, 77, 77, 0.4);
        }
        .login-box::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent,
            rgba(255, 77, 77, 0.1),
            transparent
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
        }
        .logo h2 {
          color: #ff4d4d;
          font-size: 32px;
          font-weight: 700;
          text-shadow: 0 0 20px rgba(255, 77, 77, 0.7);
          letter-spacing: 2px;
          position: relative;
          display: inline-block;
        }
        .logo h2::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, transparent, #ff4d4d, transparent);
        }
        .input-group input {
          width: 100%;
          padding: 18px 20px;
          border-radius: 15px;
          border: 2px solid rgba(255, 77, 77, 0.3);
          font-size: 16px;
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          outline: none;
          text-align: center;
          transition: all 0.3s ease;
          font-family: "Cairo", sans-serif;
        }
        .input-group input:focus {
          border-color: #ff4d4d;
          background: white;
          box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);
        }
        .checkbox-label {
          color: white;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          user-select: none;
          transition: all 0.3s ease;
          padding: 10px 15px;
          border-radius: 12px;
          background: rgba(255, 77, 77, 0.1);
        }
        .checkbox-label:hover {
          background: rgba(255, 77, 77, 0.2);
        }
        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #ff4d4d;
          border-radius: 6px;
          -moz-appearance: none;
          appearance: none;
          background-color: #222;
          border: 2px solid #ff4d4d;
          position: relative;
          transition: all 0.3s ease;
        }
        .checkbox-label input[type="checkbox"]:checked {
          background-color: #ff4d4d;
          border-color: #ff4d4d;
          box-shadow: 0 0 10px rgba(255, 77, 77, 0.5);
        }
        .checkbox-label input[type="checkbox"]:checked::after {
          content: "✓";
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 14px;
          font-weight: bold;
        }
        .login-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #ff4d4d, #cc0000);
          color: white;
          border: none;
          border-radius: 15px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 5px 15px rgba(255, 77, 77, 0.4);
        }
        .login-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 77, 77, 0.6);
        }
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="login-container">
        <div className="login-box">
          <div className="logo mb-8 relative">
            <h2 id="appTitle">VIRUS</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="input-group">
              <input
                type="text"
                {...register("userId")}
                placeholder="ID"
                inputMode="numeric"
                maxLength={11}
              />
              {errors.userId && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.userId.message}
                </p>
              )}
            </div>

            <div className="input-group">
              <input type="password" {...register("password")} placeholder="KEY" />
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="checkbox-group flex justify-center gap-5 mb-8">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGame === "crash"}
                  onChange={() => handleCheckboxChange("crash")}
                />
                <span>Crash</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedGame === "apple"}
                  onChange={() => handleCheckboxChange("apple")}
                />
                <span>Apple</span>
              </label>
            </div>
             {errors.game && (
                <p className="text-red-400 text-sm -mt-4 mb-4">
                  {errors.game.message}
                </p>
              )}
            
            {authError && (
                <p className="text-red-400 text-sm my-4">{authError}</p>
            )}

            <button
              className="login-btn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin inline-block" />
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </KillSwitch>
  );
}
