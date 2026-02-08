"use client";

import { useState, useEffect } from "react";
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
  const { documents, isLoading } = useDocuments(parentDocumentId);
  const [orderedDocuments, setOrderedDocuments] = useState<Document[]>([]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
        // Supabase reorder implementation can be added here if needed
        // For now, we just update the local state
      }
    }
  };

  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`);
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
    <div className="w-full">
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
              activeId={params.documentId}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
