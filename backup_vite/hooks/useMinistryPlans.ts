import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface MinistryPlan {
  id: string;
  user_id: string;
  plan_type: string;
  week_start: string | null;
  month: string | null;
  title: string;
  focus: string;
  commitments: string;
  visits_discipleship: string;
  preaching_studies: string;
  prayer_devotional: string;
  family_rest: string;
  next_steps: string;
  observations: string;
  goals: string;
  priorities: string;
  reflection: string;
  created_at: string;
  updated_at: string;
}

type PlanFields = Omit<MinistryPlan, "id" | "user_id" | "created_at" | "updated_at">;

export function useMinistryPlans(planType?: string) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const key = ["ministry_plans", planType ?? "all"];

  const query = useQuery({
    queryKey: key,
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from("ministry_plans").select("*");
      if (planType) q = q.eq("plan_type", planType);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as MinistryPlan[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: PlanFields) => {
      const { data, error } = await supabase
        .from("ministry_plans")
        .insert({ ...item, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministry_plans"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: { id: string } & Partial<PlanFields>) => {
      const { data, error } = await supabase
        .from("ministry_plans")
        .update(item)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministry_plans"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ministry_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ministry_plans"] }),
  });

  return { ...query, create, update, remove };
}
