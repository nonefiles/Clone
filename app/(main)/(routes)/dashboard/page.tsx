"use client";

import { useUser } from "@/hooks/use-user";
import { useKanbanStore } from "@/stores/kanbanStore";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  ArrowRight,
  ChevronRight,
  Layout,
  HardDrive,
  Clock,
  Download,
  Trash2,
  MoreVertical,
  FileImage,
  FileCode,
  FileArchive,
  File as FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Document, FileArchiveItem } from "@/types";
import { Spinner } from "@/components/spinner";
import { KanbanBoard } from "@/components/KanbanBoard";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const { columns, documents, fetchColumns, setDocuments } = useKanbanStore();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        await fetchColumns();
        
        // Fetch Documents
        const { data: allDocs } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("created_at", { ascending: false });

        if (allDocs) {
          setDocuments(allDocs as Document[]);
          setRecentDocs(allDocs.slice(0, 4) as Document[]);
        }

        // Fetch Files from Storage
        const { data: filesData, error: filesError } = await supabase.storage
          .from("files")
          .list(user.id, {
            limit: 4,
            offset: 0,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!filesError && filesData) {
          setRecentFiles(filesData as any[]);
        }
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, fetchColumns, setDocuments, supabase]);

  const onDeleteFile = async (fileName: string) => {
    try {
      if (!user) return;

      const { error } = await supabase.storage
        .from("files")
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      toast.success("File deleted");
      setRecentFiles((prev) => prev.filter((f) => f.name !== fileName));
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const onDownloadFile = async (fileName: string) => {
    try {
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
    if (mimetype?.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mimetype?.includes("javascript") || mimetype?.includes("typescript") || mimetype?.includes("html")) 
      return <FileCode className="h-5 w-5 text-amber-500" />;
    if (mimetype?.includes("pdf") || mimetype?.includes("word")) 
      return <FileText className="h-5 w-5 text-emerald-500" />;
    if (mimetype?.includes("zip") || mimetype?.includes("rar")) 
      return <FileArchive className="h-5 w-5 text-purple-500" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        
        {/* --- Hero Section --- */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground/90">Dashboard</h1>
          <p className="text-muted-foreground text-lg font-medium">
            Welcome back. Here are your latest pages and project board.
          </p>
        </div>

        {/* --- Pages Section (Grid) --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Recent Pages</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="text-xs hover:bg-transparent hover:text-primary">
              View all pages <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <Card 
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="group relative p-5 bg-secondary/20 border-none hover:bg-secondary/40 transition-all cursor-pointer rounded-2xl overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5 text-primary/70" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{doc.title || "Untitled"}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                        Modified {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="absolute bottom-5 right-5 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <FileText className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">No pages found</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Files Section (New) --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Recent Files</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push("/archive")} className="text-xs hover:bg-transparent hover:text-primary">
              Manage all files <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <Card 
                  key={file.id}
                  className="group relative p-5 bg-secondary/20 border-none hover:bg-secondary/40 transition-all rounded-2xl overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {getFileIcon(file.metadata?.mimetype)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors" title={file.name}>
                          {file.name.split("-").slice(1).join("-") || file.name}
                        </h3>
                        <div className="flex items-center gap-x-2 text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-wider">
                          <span>{formatSize(file.metadata?.size)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-x-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(file.created_at), "MMM d")}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -mr-2">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-muted/20">
                        <DropdownMenuItem onClick={() => onDownloadFile(file.name)} className="rounded-lg cursor-pointer gap-x-2">
                          <Download className="h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteFile(file.name)} className="rounded-lg cursor-pointer gap-x-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <HardDrive className="h-8 w-8 opacity-20" />
                <p className="text-sm font-medium">No files uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Board Section --- */}
        <div className="space-y-6 pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layout className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Project Board</h2>
            </div>
          </div>
          
          <Card 
            onClick={() => router.push("/board")}
            className="group relative p-8 bg-secondary/20 border-none hover:bg-secondary/30 transition-all cursor-pointer rounded-[2rem] overflow-hidden flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-secondary"
          >
            <div className="space-y-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center shadow-sm mx-auto group-hover:scale-110 transition-transform">
                <Layout className="h-8 w-8 text-primary/70" />
              </div>
              <div>
                <h3 className="font-bold text-xl group-hover:text-primary transition-colors">Open Kanban Board</h3>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Manage your tasks and project workflow
                </p>
              </div>
              <Button variant="outline" className="rounded-xl px-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                Go to Board <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;