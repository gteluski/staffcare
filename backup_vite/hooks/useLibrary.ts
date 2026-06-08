import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface LibraryFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryFile {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export function useLibrary(folderId: string | null) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const userId = session?.user.id;

  const foldersQuery = useQuery({
    queryKey: ["library-folders", folderId],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from("library_folders").select("*").order("name");
      q = folderId ? q.eq("parent_id", folderId) : q.is("parent_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return data as LibraryFolder[];
    },
  });

  const filesQuery = useQuery({
    queryKey: ["library-files", folderId],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from("library_files").select("*").order("name");
      q = folderId ? q.eq("folder_id", folderId) : q.is("folder_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return data as LibraryFile[];
    },
  });

  // Storage usage query
  const storageUsageQuery = useQuery({
    queryKey: ["storage-usage", userId],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_storage_usage", {
        _user_id: userId!,
      });
      if (error) throw error;
      return (data as number) || 0;
    },
  });

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("library_folders")
        .insert({ name, parent_id: folderId, user_id: userId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-folders"] }),
  });

  const renameFolder = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("library_folders").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-folders"] }),
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-folders"] }),
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      // Check quota before upload
      const currentUsage = storageUsageQuery.data || 0;
      const quotaMb = 5120; // 5 GB
      const quotaBytes = quotaMb * 1024 * 1024;
      if (currentUsage + file.size > quotaBytes) {
        throw new Error("QUOTA_EXCEEDED");
      }

      const path = `${userId!}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("biblioteca").upload(path, file);
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("library_files")
        .insert({
          name: file.name,
          folder_id: folderId,
          user_id: userId!,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-files"] });
      qc.invalidateQueries({ queryKey: ["storage-usage"] });
    },
  });

  const renameFile = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("library_files").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library-files"] }),
  });

  const replaceFile = useMutation({
    mutationFn: async ({ existing, newFile }: { existing: LibraryFile; newFile: File }) => {
      // Check quota (subtract old file size, add new)
      const currentUsage = storageUsageQuery.data || 0;
      const quotaBytes = 5120 * 1024 * 1024;
      const netChange = newFile.size - existing.file_size;
      if (currentUsage + netChange > quotaBytes) {
        throw new Error("QUOTA_EXCEEDED");
      }

      // Remove old file from storage
      await supabase.storage.from("biblioteca").remove([existing.file_path]);
      // Upload new
      const newPath = `${userId!}/${crypto.randomUUID()}-${newFile.name}`;
      const { error: upErr } = await supabase.storage.from("biblioteca").upload(newPath, newFile);
      if (upErr) throw upErr;
      // Update record
      const { error } = await supabase.from("library_files").update({
        name: newFile.name,
        file_path: newPath,
        file_size: newFile.size,
        mime_type: newFile.type || "application/octet-stream",
      }).eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-files"] });
      qc.invalidateQueries({ queryKey: ["storage-usage"] });
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (f: LibraryFile) => {
      await supabase.storage.from("biblioteca").remove([f.file_path]);
      const { error } = await supabase.from("library_files").delete().eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-files"] });
      qc.invalidateQueries({ queryKey: ["storage-usage"] });
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage.from("biblioteca").createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  return {
    folders: foldersQuery.data || [],
    files: filesQuery.data || [],
    isLoading: foldersQuery.isLoading || filesQuery.isLoading,
    storageUsedBytes: storageUsageQuery.data || 0,
    storageQuotaMb: 5120,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadFile,
    renameFile,
    replaceFile,
    deleteFile,
    getDownloadUrl,
  };
}
