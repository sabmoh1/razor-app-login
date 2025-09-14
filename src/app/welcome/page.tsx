import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
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
          <Button asChild className="mt-8 w-full">
            <Link href="/">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
