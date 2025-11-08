"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { database } from "@/lib/firebase";
import { ref, push, set, get } from "firebase/database";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CalendarClock, Dice5, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "./ui/toaster";

const adminSchema = z.object({
  password: z.string().min(1, { message: "Admin password is required." }),
});

const createSchema = z.object({
  newPassword: z.string().min(1, { message: "New password is required." }),
  validity: z.string().min(1, { message: "Validity period is required." }),
});

type CreatePasswordFormProps = {
  children: React.ReactNode;
};

export default function CreatePasswordForm({ children }: CreatePasswordFormProps) {
  const [step, setStep] = useState("admin_check"); // 'admin_check' or 'create_password'
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const adminForm = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { password: "" },
  });

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { newPassword: "", validity: "" },
  });

  async function onAdminSubmit(values: z.infer<typeof adminSchema>) {
    try {
      const adminPassRef = ref(database, 'admin/password');
      const snapshot = await get(adminPassRef);

      if (snapshot.exists() && snapshot.val() === values.password) {
        setStep("create_password");
        adminForm.reset();
      } else {
        adminForm.setError("password", {
          type: "manual",
          message: "Incorrect admin password.",
        });
      }
    } catch (error) {
      console.error("Firebase admin check error:", error);
      adminForm.setError("password", {
        type: "manual",
        message: "Could not verify admin password. Check DB connection/rules.",
      });
    }
  }

  async function onCreateSubmit(values: z.infer<typeof createSchema>) {
    try {
      const passwordsListRef = ref(database, 'passwords');
      const newPasswordRef = push(passwordsListRef);
      
      await set(newPasswordRef, {
        password: values.newPassword,
        validity: values.validity
      });

      toast({
        title: "Success",
        description: `Password "${values.newPassword}" created successfully.`,
      });
      createForm.reset();
      setOpen(false);
      setTimeout(() => setStep("admin_check"), 300); // Reset for next time after dialog closes
    } catch (error: any) {
      console.error("Firebase error:", error);
      toast({
        variant: "destructive",
        title: "Error Creating Password",
        description: error.message || "Failed to save the new password. Check database rules.",
      });
    }
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomBlock = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    const newPassword = `RAZOR-${randomBlock()}-${randomBlock()}`;
    createForm.setValue('newPassword', newPassword);
  };
  
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminForm.handleSubmit(onAdminSubmit)();
  };
  
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.handleSubmit(onCreateSubmit)();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          adminForm.reset();
          createForm.reset();
          // Reset step after a short delay to allow the dialog to close gracefully
          setTimeout(() => setStep('admin_check'), 300);
        }
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-black border-neon-green/30 text-neon-white font-orbitron">
          {step === "admin_check" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-neon-green text-glow">Admin Verification</DialogTitle>
                <DialogDescription className="text-neon-white/70">
                  Enter the admin password to proceed.
                </DialogDescription>
              </DialogHeader>
              <Form {...adminForm}>
                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                             <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-green/70" />
                            <Input type="password" {...field} className="pl-10 bg-black border-neon-green/50 focus:ring-neon-green focus:border-neon-green"/>
                           </div>
                        </FormControl>
                        <FormMessage className="text-red-400 font-code text-xs" />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={adminForm.formState.isSubmitting} className="bg-neon-green/80 text-black hover:bg-neon-green hover:shadow-[0_0_15px_rgba(0,255,106,0.6)]">
                      {adminForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
          {step === "create_password" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-neon-green text-glow">Create New Password</DialogTitle>
                <DialogDescription className="text-neon-white/70">
                  Enter the new password and its validity period.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  <FormField
                    control={createForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New User Password</FormLabel>
                        <div className="relative flex items-center">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-green/50 pointer-events-none" />
                          <FormControl>
                            <Input placeholder="Enter new password" className="pl-10 pr-10 bg-black border-neon-green/50 focus:ring-neon-green focus:border-neon-green" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neon-green/70 hover:bg-neon-green/10 hover:text-neon-green"
                            onClick={generateRandomPassword}
                            aria-label="Generate random password"
                          >
                            <Dice5 className="h-5 w-5" />
                          </Button>
                        </div>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="validity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity Period</FormLabel>
                         <div className="relative">
                          <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-green/50" />
                          <FormControl>
                            <Input placeholder="e.g., 24h, 7d, 30m" className="pl-10 bg-black border-neon-green/50 focus:ring-neon-green focus:border-neon-green" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage className="text-red-400"/>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createForm.formState.isSubmitting} className="w-full bg-neon-green/80 text-black hover:bg-neon-green hover:shadow-[0_0_15px_rgba(0,255,106,0.6)]">
                      {createForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save New Password
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  );
}
