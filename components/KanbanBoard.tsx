"use client";

import { useState, useEffect } from "react";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/utils/supabase/client";
import { Doc } from "@/types";
import { useUser } from "@/hooks/use-user";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Spinner } from "@/components/spinner";

type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface KanbanCardProps {
  document: Doc;
}

const KanbanCard = ({ document }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
    >
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-2">
          {document.icon && <span>{document.icon}</span>}
          <span className="font-medium truncate">{document.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">
            {new Date(document.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

interface KanbanColumnProps {
  id: Status;
  title: string;
  documents: Doc[];
}

const KanbanColumn = ({ id, title, documents }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col w-full min-w-[300px] bg-secondary/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <Badge variant="secondary">{documents.length}</Badge>
      </div>
      <SortableContext
        items={documents.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 min-h-[150px]">
          {documents.map((doc) => (
            <KanbanCard key={doc.id} document={doc} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export const KanbanBoard = () => {
  const { user } = useUser();
  const supabase = createClient();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    if (data) {
      setDocuments(data as Doc[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeDoc = documents.find((d) => d.id === active.id);
    const overId = over.id as string;

    // Determine target status based on where it was dropped
    // In a real kanban, 'over.id' might be a column ID or another card ID
    // For simplicity, we'll check if over.id is one of our statuses
    const targetStatus = ["TODO", "IN_PROGRESS", "DONE"].includes(overId) 
      ? overId as Status 
      : documents.find(d => d.id === overId)?.status || "TODO";

    if (activeDoc && activeDoc.status !== targetStatus) {
      // Update local state
      setDocuments(prev => prev.map(d => 
        d.id === active.id ? { ...d, status: targetStatus } : d
      ));

      // Update Supabase
      await supabase
        .from("documents")
        .update({ status: targetStatus })
        .eq("id", active.id);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const columns: { id: Status; title: string }[] = [
    { id: "TODO", title: "To Do" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "DONE", title: "Done" },
  ];

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-x-6 h-full min-w-max">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              documents={documents.filter((d) => (d.status || "TODO") === col.id)}
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
};
