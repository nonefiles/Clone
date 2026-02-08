import { KanbanBoard } from "@/components/KanbanBoard";

const BoardPage = () => {
  return ( 
    <div className="flex-1 h-full overflow-y-auto">
      <KanbanBoard />
    </div>
  );
}
 
export default BoardPage;
