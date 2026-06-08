import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type DocType = "Sermão" | "Estudo" | "Nota" | "Documento" | "Outro";

export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  doc_type: DocType;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const { session } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["documents"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
  });

  const createDocument = useMutation({
    mutationFn: async (doc: { title: string; content?: string; doc_type?: DocType }) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...doc, user_id: session!.user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...doc }: Partial<Document> & { id: string }) => {
      const { data, error } = await supabase.from("documents").update(doc).eq("id", id).select().single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  return { ...query, createDocument, updateDocument, deleteDocument };
}
