"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";

const DocumentsPage = () => {
  const { user } = useUser();
  const supabase = createClient();
  const router = useRouter();

  const onCreate = async () => {
    if (!user) return;

    const promise = (async () => {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title: "Untitled",
          user_id: user.id,
          is_archived: false,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/documents/${data.id}`);
      return data.id;
    })();

    toast.promise(promise, {
      loading: "Creating a new note....",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src="/empty.svg"
        alt="empty"
        height="300"
        width="300"
        priority
        className="dark:hidden"
      />
      <Image
        src="/empty-dark.svg"
        alt="empty"
        height="300"
        width="300"
        priority
        className="hidden dark:block"
      />
      <h2 className="text-lg font-medium">
        Welcome to {user?.email?.split("@")[0]}&apos;s Zotion
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a note
      </Button>
    </div>
  );
};
export default DocumentsPage;
