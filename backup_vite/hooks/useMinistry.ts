import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MinistryHistory {
  id: string;
  user_id: string;
  start_year: number;
  end_year: number | null;
  is_current: boolean;
  church_name: string;
  city: string;
  ministry_function: string;
  notes: string;
  reflections: string;
  plans: string;
  created_at: string;
  updated_at: string;
}

export interface MissionaryTrip {
  id: string;
  user_id: string;
  title: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  church_community: string;
  description: string;
  results: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SpiritualExperience {
  id: string;
  user_id: string;
  title: string;
  experience_date: string | null;
  experience_text: string;
  words_from_god: string;
  prayer_notes: string;
  created_at: string;
  updated_at: string;
}

export function useMinistryHistory() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["ministry_history"];

  const query = useQuery({
    queryKey: key,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministry_history")
        .select("*")
        .order("start_year", { ascending: false });
      if (error) throw error;
      return data as MinistryHistory[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Omit<MinistryHistory, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("ministry_history")
        .insert({ ...item, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<Omit<MinistryHistory, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase.from("ministry_history").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ministry_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, create, update, remove };
}

export function useMissionaryTrips() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["missionary_trips"];

  const query = useQuery({
    queryKey: key,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missionary_trips")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as MissionaryTrip[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Omit<MissionaryTrip, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("missionary_trips")
        .insert({ ...item, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<Omit<MissionaryTrip, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase.from("missionary_trips").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missionary_trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, create, update, remove };
}

export function useSpiritualExperiences() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["spiritual_experiences"];

  const query = useQuery({
    queryKey: key,
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spiritual_experiences")
        .select("*")
        .order("experience_date", { ascending: false });
      if (error) throw error;
      return data as SpiritualExperience[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Omit<SpiritualExperience, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("spiritual_experiences")
        .insert({ ...item, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<Omit<SpiritualExperience, "id" | "user_id" | "created_at" | "updated_at">>) => {
      const { data, error } = await supabase.from("spiritual_experiences").update(item).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spiritual_experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, create, update, remove };
}
