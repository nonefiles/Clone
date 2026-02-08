"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Document } from "@/types";
import { useDocuments } from "@/hooks/use-documents";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";
import { Item } from "./Item";
import { FileIcon } from "lucide-react";

interface SortableItemProps {
  document: Document;
  level: number;
  onExpand: (id: string) => void;
  expanded: boolean;
  onRedirect: (id: string) => void;
  activeId?: string | string[];
}
interface DocumentListProps {
  parentDocumentId?: string;
  level?: number;
}

const SortableItem = ({
  document,
  level,
  onExpand,
  expanded,
  onRedirect,
  activeId,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleY: 1, scaleX: 1 } : null,
    ),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Item
        id={document.id}
        onClick={() => onRedirect(document.id)}
        label={document.title}
        icon={FileIcon}
        documentIcon={document.icon || undefined}
        active={activeId === document.id}
        level={level}
        onExpand={() => onExpand(document.id)}
        expanded={expanded}
      />
      {expanded && (
        <DocumentList parentDocumentId={document.id} level={level + 1} />
      )}
    </div>
  );
};

export const DocumentList = ({
  parentDocumentId,
  level = 0,
}: DocumentListProps) => {
  const params = useParams();
  const router = useRouter();
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [orderedDocuments, setOrderedDocuments] = useState<Document[]>([]);

  const { documents, isLoading, connectionStatus } = useDocuments(parentDocumentId);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    if (isDragging) {
      return;
    }
    if (documents) {
      setOrderedDocuments(documents);
    }
  }, [documents, isDragging]);

  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }));
  };

  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = orderedDocuments.findIndex(
        (doc) => doc.id === active.id,
      );
      const newIndex = orderedDocuments.findIndex((doc) => doc.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setOrderedDocuments((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  if (isLoading) {
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    );
  }

  return (
    <div className="w-full relative">
      {level === 0 && (
        <div className="absolute top-0 right-2 flex items-center gap-x-1 opacity-50 hover:opacity-100 transition">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            connectionStatus === "CONNECTED" && "bg-emerald-500",
            connectionStatus === "CONNECTING" && "bg-amber-500",
            connectionStatus === "ERROR" && "bg-rose-500",
            connectionStatus === "DISCONNECTED" && "bg-slate-500",
          )} />
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">
            {connectionStatus === "CONNECTED" && "Canlı"}
            {connectionStatus === "CONNECTING" && "Bağlanıyor"}
            {connectionStatus === "ERROR" && "Hata"}
            {connectionStatus === "DISCONNECTED" && "Bağlantı Kesildi"}
          </span>
        </div>
      )}
      {orderedDocuments.length === 0 && level !== 0 && (
        <p
          style={{ paddingLeft: level ? `${level * 12 + 25}px` : undefined }}
          className="py-1 text-sm font-medium text-muted-foreground/80"
        >
          No pages inside
        </p>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        collisionDetection={closestCorners}
      >
        <SortableContext
          items={orderedDocuments.map((doc) => doc.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedDocuments.map((document) => (
            <SortableItem
              key={document.id}
              document={document}
              level={level}
              onExpand={onExpand}
              expanded={expanded[document.id]}
              onRedirect={onRedirect}
              activeId={params.documentId as string}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
