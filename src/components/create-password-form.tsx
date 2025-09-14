"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, KeyRound, CalendarClock } from "lucide-react";
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
  adminPassword: string;
};

export default function CreatePasswordForm({ adminPassword }: CreatePasswordFormProps) {
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

  function onAdminSubmit(values: z.infer<typeof adminSchema>) {
    if (values.password === adminPassword) {
      setStep("create_password");
      adminForm.reset();
    } else {
      adminForm.setError("password", {
        type: "manual",
        message: "Incorrect admin password.",
      });
    }
  }

  async function onCreateSubmit(values: z.infer<typeof createSchema>) {
    try {
      const passwordRef = ref(database, 'secret/password');
      const validityRef = ref(database, 'secret/validity');
      
      await set(passwordRef, values.newPassword);
      await set(validityRef, values.validity);

      toast({
        title: "Success",
        description: "New password has been saved successfully.",
      });
      createForm.reset();
      setOpen(false);
      setStep("admin_check"); // Reset for next time
    } catch (error) {
      console.error("Firebase error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the new password.",
      });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          adminForm.reset();
          createForm.reset();
          setStep('admin_check');
        }
      }}>
        <DialogTrigger asChild>
          <Button variant="outline">إنشاء كود</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          {step === "admin_check" && (
            <>
              <DialogHeader>
                <DialogTitle>Admin Verification</DialogTitle>
                <DialogDescription>
                  Enter the admin password to proceed.
                </DialogDescription>
              </DialogHeader>
              <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                  <FormField
                    control={adminForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={adminForm.formState.isSubmitting}>
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
                <DialogTitle>Create New Password</DialogTitle>
                <DialogDescription>
                  Enter the new password and its validity period.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="Enter new password" className="pl-10" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
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
                          <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <FormControl>
                            <Input placeholder="e.g., 24h, 7d, 30m" className="pl-10" {...field} />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={createForm.formState.isSubmitting}>
                      {createForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Password
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
