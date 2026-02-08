import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold">Authentication Error</h1>
      <p className="text-muted-foreground">
        Something went wrong while trying to verify your account.
      </p>
      <Button asChild>
        <Link href="/login">Back to Login</Link>
      </Button>
    </div>
  );
}
