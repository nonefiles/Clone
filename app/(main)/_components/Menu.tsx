"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

interface MenuProps {
  documentId: string;
}

export const Menu = ({ documentId }: MenuProps) => {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();

  const onExport = () => {
    const editorElement = document.querySelector(".bn-container"); // Use container for better context
    if (!editorElement) {
      toast.error("Editor content not found");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get all computed styles or at least standard ones
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join("");
        } catch (e) {
          return "";
        }
      })
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Export PDF</title>
          <style>
            ${styles}
            body { font-family: sans-serif; padding: 40px; background: white !important; }
            .bn-container { width: 100% !important; margin: 0 !important; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="bg-white">
          <div class="bn-container">
            ${editorElement.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const onArchive = async () => {
    const promise = (async () => {
      const { error } = await supabase
        .from("documents")
        .update({ is_archived: true })
        .eq("id", documentId);
      
      if (error) throw error;
      router.push("/documents");
    })();

    toast.promise(promise, {
      loading: "Moving to trash...",
      success: "Note moved to trash!",
      error: "Failed to archive note.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60"
        align="end"
        alignOffset={8}
        forceMount
      >
        <DropdownMenuItem onClick={onArchive}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export to PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-2 text-xs text-muted-foreground">
          Last edited by {user?.user_metadata?.full_name || user?.email}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-8 w-8" />;
};
