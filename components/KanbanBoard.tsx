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
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanColumn as KanbanColumnType, Document } from "@/types";
import { useKanbanStore } from "@/stores/kanbanStore";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Spinner } from "@/components/spinner";
import { Button } from "./ui/button";
import { Plus, Trash2, Edit2, GripVertical, MoreVertical } from "lucide-react";
import { Input } from "./ui/input";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";

// --- KanbanCard Component ---
interface KanbanCardProps {
  document: Document;
}

const KanbanCard = ({ document }: KanbanCardProps) => {
  const { updateDocument, deleteDocument } = useKanbanStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description || "");
  const [category, setCategory] = useState(document.category || "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: document.id,
    data: {
      type: "Document",
      document,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleUpdate = async () => {
    const updates: any = {};
    if (title.trim() && title !== document.title) updates.title = title;
    if (description !== (document.description || "")) updates.description = description;
    if (category !== (document.category || "")) updates.category = category;

    console.log("Updating document with:", updates);

    if (Object.keys(updates).length > 0) {
      try {
        await updateDocument(document.id, updates);
        console.log("Update successful");
      } catch (err) {
        console.error("Update failed:", err);
      }
    }
    setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(document.id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 mb-2 cursor-grab active:cursor-grabbing hover:border-primary transition-colors bg-background group relative overflow-hidden"
    >
      {/* Kategori Badge - Her zaman görünür (Eğer varsa veya düzenleme modundaysa) */}
      {!isEditing && (
        <div className="mb-2 min-h-[20px] flex items-center justify-between">
          {document.category ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase tracking-wider font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              {document.category}
            </Badge>
          ) : (
            <div className="h-4" />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2 flex-1" {...attributes} {...listeners}>
            {document.icon && <span>{document.icon}</span>}
            {isEditing ? (
              <div className="flex flex-col gap-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Design, Urgent..."
                  className="h-6 text-[10px] bg-secondary/50 p-1 uppercase font-bold"
                />
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                  autoFocus
                  className="h-7 text-sm font-semibold bg-background p-1"
                />
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a detailed description..."
                  className="w-full text-xs bg-secondary/30 p-2 rounded-md min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex items-center gap-x-2 mt-1">
                  <Button size="sm" className="h-7 px-3 text-[10px] font-bold" onClick={handleUpdate}>SAVE CHANGES</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-3 text-[10px]" onClick={() => setIsEditing(false)}>CANCEL</Button>
                </div>
              </div>
            ) : (
              <span className="font-semibold text-sm leading-none">{document.title}</span>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Açıklama/Alt Metin - Her zaman görünür (Eğer varsa ve düzenleme modunda değilse) */}
        {!isEditing && (
          <div className="mt-1">
            {document.description ? (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-snug italic">
                {document.description}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground/40 italic">No description added...</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-secondary/50 mt-2">
          <Badge variant="outline" className="text-[10px] text-muted-foreground/70 border-none p-0 font-normal">
            Created: {new Date(document.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Badge>
        </div>
      </div>
    </Card>
  );
};

// --- KanbanColumn Component ---
interface KanbanColumnProps {
  column: KanbanColumnType;
  documents: Document[];
}

const KanbanColumn = ({ column, documents }: KanbanColumnProps) => {
  const { deleteColumn, updateColumn, createDocument } = useKanbanStore();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleSubmit = async () => {
    if (title !== column.title) {
      await updateColumn(column.id, { title });
    }
    setIsEditing(false);
  };

  const handleAddDocument = async () => {
    if (newDocTitle.trim()) {
      await createDocument(newDocTitle, column.id);
      setNewDocTitle("");
      setIsAddingDoc(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-[300px] bg-secondary/30 rounded-xl p-4 min-h-[500px] h-full"
    >
      <div className="flex items-center justify-between mb-4 group/header">
        <div className="flex items-center gap-x-2 flex-1" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="h-7 text-sm font-bold bg-background"
            />
          ) : (
            <h3 
              onClick={() => setIsEditing(true)}
              className="font-bold text-sm uppercase tracking-wider text-muted-foreground cursor-text truncate"
            >
              {column.title}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-x-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <Badge variant="secondary" className="mr-1">{documents.length}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => deleteColumn(column.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <SortableContext
        items={documents.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 overflow-y-auto pr-1">
          {documents.map((doc) => (
            <KanbanCard key={doc.id} document={doc} />
          ))}
          {isAddingDoc && (
            <Card className="p-3 mb-2 bg-background">
              <Input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onBlur={() => {
                  if (!newDocTitle.trim()) setIsAddingDoc(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddDocument();
                  if (e.key === "Escape") setIsAddingDoc(false);
                }}
                autoFocus
                placeholder="Enter document title..."
                className="h-7 text-sm"
              />
            </Card>
          )}
          {documents.length === 0 && !isAddingDoc && (
            <div className="h-20 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
              No documents
            </div>
          )}
        </div>
      </SortableContext>
      
      {!isAddingDoc ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-muted-foreground hover:text-primary"
          onClick={() => setIsAddingDoc(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add document
        </Button>
      ) : (
        <div className="flex items-center gap-x-2 mt-2">
          <Button size="sm" onClick={handleAddDocument}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingDoc(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
};

// --- Main KanbanBoard Component ---
export const KanbanBoard = () => {
  const { user } = useUser();
  const { 
    columns, 
    documents,
    fetchColumns, 
    addColumn, 
    moveColumn, 
    updateDocumentStatus,
    setDocuments,
    isLoading,
    error 
  } = useKanbanStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"Column" | "Document" | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchColumns();
    const fetchDocs = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false);
      if (data) setDocuments(data as Document[]);
    };
    fetchDocs();
  }, [user, fetchColumns, setDocuments, supabase]);

  // Kanban Columns Realtime Subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("kanban-columns-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_columns",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchColumns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchColumns, supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveType(active.data.current?.type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveADocument = active.data.current?.type === "Document";
    const isOverADocument = over.data.current?.type === "Document";

    if (!isActiveADocument) return;

    // Sürüklenen bir doküman ise ve bir dokümanın üzerine gelindiyse
    if (isActiveADocument && isOverADocument) {
      setDocuments((prev) => {
        const activeIndex = prev.findIndex((d) => d.id === activeId);
        const overIndex = prev.findIndex((d) => d.id === overId);
        
        if (prev[activeIndex].status !== prev[overIndex].status) {
          prev[activeIndex].status = prev[overIndex].status;
          return arrayMove(prev, activeIndex, overIndex - 1);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Sürüklenen bir doküman ise ve bir kolonun üzerine gelindiyse
    const isOverAColumn = over.data.current?.type === "Column";
    if (isActiveADocument && isOverAColumn) {
      setDocuments((prev) => {
        const activeIndex = prev.findIndex((d) => d.id === activeId);
        prev[activeIndex].status = overId as string;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (active.data.current?.type === "Column") {
      if (activeId !== overId) {
        const oldIndex = columns.findIndex((c) => c.id === activeId);
        const newIndex = columns.findIndex((c) => c.id === overId);
        await moveColumn(activeId, newIndex);
      }
    } else if (active.data.current?.type === "Document") {
      const activeDoc = documents.find((d) => d.id === activeId);
      if (activeDoc) {
        await updateDocumentStatus(activeId, activeDoc.status);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-background/50">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex gap-x-6 h-full items-start overflow-x-auto pb-4 hide-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                documents={documents.filter((d) => d.status === col.id)}
              />
            ))}
          </SortableContext>
          
          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "0.5",
                },
              },
            }),
          }}>
            {activeId ? (
              activeType === "Column" ? (
                <div className="opacity-80 scale-105 transition-transform">
                  <KanbanColumn 
                    column={columns.find(c => c.id === activeId)!} 
                    documents={documents.filter(d => d.status === activeId)} 
                  />
                </div>
              ) : (
                <div className="opacity-80 scale-105 transition-transform w-[280px]">
                  <KanbanCard document={documents.find(d => d.id === activeId)!} />
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>

        <Button
          onClick={() => addColumn("New Column")}
          variant="outline"
          className="min-w-[300px] h-14 border-dashed border-2 bg-background/50 hover:bg-secondary/50 hover:border-primary transition-all flex items-center justify-center gap-x-2 text-muted-foreground rounded-xl shrink-0"
        >
          <Plus className="h-5 w-5" />
          Add another column
        </Button>
      </div>
    </div>
  );
};
