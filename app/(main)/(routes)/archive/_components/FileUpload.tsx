"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onSuccess: () => void;
}

export const FileUpload = ({ onSuccess }: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("files")
        .upload(filePath, file);

      if (error) {
        if (error.message.includes("Bucket not found")) {
          throw new Error("Supabase storage 'files' bucket is not created yet. Please create it in your Supabase dashboard.");
        }
        throw error;
      }

      toast.success("File uploaded successfully");
      onSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }, [supabase, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-secondary/10 p-12 transition hover:bg-secondary/20",
        isDragActive && "border-primary bg-primary/5",
        isUploading && "pointer-events-none opacity-60"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="rounded-full bg-background p-4 shadow-sm group-hover:scale-110 transition-transform">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">
            {isUploading ? "Uploading..." : "Click or drag file to upload"}
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            Support for all file types
          </p>
        </div>
      </div>
    </div>
  );
};
