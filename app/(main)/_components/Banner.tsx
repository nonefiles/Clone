"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface BannerProps {
  documentId: string;
}

export const Banner = ({ documentId }: BannerProps) => {
  const router = useRouter();
  const supabase = createClient();

  const onRemove = async () => {
    const promise = (async () => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
      router.push("/dashboard");
    })();

    toast.promise(promise, {
      loading: "Deleting note...",
      success: "Note Deleted!",
      error: "Failed to delete note.",
    });
  };

  const onRestore = async () => {
    const promise = (async () => {
      const { error } = await supabase
        .from("documents")
        .update({ is_archived: false })
        .eq("id", documentId);
      
      if (error) throw error;
    })();

    toast.promise(promise, {
      loading: "Restoring note...",
      success: "Note restored!",
      error: "Failed to restore note.",
    });
  };

  return (
    <div className="flex w-full items-center justify-center gap-x-2 bg-rose-500 p-2 text-center text-sm text-white print:hidden">
      <p>
        This page is in the <span className="font-bold">Trash.</span>
      </p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="h-auto border-white bg-transparent p-1 px-2 font-normal text-white transition hover:bg-white hover:text-rose-500"
      >
        Restore page
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <Button
          size="sm"
          variant="outline"
          className="h-auto border-white bg-transparent p-1 px-2 font-normal text-white transition hover:bg-white hover:text-rose-500"
        >
          Delete forever
        </Button>
      </ConfirmModal>
    </div>
  );
};
