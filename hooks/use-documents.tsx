import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";
import { useUser } from "./use-user";
import { toast } from "sonner";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useDocuments = (parentDocumentId?: string) => {
  const [documents, setDocuments] = useState<Document[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"CONNECTED" | "DISCONNECTED" | "ERROR" | "CONNECTING">("CONNECTING");
  
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user?.id) {
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
        throw error;
      }

      setDocuments(data as Document[]);
    } catch (error: unknown) {
      console.error("FETCH_DOCUMENTS_FAILED:", error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, parentDocumentId, supabase]);

  const subscribe = useCallback(() => {
    if (!user?.id) return;

    // Temizlik: Varsa eski aboneliği kapat
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setConnectionStatus("CONNECTING");
    
    const channelName = `documents-channel-${user.id}-${parentDocumentId || 'root'}`;
    const channel = supabase
      .channel(channelName)
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
      .subscribe((status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR", err?: Error) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${channelName}`);
          setConnectionStatus("CONNECTED");
          retryCount.current = 0;
        }
        
        if (status === 'CLOSED') {
          setConnectionStatus("DISCONNECTED");
        }

        if (status === 'CHANNEL_ERROR') {
          setConnectionStatus("ERROR");
          const errorMessage = err?.message || "Realtime connection error";
          console.error("CHANNEL_CONNECTION_ERROR:", errorMessage);
          
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            // Üstel geri çekilme (exponential backoff)
            const delay = Math.min(Math.pow(2, retryCount.current) * 1000, 30000);
            console.log(`Retrying in ${delay}ms... (Attempt ${retryCount.current}/${maxRetries})`);
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              subscribe();
            }, delay);
          } else {
            toast.error("Canlı veri bağlantısı kesildi. Lütfen sayfayı yenileyin.");
          }
        }
      });

    channelRef.current = channel;
  }, [user?.id, parentDocumentId, supabase, fetchDocuments]);

  useEffect(() => {
    fetchDocuments();

    if (user?.id) {
      subscribe();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Realtime kanal aboneliğini temizle ve kesin olarak sonlandır
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, parentDocumentId, fetchDocuments, subscribe, supabase]);

  return {
    documents,
    isLoading,
    connectionStatus,
  };
};
