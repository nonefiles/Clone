"use client";

import { useState } from "react";
import { 
  Archive, 
  Plus, 
  Info,
  HardDrive,
  UploadCloudIcon
} from "lucide-react";
import { FileUpload } from "./_components/FileUpload";
import { FileList } from "./_components/FileList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ArchivePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const onUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setIsUploadOpen(false);
  };

  return (
    <div className="flex h-full flex-col bg-background/50 p-4 md:p-6 lg:p-8">
      {/* Header Area */}
      <div className="mb-8 flex flex-col gap-y-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-sm">
            <Archive className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">File Archive</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Manage and organize your uploaded documents and media.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-3">
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-x-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-x-2">
                  <UploadCloudIcon className="h-5 w-5 text-primary" />
                  Upload New File
                </DialogTitle>
                <DialogDescription className="font-medium">
                  Select a file to add to your archive. It will be stored securely.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <FileUpload onSuccess={onUploadSuccess} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats/Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 rounded-2xl bg-background/40 border border-muted/20 flex items-center gap-x-4">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <HardDrive className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Storage Status</p>
            <p className="text-sm font-bold">Active & Secure</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-background/40 border border-muted/20 flex items-center gap-x-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Archive className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Archive Mode</p>
            <p className="text-sm font-bold">Infinite Capacity</p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-background/40 border border-muted/20 flex items-center gap-x-4">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <Info className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Note</p>
            <p className="text-sm font-bold">Files are private to you</p>
          </div>
        </div>
      </div>

      {/* File List Section */}
      <div className="flex-1 min-h-0">
        <FileList key={refreshKey} />
      </div>
    </div>
  );
};

export default ArchivePage;
