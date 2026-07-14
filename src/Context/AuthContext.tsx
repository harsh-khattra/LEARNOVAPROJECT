import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SupabaseClient } from "../Helper/Supabase";
import { profileconst } from "../SharedComponents/Constants/const";



interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  deptId: string;
  role: string;
  department: string;
}

interface Permissions {
  // HRMS
  dashboard: boolean;
  management: boolean;
  leaveTable: boolean;
  applyLeave: boolean;
  approveLeave: boolean;
  discussion: boolean;

  // LMS
  lmsDashboard: boolean;
  viewCourses: boolean;
  uploadCourses: boolean;
  editCourses: boolean;
  deleteCourses: boolean;
  publishCourses: boolean;

  viewEnrollments: boolean;

  viewAssignments: boolean;
  manageAssignments: boolean;

  viewQuiz: boolean;
  manageQuiz: boolean;

  viewCertificates: boolean;
  generateCertificates: boolean;

  viewForum: boolean;
  manageForum: boolean;

  viewCompletion: boolean;
  viewTimespent: boolean;

  adminPanel: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: Permissions;
  isAuth: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const defaultPermission: Permissions = {
  // HRMS
  dashboard: false,
  management: false,
  leaveTable: false,
  applyLeave: false,
  approveLeave: false,
  discussion: false,

  // LMS
  lmsDashboard: false,
  viewCourses: false,
  uploadCourses: false,
  editCourses: false,
  deleteCourses: false,
  publishCourses: false,

  viewEnrollments: false,

  viewAssignments: false,
  manageAssignments: false,

  viewQuiz: false,
  manageQuiz: false,

  viewCertificates: false,
  generateCertificates: false,

  viewForum: false,
  manageForum: false,

  viewCompletion: false,
  viewTimespent: false,

  adminPanel: false,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: defaultPermission,
  isAuth: false,
  loading: true,
  logout: async () => { },
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
        .select(`
*,
roles(
  emprole,
lms_role,
    can_view_dashboard,
    can_view_management,
    can_view_leave_table,
    can_apply_leave,
    can_approve_leave,
    can_view_discussion,

    can_view_lms_dashboard,
    can_view_courses,
    can_upload_courses,
    can_edit_courses,
    can_delete_courses,
    can_publish_courses,

    can_view_enrollments,

    can_view_assignments,
    can_manage_assignments,

    can_view_quiz,
    can_manage_quiz,

    can_view_certificates,
    can_generate_certificates,

    can_view_forum,
    can_manage_forum,

    can_view_completion,
    can_view_timespent,

    can_access_admin_panel 
),
departments!profiles_department_id_fkey(empDepartment)
`)
        .eq("id", userId)
        .single();

      // console.log("profile result:", profile, "error:", error);
            console.log("User ID:", userId);
console.log("Profile:", profile);
console.log("Error:", error);


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
        email: profile.email,
        phone: profile.phone,
        deptId: profile.department_id,
        role: role.lms_role,
       department: dept?.empDepartment ?? "",
      });

      console.log(role);
      setPermissions({
  // HRMS
  dashboard: role.can_view_dashboard,
  management: role.can_view_management,
  leaveTable: role.can_view_leave_table,
  applyLeave: role.can_apply_leave,
  approveLeave: role.can_approve_leave,
  discussion: role.can_view_discussion,

  // LMS
  lmsDashboard: role.can_view_lms_dashboard,
  viewCourses: role.can_view_courses,
  uploadCourses: role.can_upload_courses,
  editCourses: role.can_edit_courses,
  deleteCourses: role.can_delete_courses,
  publishCourses: role.can_publish_courses,

  viewEnrollments: role.can_view_enrollments,

  viewAssignments: role.can_view_assignments,
  manageAssignments: role.can_manage_assignments,

  viewQuiz: role.can_view_quiz,
  manageQuiz: role.can_manage_quiz,

  viewCertificates: role.can_view_certificates,
  generateCertificates: role.can_generate_certificates,

  viewForum: role.can_view_forum,
  manageForum: role.can_manage_forum,

  viewCompletion: role.can_view_completion,
  viewTimespent: role.can_view_timespent,

  adminPanel: role.can_access_admin_panel,
});
console.log("Role:", role.lms_role);
console.log("Permissions:", {
  lmsDashboard: role.can_view_lms_dashboard,
  viewCourses: role.can_view_courses,
  uploadCourses: role.can_upload_courses,
  adminPanel: role.can_access_admin_panel,
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
console.log("AuthContext Mounted");
    const { data: listener } = SupabaseClient.auth.onAuthStateChange(
      (event, session) => {
        // console.log("event:", event);
 console.log("EVENT:", event);
      console.log("SESSION:", session);


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

export const useAuth = () => useContext(AuthContext);