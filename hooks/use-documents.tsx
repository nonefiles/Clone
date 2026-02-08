import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";
import { useUser } from "./use-user";

export const useDocuments = (parentDocumentId?: string) => {
  const [documents, setDocuments] = useState<Document[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    // Basic UUID validation (optional but helpful for debugging)
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    if (!isUUID(user.id)) {
      console.error("INVALID_USER_ID_FORMAT:", user.id);
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    if (parentDocumentId && !isUUID(parentDocumentId)) {
      console.error("INVALID_PARENT_DOCUMENT_ID_FORMAT:", parentDocumentId);
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let query = supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (parentDocumentId) {
        query = query.eq("parent_document_id", parentDocumentId);
      } else {
        query = query.is("parent_document_id", null);
      }

      const { data, error } = await query;

      if (error) {
        console.error("SUPABASE_QUERY_ERROR_DETAILS:", {
          ...error,
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        
        // Also log all property names in case they are non-enumerable
        console.error("ERROR_PROPERTY_NAMES:", Object.getOwnPropertyNames(error));
        
        // Log the query context for debugging
        console.log("QUERY_CONTEXT:", {
          userId: user.id,
          parentDocumentId: parentDocumentId || "root",
        });

        throw error;
      }

      setDocuments(data as Document[]);
    } catch (error: any) {
      console.error("FETCH_DOCUMENTS_FAILED:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, parentDocumentId, supabase]);

  useEffect(() => {
    fetchDocuments();

    if (!user?.id) return;

    const channel = supabase
      .channel(`documents-channel-${parentDocumentId || 'root'}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to documents-channel-${parentDocumentId || 'root'}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for documents-channel-${parentDocumentId || 'root'}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, parentDocumentId, supabase, fetchDocuments]);

  return {
    documents,
    isLoading,
  };
};
