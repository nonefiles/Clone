"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  File as FileIcon, 
  MoreVertical, 
  Trash2, 
  Download, 
  ExternalLink, 
  Search,
  FileText,
  FileImage,
  FileCode,
  FileArchive,
  Loader2,
  Clock,
  HardDrive
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { FileArchiveItem } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const FileList = () => {
  const [files, setFiles] = useState<FileArchiveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from("files")
        .list(user.id, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;
      setFiles((data as any[]) || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      if (!error.message.includes("Bucket not found")) {
        toast.error("Failed to fetch files");
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, supabase.storage]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const onDelete = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.storage
        .from("files")
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const onDownload = async (fileName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from("files")
        .download(`${user.id}/${fileName}`);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName.split("-").slice(1).join("-") || fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimetype?.includes("javascript") || mimetype?.includes("typescript") || mimetype?.includes("html")) 
      return <FileCode className="h-8 w-8 text-amber-500" />;
    if (mimetype?.includes("pdf") || mimetype?.includes("word")) 
      return <FileText className="h-8 w-8 text-emerald-500" />;
    if (mimetype?.includes("zip") || mimetype?.includes("rar")) 
      return <FileArchive className="h-8 w-8 text-purple-500" />;
    return <FileIcon className="h-8 w-8 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-x-2 bg-background/60 backdrop-blur-sm p-1 rounded-xl border shadow-sm max-w-md">
        <div className="pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-secondary/5 rounded-3xl border-2 border-dashed">
          <div className="p-4 bg-background rounded-2xl shadow-sm">
            <HardDrive className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">No files found</h3>
            <p className="text-sm text-muted-foreground font-medium">
              Upload your first file to see it here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group relative overflow-hidden border-none bg-background/60 p-4 shadow-sm hover:shadow-md transition-all hover:bg-background">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-x-4">
                  <div className="rounded-xl bg-secondary/30 p-3 group-hover:scale-110 transition-transform">
                    {getFileIcon(file.metadata?.mimetype)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="truncate font-bold text-sm" title={file.name}>
                      {file.name.split("-").slice(1).join("-") || file.name}
                    </h4>
                    <div className="flex items-center gap-x-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      <span>{formatSize(file.metadata?.size)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-x-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(file.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-muted/20">
                    <DropdownMenuItem onClick={() => onDownload(file.name)} className="rounded-lg cursor-pointer gap-x-2">
                      <Download className="h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(file.name)} className="rounded-lg cursor-pointer gap-x-2 text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
