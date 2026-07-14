import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../Helper/Supabase";
import toast from "react-hot-toast";

const LoginCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogin = async () => {
      const {
        data: { user },
      } = await SupabaseClient.auth.getUser();

      if (!user) {
        toast.error("Google login failed");
        navigate("/login");
        return;
      }

      // Check profile
      const { data: profile } = await SupabaseClient
        .from("profiles")
        .select("id, role_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        toast.error("Account not found. Please sign up first.");
        await SupabaseClient.auth.signOut();
        navigate("/signup");
        return;
      }

      toast.success("Login successful!");

      
const {
  data: { session },
} = await SupabaseClient.auth.getSession();

console.log("Session:", session);

navigate
      // Agar role-based navigation hai to yahan role ke hisaab se route choose kar sakte ho
      ("/learning/student/landingPage");
    };

    handleLogin();
  }, [navigate]);

  return <h2>Logging in...</h2>;
};

export default LoginCallback;