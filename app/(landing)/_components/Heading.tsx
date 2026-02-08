"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";

export const Heading = () => {
  const { user, isLoading: loading } = useUser();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold sm:text-5xl md:text-5xl">
        Your Ideas💡, Documents📕, & Plans🚀. Welcome to{" "}
        <span className="underline">Zotion</span>
      </h1>
      <h2 className="text-base font-medium sm:text-xl">
        Zotion is the connected workspace where <br /> better, faster work
        happens.
      </h2>
      {loading && (
        <div className="flex w-full items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      {user && !loading && (
        <Button asChild>
          <Link href="/documents">
            Enter Zotion
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
      {!user && !loading && (
        <Button asChild>
          <Link href="/register">
            Get Zotion free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
};
