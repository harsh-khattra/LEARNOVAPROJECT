import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { SupabaseClient } from "../Helper/Supabase";
// import { supabase } from "./Supa"; // tumhara existing supabase client import path

// ---------- Types (teeno tables ke structure ke hisaab se) ----------

// roles table
type RoleName = "student" | "teacher" | "admin";

// permissions table
type Permission =
  | "view_course"
  | "create_course"
  | "edit_course"
  | "delete_course"
  | "manage_users";

// profiles table
interface Profile {
  id: string; // uuid
  full_name: string;
  email: string;
  phone: string;
  role_id: number;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: RoleName | null;
  permissions: Permission[];
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: any }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<RoleName | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // profile + role + permissions fetch karne ka common function
  // (login ke time bhi chalega, aur page refresh pe bhi)
  const loadProfileAndPermissions = async (userId: string) => {
    try {
      // 1. profiles table se role_id nikaalo
      const { data: profileData, error: profileError } = await SupabaseClient
        .from("profiles123") // tumhare schema mein actual table name yahi use karo
        .select()
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        console.error("Profile fetch error:", profileError);
        setProfile(null);
        setRole(null);
        setPermissions([]);
        return;
      }

      setProfile(profileData as Profile);

      // 2. roles table se role_name nikaalo
      const { data: roleData, error: roleError } = await SupabaseClient
        .from("roles")
        .select("role_name")
        .eq("id", profileData.role_id)
        .single();

      if (roleError || !roleData) {
        console.error("Role fetch error:", roleError);
        setRole(null);
      } else {
        setRole(roleData.role_name as RoleName);
      }

      // 3. permissions table se is role_id ke saare permissions nikaalo
      const { data: permsData, error: permsError } = await SupabaseClient
        .from("permissions")
        .select("permission")
        .eq("role_id", profileData.role_id);

      if (permsError || !permsData) {
        console.error("Permissions fetch error:", permsError);
        setPermissions([]);
      } else {
        setPermissions(permsData.map((p) => p.permission as Permission));
      }
    } catch (err) {
      console.error("Unexpected error loading profile/permissions:", err);
      setProfile(null);
      setRole(null);
      setPermissions([]);
    }
  };

  useEffect(() => {
    // App load hote hi current session check karo
    // (yeh refresh ke baad role/permissions wapas load karne ke liye zaroori hai)
    const initSession = async () => {
      const { data: { session } } = await SupabaseClient.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfileAndPermissions(session.user.id);
      }
      setLoading(false);
    };

    initSession();

    // Login / logout / token refresh par auto react karo
    const { data: listener } = SupabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          await loadProfileAndPermissions(session.user.id);
          setLoading(false);
        } else {
          // logout case
          setProfile(null);
          setRole(null);
          setPermissions([]);
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (permission: Permission) => {
    return permissions.includes(permission);
  };

  const signOut = async () => {
    await SupabaseClient.auth.signOut();
    // listener khud user/profile/role/permissions clear kar dega
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        permissions,
        loading,
        hasPermission,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook - components mein easily use karne ke liye
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};