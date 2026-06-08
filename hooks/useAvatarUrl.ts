'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Resolves an avatar_url (which may be a storage path or a legacy public URL)
 * into a displayable signed URL.
 */
export function useAvatarUrl(avatarPath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!avatarPath) {
      setUrl(null);
      return;
    }

    // Legacy: if it's already a full URL, use it directly
    if (avatarPath.startsWith("http")) {
      setUrl(avatarPath);
      return;
    }

    // Generate a signed URL for the storage path
    let cancelled = false;
    supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 60 * 60)
      .then(({ data, error }) => {
        if (!cancelled && data?.signedUrl) {
          setUrl(data.signedUrl);
        } else if (!cancelled) {
          setUrl(null);
        }
      });

    return () => { cancelled = true; };
  }, [avatarPath]);

  return url;
}
