import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type TaskCategory = "Pastoral" | "Administrativa" | "Pessoal" | "Estudo" | "Financeira" | "Outra";
export type TaskPriority = "alta" | "média" | "baixa";
export type TaskStatus = "a_fazer" | "em_andamento" | "concluido";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Pick<Task, "title" | "category" | "priority" | "status"> & {
  description?: string | null;
  due_date?: string | null;
  event_id?: string | null;
};

export function useTasks() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (t: TaskInsert) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...t, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...t }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from("tasks").update(t).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  return { ...query, createTask, updateTask, deleteTask };
}
