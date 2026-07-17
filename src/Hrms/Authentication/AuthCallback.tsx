import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../Helper/Supabase";
import toast from "react-hot-toast";
import styles from "./AuthCallback.module.css";

const AuthCallback = () => {
  const [showRolePopup, setShowRolePopup] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [googleUser, setGoogleUser] = useState<any>(null);
  const navigate = useNavigate();



  const saveProfile = async () => {
  if (!selectedRole) {
    toast.error("Please select a role");
    return;
    console.log("Selected Role:", selectedRole);
  }

  // Get role id
   console.log("Selected Role:", selectedRole);
  const { data: roleData, error: roleError } = await SupabaseClient
    .from("roles")
    .select("id")
    .eq("emprole", selectedRole)
    .single();

   
    console.log("Role Data:", roleData);
console.log("Role Error:", roleError);

  if (roleError || !roleData) {
    toast.error("Role not found");
    return;
  }

  // Insert profile
  const { error } = await SupabaseClient
    .from("profiles")
    .upsert({
         role_id: roleData.id,
          
      id: googleUser.id,
      full_name:
        googleUser.user_metadata.full_name ||
        googleUser.user_metadata.name ||
        "",
      email: googleUser.email,
      avatar_url: googleUser.user_metadata.avatar_url,
      role_id: roleData.id,
    });

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success("Signup Successful");
  navigate("/learning/student/landingPage");
};
  useEffect(() => {

    
    const handleLogin = async () => {
      const {
        data: { user },
      } = await SupabaseClient.auth.getUser();

      


   if (!user) {
  toast.error("Google login failed");
  navigate("/signup");
  return;
}

console.log("Google User ID:", user.id);
console.log("Google Email:", user.email);

// Check if profile already exists
const { data: existingProfile } = await SupabaseClient
  .from("profiles")
  .select("id, email")
  .eq("id", user.id)
  .maybeSingle();

console.log("Existing Profile:", existingProfile);

// If profile exists, don't allow signup again
if (existingProfile) {
  toast.error("Account already exists. Please login.");
  navigate("/login");
  return;
}

// New user → show role popup
setGoogleUser(user);
setShowRolePopup(true);
    };

    handleLogin();
  }, [navigate]);

  return (
    <>
      <h2>Signing in...</h2>

      {showRolePopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h2>Complete Signup</h2>
            <p>
              <strong>Email:</strong> {googleUser?.email}
            </p>

            <h3>Select Role</h3>

            <label className={styles.roleOption}>
              <input
                type="radio"
                name="role"
                value="Student"
                checked={selectedRole === "Student"}
                onChange={(e) => setSelectedRole(e.target.value)}
              />
              Student
            </label>

            <label className={styles.roleOption}>
              <input
                type="radio"
                name="role"
                value="Teacher"
                checked={selectedRole === "Teacher"}
                onChange={(e) => setSelectedRole(e.target.value)}
              />
              Teacher
            </label>

         <button
  className={styles.continueBtn}
  onClick={saveProfile}
>
  Continue
</button>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthCallback;