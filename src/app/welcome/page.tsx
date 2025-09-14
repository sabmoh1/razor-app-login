"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 antialiased">
      <Card className="w-full max-w-md text-center shadow-lg animate-in fade-in-50">
        <CardHeader className="items-center">
          <CardTitle className="text-3xl font-bold font-headline">Welcome!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <CheckCircle2 className="h-20 w-20 text-primary" />
          </div>
          <p className="mt-4 text-lg text-muted-foreground">
            You have been successfully logged in.
          </p>
          <Button onClick={handleSignOut} variant="outline" className="mt-8 w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
