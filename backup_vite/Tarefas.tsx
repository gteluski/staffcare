import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTasks, type Task, type TaskStatus } from "@/hooks/useTasks";
import { useNotes } from "@/hooks/useNotes";
import { TaskListView } from "@/components/tarefas/TaskListView";
import { KanbanView } from "@/components/tarefas/KanbanView";
import { NotesView } from "@/components/tarefas/NotesView";
import { TaskDialog } from "@/components/tarefas/TaskDialog";

export default function Tarefas() {
  const { data: tasks = [], isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { data: notes = [], isLoading: notesLoading, createNote, updateNote, deleteNote } = useNotes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("a_fazer");
  const [tab, setTab] = useState("lista");

  const openNew = (status?: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status || "a_fazer");
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setDialogOpen(true);
  };

  const toggleComplete = (t: Task) => {
    updateTask.mutate({
      id: t.id,
      status: t.status === "concluido" ? "a_fazer" : "concluido",
    });
  };

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Tarefas</h1>
        {tab !== "notas" && (
          <Button size="sm" onClick={() => openNew()}>
            <Plus className="h-4 w-4 mr-1" /> Nova tarefa
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Quadro</TabsTrigger>
          <TabsTrigger value="notas">Anotações</TabsTrigger>
        </TabsList>

        <TabsContent value="lista">
          <TaskListView tasks={tasks} isLoading={isLoading} onTaskClick={openEdit} onToggleComplete={toggleComplete} />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanView tasks={tasks} onTaskClick={openEdit} onNewInColumn={openNew} />
        </TabsContent>

        <TabsContent value="notas">
          <NotesView
            notes={notes}
            isLoading={notesLoading}
            onCreate={(n) => createNote.mutateAsync(n)}
            onUpdate={(n) => updateNote.mutateAsync(n)}
            onDelete={(id) => deleteNote.mutateAsync(id)}
          />
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultStatus={defaultStatus}
        onCreate={(t) => createTask.mutateAsync(t)}
        onUpdate={(t) => updateTask.mutateAsync(t)}
        onDelete={(id) => deleteTask.mutateAsync(id)}
      />
    </div>
  );
}
