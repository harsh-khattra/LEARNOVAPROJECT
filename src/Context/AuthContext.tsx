import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SupabaseClient } from "../Helper/Supabase";
import {  profileconst } from "../SharedComponents/Constants/const";



interface User {
  id:string;
  name:string;
  email:string;
  phone:string;
  deptId:string;
  role:string;
  department:string;
}

interface Permissions{
  dashboard:boolean;
  management:boolean;
  leaveTable:boolean;
  applyLeave:boolean;
  approveLeave:boolean;
  discussion:boolean;
}

interface AuthContextType{
  user:User|null;
  permissions:Permissions;
  isAuth:boolean;
  loading:boolean;
  logout:()=>Promise<void>;
}

const defaultPermission:Permissions={
  dashboard:false,
  management:false,
  leaveTable:false,
  applyLeave:false,
  approveLeave:false,
  discussion:false,
};

const AuthContext = createContext<AuthContextType>({
  user:null,
  permissions:defaultPermission,
  isAuth:false,
  loading:true,
  logout:async()=>{},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // console.log("AuthProvider rendered");
  
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermission);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  
  
const isFetching = useRef(false);

 async function fetchProfileAndRole(userId: string) {
    if (isFetching.current) {
      return;
    }
    isFetching.current = true;
    
    try {
      const { data: profile, error } = await SupabaseClient
        .from(profileconst)
        .select(`*, roles(can_view_dashboard, can_view_management, can_view_leave_table, can_apply_leave, can_view_discussion,  can_approve_leave,emprole), departments!profiles_department_id_fkey(empDepartment)`)
        .eq("id", userId)
        .single();

      // console.log("profile result:", profile, "error:", error);

      if (error || !profile || !profile.roles) {
        setLoading(false);
        return;
      }

      // console.log("setting user and permissions...");

      const role = profile.roles;
      const dept = profile.departments;
      setUser({
        id: userId,
        name: profile.full_name,
        email: profile.Email,
        phone: profile.phone,
        deptId: profile.department_id,
        role: role.emprole,
        department: dept.empDepartment,
      });

      setPermissions({
        dashboard: role.can_view_dashboard,
        management: role.can_view_management,
        leaveTable: role.can_view_leave_table,
        applyLeave: role.can_apply_leave,
        approveLeave: role.can_approve_leave,
        discussion: role.can_view_discussion
      });

      setIsAuth(true);
    } catch (err) {
      // console.error("fetchProfileAndRole error:", err);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isFetching.current = false;
      }, 2000);
    }
  }

  async function logout() {
    isFetching.current = false; 
    await SupabaseClient.auth.signOut();
    setUser(null);
    setPermissions(defaultPermission);
    setIsAuth(false);
  }
useEffect(() => {
    // console.log("useEffect fired");

    const { data: listener } = SupabaseClient.auth.onAuthStateChange(
      (event, session) => {
        // console.log("event:", event);

      
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (session?.user) {
           
            Promise.resolve().then(() => {
              fetchProfileAndRole(session.user.id);
            });
          } else {
            setUser(null);
            setPermissions(defaultPermission);
            setIsAuth(false);
            setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setPermissions(defaultPermission);
          setIsAuth(false);
          setLoading(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, isAuth, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth=() => useContext(AuthContext);