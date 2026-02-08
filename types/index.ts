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
  created_at: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
}

export type Document = Doc;
