"use client";

import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { Search, Trash, Undo } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";
import { useUser } from "@/hooks/use-user";

export const TrashBox = () => {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { user } = useUser();
  const [documents, setDocuments] = useState<Document[] | undefined>(undefined);
  const [search, setSearch] = useState("");

  const fetchTrash = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", true)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setDocuments(data as Document[]);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [supabase, user]);

  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase());
  });

  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const onRestore = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    documentId: string,
  ) => {
    event.stopPropagation();
    
    const promise = (async () => {
      const { error } = await supabase
        .from("documents")
        .update({ is_archived: false })
        .eq("id", documentId);
      
      if (error) throw error;
      fetchTrash();
    })();

    toast.promise(promise, {
      loading: "Restoring note..",
      success: "Note restored!",
      error: "Failed to restore note.",
    });
  };

  const onRemove = async (documentId: string) => {
    const promise = (async () => {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
      fetchTrash();
    })();

    toast.promise(promise, {
      loading: "Deleting note..",
      success: "Note deleted!",
      error: "Failed to delete note.",
    });

    if (params.documentId === documentId) {
      router.push("/documents");
    }
  };

  if (documents === undefined) {
    return (
      <div
        className="flex h-full items-center justify-center p-4"
        aria-busy="true"
        aria-label="loading"
      >
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <section className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 bg-secondary px-2 focus-visible:ring-transparent"
          placeholder="Filter by page title..."
          aria-label="Filter by page title"
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        {filteredDocuments?.length === 0 && (
          <p className="pb-2 text-center text-xs text-muted-foreground">
            No documents found.
          </p>
        )}
        {filteredDocuments?.map((document) => (
          <div
            key={document.id}
            role="button"
            onClick={() => onClick(document.id)}
            className="flex w-full items-center justify-between rounded-sm text-sm text-primary hover:bg-primary/5"
            aria-label="Document"
          >
            <span className="truncate pl-2">{document.title}</span>
            <div className="flex items-center">
              <button
                onClick={(e) => onRestore(e, document.id)}
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                aria-label="Restore Document"
              >
                <Undo className="h-4 w-4 text-muted-foreground " />
              </button>
              <ConfirmModal onConfirm={() => onRemove(document.id)}>
                <button
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  aria-label="Delete Permanently"
                >
                  <Trash className="h-4 w-4 text-muted-foreground " />
                </button>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
