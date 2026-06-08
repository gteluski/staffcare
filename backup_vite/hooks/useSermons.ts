import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SermonStatus = "rascunho" | "preparado" | "pregado";
export type LocationType = "local" | "externa";

export interface Sermon {
  id: string;
  user_id: string;
  title: string;
  bible_text: string | null;
  main_points: string | null;
  speech_highlights: string | null;
  notes: string | null;
  sermon_date: string | null;
  location_type: LocationType;
  church_name: string | null;
  series_name: string | null;
  status: SermonStatus;
  created_at: string;
  updated_at: string;
}

export type SermonInsert = Pick<Sermon, "title"> & Partial<Omit<Sermon, "id" | "user_id" | "created_at" | "updated_at">>;

export function useSermons() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sermons"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .order("sermon_date", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as Sermon[];
    },
  });

  const createSermon = useMutation({
    mutationFn: async (s: SermonInsert) => {
      const { data, error } = await supabase
        .from("sermons")
        .insert({ ...s, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Sermon;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sermons"] }),
  });

  const updateSermon = useMutation({
    mutationFn: async ({ id, ...s }: Partial<Sermon> & { id: string }) => {
      const { data, error } = await supabase.from("sermons").update(s).eq("id", id).select().single();
      if (error) throw error;
      return data as Sermon;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sermons"] }),
  });

  const deleteSermon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sermons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sermons"] }),
  });

  return { ...query, createSermon, updateSermon, deleteSermon };
}
