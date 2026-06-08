import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type EntryType = "receita" | "despesa";
export type FinCategory = "Aluguel" | "Cartão" | "INSS" | "Dízimo" | "Oferta" | "Transporte" | "Alimentação" | "Outro";

export interface FinancialEntry {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount: number;
  entry_type: EntryType;
  category: FinCategory;
  due_date: string | null;
  paid: boolean;
  paid_at: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
}

export type FinInsert = Pick<FinancialEntry, "title" | "amount" | "entry_type" | "category"> & {
  description?: string | null;
  due_date?: string | null;
  paid?: boolean;
};

export function useFinancial() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["financial"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_entries")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as FinancialEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (e: FinInsert) => {
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({ ...e, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial"] }),
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...e }: Partial<FinancialEntry> & { id: string }) => {
      const { data, error } = await supabase.from("financial_entries").update(e).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial"] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["financial"] }),
  });

  return { ...query, createEntry, updateEntry, deleteEntry };
}
