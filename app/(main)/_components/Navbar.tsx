"use client";

import { MenuIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Title } from "./Title";
import { Banner } from "./Banner";
import { Menu } from "./Menu";
import { Publish } from "./Publish";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const params = useParams();
  const supabase = createClient();
  const [document, setDocument] = useState<Document | null | undefined>(undefined);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!params.documentId) return;
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", params.documentId)
        .single();

      if (error) {
        setDocument(null);
      } else {
        setDocument(data as Document);
      }
    };

    fetchDocument();
  }, [supabase, params.documentId]);

  if (document === undefined) {
    return (
      <nav className="flex w-full items-center justify-between bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2 ">
          <Menu.Skeleton />
        </div>
      </nav>
    );
  }

  if (document === null) {
    return null;
  }

  return (
    <>
      <nav className="flex w-full items-center gap-x-2 bg-background px-3 py-2 dark:bg-[#1F1F1F] print:hidden">
        {isCollapsed && (
          <button aria-label="Menu">
            <MenuIcon
              onClick={onResetWidth}
              className="h-6 w-6 text-muted-foreground"
            />
          </button>
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={document} />
          <div className="flex items-center gap-x-2">
            <Publish initialData={document} />
            <Menu documentId={document.id} />
          </div>
        </div>
      </nav>
      {document.is_archived && <Banner documentId={document.id} />}
    </>
  );
};
