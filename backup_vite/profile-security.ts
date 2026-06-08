import { supabase } from "@/integrations/supabase/client";

export type SafeProfileUpdateInput = {
  full_name: string;
  phone: string;
  pastoral_title: string;
  church_name: string;
  district: string;
  region: string;
};

export async function updateMyProfile(input: SafeProfileUpdateInput) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      phone: input.phone || null,
      pastoral_title: input.pastoral_title,
      church_name: input.church_name || null,
      district: input.district || null,
      region: input.region || null,
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function setMyAvatarPath(avatarPath: string | null) {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Authentication required");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarPath })
    .eq("id", userId);

  if (error) throw error;
}

