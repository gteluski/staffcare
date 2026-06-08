import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EventCategory, CalendarContext } from "@/lib/event-categories";

export interface AppEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  category: EventCategory;
  calendar_context: CalendarContext;
  created_at: string;
  updated_at: string;
}

export type EventInsert = Omit<AppEvent, "id" | "user_id" | "created_at" | "updated_at">;

export function useEvents(rangeStart?: Date, rangeEnd?: Date) {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["events", rangeStart?.toISOString(), rangeEnd?.toISOString()],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("start_time", { ascending: true });
      if (rangeStart) q = q.gte("start_time", rangeStart.toISOString());
      if (rangeEnd) q = q.lte("start_time", rangeEnd.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return data as AppEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (evt: EventInsert) => {
      const { data, error } = await supabase
        .from("events")
        .insert({ ...evt, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...evt }: Partial<AppEvent> & { id: string }) => {
      const { data, error } = await supabase.from("events").update(evt).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  return { ...query, createEvent, updateEvent, deleteEvent };
}
