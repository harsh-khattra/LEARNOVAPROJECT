
import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { SupabaseClient } from "../../Helper/Supabase";
import toast from "react-hot-toast";
import type { Employee } from "./Management";
import styles from "./Management.module.css";

type Props = {
  visible: boolean;
  mode: "add" | "edit";
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Employee | null;
};

const roles = [
  { label: "Frontend Developer", value: "Frontend Developer" },
  { label: "Backend Developer", value: "Backend Developer" },
];

const departments = [
  { label: "TechOps", value: "TechOps" },
  { label: "HR", value: "HR" },
];

const EmployeeForm: React.FC<Props> = ({
  visible,
  mode,
  onClose,
  onSuccess,
  initialData,
}) => {
  const isEdit = mode === "edit";
  const [imageFile, setImageFile] = useState<File | null>(null);
const [preview, setPreview] = useState<string | null>(null); 

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
    department: "",
  });

  const [errors, setErrors] = useState<any>({});

  // Prefill for EDIT
  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        name: initialData.Name,
        email: initialData.Email,
        phone: initialData.phone,
        password: "",
        role: initialData.role,
        department: initialData.department,
      });
      setPreview(initialData.avatar_url);
    } else {
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        department: "",
      });
    }
  }, [initialData, visible]);

  // Validation
  const validate = () => {
    let err: any = {};

    if (!form.name.trim()) err.name = "Name is required";

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      err.email = "Valid email required";

    if (!form.phone.match(/^[0-9]{10}$/))
      err.phone = "Phone must be 10 digits";

    if (!isEdit && form.password.length < 6)
      err.password = "Password must be at least 6 chars";

    if (!form.role) err.role = "Role required";
    if (!form.department) err.department = "Department required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

const uploadImage = async (userId: string) => {
  if (!imageFile) return null;

  const filePath = `${userId}-${Date.now()}`;

  const { error } = await SupabaseClient.storage
    .from("profile_image")
    .upload(filePath, imageFile);

  if (error) {
    toast.error("Image upload failed");
    return null;
  }

  const { data } = SupabaseClient.storage
    .from("profile_image")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
const handleSubmit = async () => {
  if (!validate()) return;

  try {
    //  get role_id
    const { data: roleData, error: roleError } = await SupabaseClient
      .from("roles")
      .select("id")
      .eq("emprole", form.role)
      .single();

    if (roleError || !roleData) {
      toast.error("Role not found");
      return;
    }

    // get department_id
    const { data: deptData, error: deptError } = await SupabaseClient
      .from("departments")
      .select("id")
      .eq("empDepartment", form.department)
      
      .single();

       if (deptError || !deptData) {
      toast.error("Department not found");
      return;
    }
//edit
    if (isEdit && initialData) {
        let avatarUrl = initialData.avatar_url;

  if (imageFile) {
    const uploadedUrl = await uploadImage(initialData.id);
    if (uploadedUrl) {
      avatarUrl = uploadedUrl;
    }
  }

      const { error } = await SupabaseClient
        .from("profiles")
        .update({
          full_name: form.name,
          phone: form.phone,
          role_id: roleData.id,
          department_id: deptData.id,
          avatar_url:avatarUrl,
        })
        .eq("id", initialData.id);

      if (error) return toast.error(error.message);

      toast.success("Employee Updated ");
    }
//add
    else {
      const { data, error } = await SupabaseClient.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) return toast.error(error.message);

      const userId = data?.user?.id;
    
      if (!userId) return toast.error("Signup failed");
       

      //insert image to supabase
      const avatarUrl = await uploadImage(userId);
      const { error: profileError } = await SupabaseClient
        .from("profiles")
        .insert([
          {
            id: userId,
            full_name: form.name,
            phone: form.phone,
            Email: form.email,
            role_id: roleData.id,
            department_id: deptData.id,
            avatar_url: avatarUrl,
          },
        ]);

      if (profileError) return toast.error(profileError.message);

      toast.success("Employee Added ");
    }

    onClose();
    onSuccess();

  } catch (err) {
    toast.error("Something went wrong");
  }
};
  return (
    
    <Dialog
      header={isEdit ? "Edit Employee" : "Add Employee"}
      visible={visible}
      style={{ width: "400px" }}
        contentStyle={{ overflow: "visible" , maxHeight: "none"}}
      onHide={onClose}
    >
   
      <div className="p-fluid">

        {/* Name */}
        <div className="field">
          <b>Name:</b>
          <InputText
            
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          {errors.name && <small className="p-error">{errors.name}</small>}
        </div><br/>

        {/* Email */}
<div className="field">
  <b>Email:</b>

  <InputText
    value={form.email}
    disabled={isEdit}
    className={isEdit ? styles.disabledInput : ""}
  />

  {isEdit && (
    <small className={styles.disabledText}>
      *Email cannot be changed
    </small>
  )}
<br/>
  {errors.email && <small className="p-error">{errors.email}</small>}
</div>

        {/* Phone */}
        <div className="field">
          <b>Phone:</b>
          <InputText
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {errors.phone && <small className="p-error">{errors.phone}</small>}
        </div>

        {/* Password (only ADD) */}
        {!isEdit && (
          <div className="field">
            <p><b>Password:</b></p>
            <InputText
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            {errors.password && (
              <small className="p-error">{errors.password}</small>
            )}
          </div>
        )}<br/>

        {/* Role */}
        <div className="field">
          <b>Roles:</b>
          <Dropdown
            value={form.role}
            options={roles}
            placeholder="Select Role"
            onChange={(e) => setForm({ ...form, role: e.value })}
          />
          {errors.role && <small className="p-error">{errors.role}</small>}
        </div><br/>

        {/* Department */}
        <div className="field">
          <b>Department</b>
          <Dropdown
            value={form.department}
            options={departments}
            placeholder="Select Department"
            onChange={(e) => setForm({ ...form, department: e.value })}
          />
          {errors.department && (
            <small className="p-error">{errors.department}</small>
          )}<br/>
        </div>
<div className="field">
  <b>Profile Image</b>


  {preview && (
    <img
      src={preview}
      alt="preview"
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        marginTop: "10px",
        objectFit: "cover",
      }}
    />
  )}
</div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
          }
        }}
      />
    
        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <Button label="Save" onClick={handleSubmit} />
          <Button
            label="Cancel"
            className="p-button-secondary"
            onClick={onClose}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default EmployeeForm;