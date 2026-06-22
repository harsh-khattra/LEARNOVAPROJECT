import { useFormik } from "formik";
import * as Yup from "yup";
import styles from "./Signup.module.css";
import { SupabaseClient } from "../../Helper/Supabase";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useRef, useState } from "react";
import PageLoader from "../UI/PageLoader";

type FormValues = {
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  department: string;
  photo: File | null;
};

const SignUp = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const formik = useFormik<FormValues>({
    initialValues: {
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      role: "",
      department: "",
      photo: null,
    },

    validationSchema: Yup.object({
      name: Yup.string()
        .min(3, "Name must be at least 3 characters")
        .required("Name is required"),
      phoneNumber: Yup.string()
        .required("Phone number is required")
        .matches(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
      email: Yup.string()
        .email("Invalid email format (example: test@gmail.com)")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Password is required"),
      role: Yup.string().required("Role is required"),
      department: Yup.string().required("Department is required"),
    }),

    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { data, error } = await SupabaseClient.auth.signUp({
          email: values.email,
          password: values.password,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        const userId = data?.user?.id;
        if (!userId) {
          toast.error("Signup failed, try again.");
          return;
        }

        // Upload profile photo if provided
        let imageUrl: string | null = null;

        if (values.photo) {
          const fileExt = values.photo.name.split(".").pop();
          const fileName = `${userId}.${fileExt}`;

          const { error: uploadError } = await SupabaseClient.storage
            .from("profile_image")
            .upload(fileName, values.photo, { upsert: true });

          if (uploadError) {
            toast.error("Image upload failed");
            return;
          }

          const { data: publicUrlData } = SupabaseClient.storage
            .from("profile_image")
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        }

        // Department UUID fetch karo
        const { data: deptData, error: deptError } = await SupabaseClient
          .from("departments")
          .select("id")
          .eq("empDepartment", values.department)
          .single();

        if (deptError || !deptData) {
          toast.error("Department not found");
          return;
        }

        // Role UUID fetch karo
        const { data: roleData, error: roleError } = await SupabaseClient
          .from("roles")
          .select("id")
          .eq("emprole", values.role)
          .single();

        if (roleError || !roleData) {
          toast.error("Role not found");
          return;
        }

        // ✅ FIX: insert ki jagah upsert use karo - duplicate issue solve
        const { data: profileData, error: profileError } = await SupabaseClient
          .from("profiles")
          .upsert([
            {
              id: userId,
              full_name: values.name,
              phone: values.phoneNumber,
              email: values.email,
              department_id: deptData.id,
              role_id: roleData.id,
              avatar_url: imageUrl,
            },
          ], { onConflict: 'id' })
          .select()
          .single();

        if (profileError || !profileData) {
          toast.error(profileError?.message || "Profile creation failed");
          return;
        }

        toast.success("Employee added successfully!");

        // Reset preview and file input
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        formik.resetForm();

        navigate("/dashboard");
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className={styles.container}>
      {loading ? (
        <PageLoader />
      ) : (
        <form onSubmit={formik.handleSubmit} className={styles.form}>
          <h2 className={styles.title}>Add Employee</h2>

          {/* Profile Photo Preview */}
          {preview && (
            <div className={styles.previewContainer}>
              <img
                src={preview}
                alt="Profile Preview"
                className={styles.previewImage}
              />
            </div>
          )}

          {/* Photo Upload */}
          <label className={styles.label}>Profile Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  toast.error("Max 2MB allowed");
                  e.currentTarget.value = "";
                  return;
                }
                formik.setFieldValue("photo", file);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(URL.createObjectURL(file));
              }
            }}
            className={styles.input}
          />

          {/* Name */}
          <label htmlFor="name" className={styles.label}>Name</label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Enter full name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          />
          {formik.touched.name && formik.errors.name && (
            <div className={styles.error}>{formik.errors.name}</div>
          )}

          {/* Phone Number */}
          <label htmlFor="phoneNumber" className={styles.label}>Phone Number</label>
          <input
            id="phoneNumber"
            type="text"
            inputMode="numeric"
            name="phoneNumber"
            placeholder="Enter phone number"
            value={formik.values.phoneNumber}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          />
          {formik.touched.phoneNumber && formik.errors.phoneNumber && (
            <div className={styles.error}>{formik.errors.phoneNumber}</div>
          )}

          {/* Email */}
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          />
          {formik.touched.email && formik.errors.email && (
            <div className={styles.error}>{formik.errors.email}</div>
          )}

          {/* Password */}
          <label htmlFor="password" className={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Enter password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          />
          {formik.touched.password && formik.errors.password && (
            <div className={styles.error}>{formik.errors.password}</div>
          )}

          {/* Department */}
          <label htmlFor="department" className={styles.label}>Department</label>
          <select
            id="department"
            name="department"
            value={formik.values.department}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          >
            <option value="">Select Department</option>
            <option value="TechOps">TechOps</option>
            <option value="NetInfa">NetInfa</option>
            <option value="AppDev">AppDev</option>
            <option value="DevOps">DevOps</option>
            <option value="DataLab">DataLab</option>
            <option value="CloudSVc">CloudSVc</option>
            <option value="ITStrac">ITStrac</option>
            <option value="DigSol">DigSol</option>
            <option value="HR">HR</option>
          </select>
          {formik.touched.department && formik.errors.department && (
            <div className={styles.error}>{formik.errors.department}</div>
          )}

          {/* Role */}
          <label htmlFor="role" className={styles.label}>Role</label>
          <select
            id="role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={styles.input}
          >
            <option value="">Select Role</option>
            <option value="Software Developer">Software Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Full Stack">Full Stack</option>
            <option value="DevOps">DevOps</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Technical supporter">Technical supporter</option>
            <option value="Business Analyst">Business Analyst</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="UI Designer">UI Designer</option>
          </select>
          {formik.touched.role && formik.errors.role && (
            <div className={styles.error}>{formik.errors.role}</div>
          )}

          <button type="submit" className={styles.button}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default SignUp;