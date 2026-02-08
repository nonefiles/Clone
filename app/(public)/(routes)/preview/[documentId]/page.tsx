"use client";

import dynamic from "next/dynamic";
import { useMemo, use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";

import { Cover } from "@/components/cover";
import { Toolbar } from "@/components/toolbar";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentIdPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

const DocumentIdPage = ({ params }: DocumentIdPageProps) => {
  const { documentId } = use(params);
  const supabase = createClient();
  const [document, setDocument] = useState<Document | null | undefined>(undefined);

  useEffect(() => {
    const fetchDocument = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (error) {
        setDocument(null);
      } else {
        setDocument(data as Document);
      }
    };

    fetchDocument();
  }, [supabase, documentId]);

  const Editor = useMemo(
    () => dynamic(() => import("@/components/editor"), { ssr: false }),
    [],
  );

  const onChange = async (content: string) => {
    await supabase
      .from("documents")
      .update({ content })
      .eq("id", documentId);
  };

  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    );
  }

  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="pb-40">
      <Cover preview url={document.cover_image || undefined} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar preview initialData={document} />
        <Editor
          editable={false}
          onChange={onChange}
          initialContent={document.content || undefined}
        />
      </div>
    </div>
  );
};
export default DocumentIdPage;
