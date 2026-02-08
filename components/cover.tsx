"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "./ui/button";
import { ImageIcon, X } from "lucide-react";
import { useCoverImage } from "@/hooks/useCoverImage";
import { useParams } from "next/navigation";
import { Skeleton } from "./ui/skeleton";
import { createClient } from "@/utils/supabase/client";

interface CoverImageProps {
  url?: string;
  preview?: boolean;
}

export const Cover = ({ url, preview }: CoverImageProps) => {
  const supabase = createClient();
  const params = useParams();
  const coverImage = useCoverImage();

  const onRemove = async () => {
    if (url) {
      try {
        // url.split('/images/')[1] mantığı ile tüm alt klasör yollarını (örneğin editor/...) ayıkla
        const path = url.split("/images/")[1];
        
        if (path) {
          // Storage'dan görseli sil
          const { error } = await supabase.storage.from("images").remove([path]);
          if (error) throw error;
        }
      } catch (error) {
        console.error("Storage delete error:", error);
      }
    }

    await supabase
      .from("documents")
      .update({ cover_image: null })
      .eq("id", params.documentId);
  };

  return (
    <div
      className={cn(
        "group relative h-[35vh] w-full",
        !url && "h-[12vh]",
        url && "bg-muted",
      )}
    >
      {!!url && (
        <Image src={url} fill alt="cover" className="object-cover" priority />
      )}
      {url && !preview && (
        <div className="absolute bottom-5 right-5 flex items-center gap-x-2 opacity-0 group-hover:opacity-100">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Change cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-xs text-muted-foreground"
            variant="outline"
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="h-[12vh] w-full" />;
};
