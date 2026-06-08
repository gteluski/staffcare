import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  pastoral_title: string | null;
  phone: string | null;
  church_name: string | null;
  district: string | null;
  region: string | null;
  avatar_url: string | null;
};

type ProfileSettings = {
  must_change_password: boolean;
  onboarding_completed: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  profileSettings: ProfileSettings | null;
  roles: string[];
  loading: boolean;
  mustChangePassword: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  clearMustChangePassword: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  profileSettings: null,
  roles: [],
  loading: true,
  mustChangePassword: false,
  isAdmin: false,
  signOut: async () => {},
  clearMustChangePassword: () => {},
  refreshProfile: async () => {},
});

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, pastoral_title, phone, church_name, district, region, avatar_url")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

async function fetchProfileSettings(userId: string) {
  const { data } = await supabase
    .from("profile_settings")
    .select("must_change_password, onboarding_completed")
    .eq("id", userId)
    .single();
  return data as ProfileSettings | null;
}

async function fetchRoles(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileSettings, setProfileSettings] = useState<ProfileSettings | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    const [p, s, r] = await Promise.all([
      fetchProfile(userId),
      fetchProfileSettings(userId),
      fetchRoles(userId),
    ]);
    setProfile(p);
    setProfileSettings(s);
    setRoles(r);
  };

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Fire-and-forget: never await inside onAuthStateChange to avoid deadlocks
          loadUserData(session.user.id).then(() => {
            if (!initialSessionHandled) {
              initialSessionHandled = true;
              setLoading(false);
            }
          });
        } else {
          setProfile(null);
          setProfileSettings(null);
          setRoles([]);
          if (!initialSessionHandled) {
            initialSessionHandled = true;
            setLoading(false);
          }
        }
      }
    );

    // Fallback: if onAuthStateChange doesn't fire within 3s, force loading to false
    const timeout = setTimeout(() => {
      if (!initialSessionHandled) {
        initialSessionHandled = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileSettings(null);
    setRoles([]);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const [p, s] = await Promise.all([
        fetchProfile(session.user.id),
        fetchProfileSettings(session.user.id),
      ]);
      setProfile(p);
      setProfileSettings(s);
    }
  };

  const clearMustChangePassword = () => {
    setProfileSettings((prev) => prev ? { ...prev, must_change_password: false } : prev);
  };

  const mustChangePassword = profileSettings?.must_change_password ?? false;
  const isAdmin = roles.includes("admin");

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      profileSettings,
      roles,
      loading,
      mustChangePassword,
      isAdmin,
      signOut,
      clearMustChangePassword,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
