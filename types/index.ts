export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: Doc
        Insert: Omit<Doc, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<Doc, "id" | "created_at">>
      }
    }
  }
}

export interface KanbanColumn { 
  id: string; 
  user_id: string; 
  title: string; 
  position: number; 
  created_at: string; 
}

export interface Doc {
  id: string;
  user_id: string;
  title: string;
  is_archived: boolean;
  is_published: boolean;
  parent_document_id: string | null;
  content?: string;
  cover_image?: string;
  icon?: string;
  category?: string | null;
  description?: string | null;
  created_at: string;
  status: string | null;
}

export interface FileArchiveItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    size: number;
    mimetype: string;
    cacheControl: string;
    httpStatusCode: number;
  };
}

export type Document = Doc;
