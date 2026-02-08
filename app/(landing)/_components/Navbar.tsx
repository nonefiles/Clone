"use client";

import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

export const Navbar = () => {
  const scrolled = useScrollTop();
  const { user, isLoading: loading } = useUser();

  return (
    <nav
      className={cn(
        "sticky inset-x-0 top-0 z-50 mx-auto flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]",
        scrolled && "border-b shadow-sm",
      )}
    >
      <Logo />
      <div className="flex w-full items-center justify-end md:ml-auto">
        <div className="flex items-center gap-x-2">
          {!loading && !user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Get Zotion Free</Link>
              </Button>
            </>
          )}

          {user && !loading && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/documents"> Enter Zotion </Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};
