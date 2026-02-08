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
        <div className="flex min-w-[140px] items-center justify-end gap-x-2">
          {loading && (
            <div className="flex w-[160px] items-center justify-end gap-x-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
            </div>
          )}
          {!loading && !user && (
            <div className="flex items-center gap-x-2">
              <Button variant="ghost" size="sm" asChild className="w-[80px]">
                <Link href="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="w-[140px]">
                <Link href="/register">Get none-notion Free</Link>
              </Button>
            </div>
          )}

          {user && !loading && (
            <div className="flex items-center gap-x-2">
              <Button variant="ghost" size="sm" asChild className="w-[140px]">
                <Link href="/dashboard"> Enter none-notion </Link>
              </Button>
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
};
