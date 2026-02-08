import { create } from "zustand";
import { KanbanColumn, Document } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface KanbanStore {
  columns: KanbanColumn[];
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fetchColumns: () => Promise<void>;
  addColumn: (title: string) => Promise<void>;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  moveColumn: (id: string, newPosition: number) => Promise<void>;
  fetchDocumentsByColumn: (columnId: string) => Document[];
  setDocuments: (documents: Document[] | ((prev: Document[]) => Document[])) => void;
  createDocument: (title: string, columnId: string) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocumentStatus: (docId: string, columnId: string | null) => Promise<void>;
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  columns: [],
  documents: [],
  isLoading: false,
  error: null,

  fetchColumns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/kanban-columns");
      if (!response.ok) throw new Error("Failed to fetch columns");
      const columns = await response.json();
      set({ columns });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addColumn: async (title: string) => {
    const { columns } = get();
    const position = columns.length;
    try {
      const response = await fetch("/api/kanban-columns", {
        method: "POST",
        body: JSON.stringify({ title, position }),
      });
      if (!response.ok) throw new Error("Failed to add column");
      const newColumn = await response.json();
      set({ columns: [...columns, newColumn] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateColumn: async (id: string, updates: Partial<KanbanColumn>) => {
    try {
      const response = await fetch("/api/kanban-columns", {
        method: "PUT",
        body: JSON.stringify({ id, ...updates }),
      });
      if (!response.ok) throw new Error("Failed to update column");
      const updatedColumn = await response.json();
      set({
        columns: get().columns.map((col) =>
          col.id === id ? updatedColumn : col
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  deleteColumn: async (id: string) => {
    try {
      const response = await fetch(`/api/kanban-columns?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete column");
      set({
        columns: get().columns.filter((col) => col.id !== id),
        documents: get().documents.map((doc) =>
          doc.status === id ? { ...doc, status: null } : doc
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  moveColumn: async (id: string, newPosition: number) => {
    const { columns } = get();
    const updatedColumns = [...columns].sort((a, b) => a.position - b.position);
    const colIndex = updatedColumns.findIndex((col) => col.id === id);
    if (colIndex === -1) return;

    const [movedCol] = updatedColumns.splice(colIndex, 1);
    updatedColumns.splice(newPosition, 0, movedCol);

    const finalColumns = updatedColumns.map((col, index) => ({
      ...col,
      position: index,
    }));

    set({ columns: finalColumns });

    try {
      await Promise.all(
        finalColumns.map((col) =>
          fetch("/api/kanban-columns", {
            method: "PUT",
            body: JSON.stringify({ id: col.id, position: col.position }),
          })
        )
      );
    } catch (error: any) {
      set({ error: "Failed to sync column positions" });
      await get().fetchColumns();
    }
  },

  fetchDocumentsByColumn: (columnId: string) => {
    return get().documents.filter((doc) => doc.status === columnId);
  },

  setDocuments: (documents: Document[] | ((prev: Document[]) => Document[])) => {
    if (typeof documents === "function") {
      set({ documents: documents(get().documents) });
    } else {
      set({ documents });
    }
  },
  
  createDocument: async (title: string, columnId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          title,
          user_id: user.id,
          status: columnId,
          is_archived: false,
          is_published: false,
          parent_document_id: null,
          category: "",
          description: ""
        })
        .select()
        .single();

      if (error) throw error;

      set({
        documents: [...get().documents, data as Document],
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateDocument: async (id: string, updates: Partial<Document>) => {
    const supabase = createClient();
    console.log("Supabase update call for ID:", id, "with updates:", updates);
    try {
      const { data, error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        console.error("Supabase update error details:", JSON.stringify(error, null, 2));
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No data returned from update. Possible RLS issue or ID mismatch.");
        throw new Error("No data returned from update");
      }

      const updatedDoc = data[0];
      console.log("Supabase update success, returned data:", updatedDoc);

      set({
        documents: get().documents.map((doc) =>
          doc.id === id ? { ...doc, ...updatedDoc } : doc
        ),
      });
    } catch (error: any) {
      console.error("Store updateDocument caught error:", error);
      set({ error: error.message });
      throw error;
    }
  },

  deleteDocument: async (id: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", id);

      if (error) throw error;

      set({
        documents: get().documents.filter((doc) => doc.id !== id),
      });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateDocumentStatus: async (docId: string, columnId: string | null) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("documents")
        .update({ status: columnId })
        .eq("id", docId);

      if (error) throw error;

      set({
        documents: get().documents.map((doc) =>
          doc.id === docId ? { ...doc, status: columnId } : doc
        ),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
