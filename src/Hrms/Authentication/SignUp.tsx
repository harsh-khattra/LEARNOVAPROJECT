import React, { useState, ChangeEvent } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SupabaseClient } from '../../Helper/Supabase';
import PageLoader from '../UI/PageLoader';
import styles from './Signup.module.css';

interface StudentFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface TeacherFormValues {
  name: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  department: string;
  photo: File | null;
}

const SignUpPortal: React.FC = () => {
  const navigate = useNavigate();

  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [studentPassVisible, setStudentPassVisible] = useState<boolean>(false);
  const [studentConfirmPassVisible, setStudentConfirmPassVisible] = useState<boolean>(false);
  const [teacherPassVisible, setTeacherPassVisible] = useState<boolean>(false);

  const [teacherPreview, setTeacherPreview] = useState<string | null>(null);

  const handleToggleState = () => {
    setErrorMsg(null);
    setIsStudent((prev) => !prev);
  };

  // Student Form — wired to Formik + Yup + Supabase, same signup pattern as Teacher below.
  // ASSUMPTION: your `roles` table has a row where emprole = "Student" — adjust the string
  // below to match whatever value you actually use for the student role in Supabase.
  const studentFormik = useFormik<StudentFormValues>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },

    validationSchema: Yup.object({
      name: Yup.string()
        .min(3, 'Name must be at least 3 characters')
        .required('Name is required'),
      email: Yup.string()
        .email('Invalid email format (example: test@gmail.com)')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    }),

    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { data: sessionData } = await SupabaseClient.auth.getSession();
        const adminSession = sessionData.session;

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
          toast.error('Signup failed, try again.');
          return;
        }

        const { data: roleData } = await SupabaseClient.from('roles')
          .select('id')
          .eq('emprole', 'Student')
          .maybeSingle();

        if (!roleData) {
          toast.error('Student role not found');
          return;
        }

        const { data: profileData, error: profileError } = await SupabaseClient
          .from('profiles')
          .upsert([
            {
              id: userId,
              full_name: values.name,
              role_id: roleData.id,
              email: values.email,
              avatar_url: null,
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile insert error:', profileError);
          toast.error(profileError.message);
          return;
        }
        if (!profileData) {
          toast.error('Profile creation failed');
          return;
        }

        toast.success('Signup successful!');
        setSuccessMsg(`Welcome, ${values.name}! Your student registration is complete.`);
        studentFormik.resetForm();
        if (adminSession) {
          await SupabaseClient.auth.setSession(adminSession);
        }
        navigate('/signup');
      } catch (err) {
        console.error(err);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    },
  });

  // Teacher Form — wired to Formik + Yup + Supabase, mirroring the reference SignUp flow
  const teacherFormik = useFormik<TeacherFormValues>({
    initialValues: {
      name: '',
      phoneNumber: '',
      email: '',
      password: '',
      role: '',
      department: '',
      photo: null,
    },

    validationSchema: Yup.object({
      name: Yup.string()
        .min(3, 'Name must be at least 3 characters')
        .required('Name is required'),
      phoneNumber: Yup.string()
        .required('Phone number is required')
        .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
      email: Yup.string()
        .email('Invalid email format (example: test@gmail.com)')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      role: Yup.string().required('Role is required'),
      department: Yup.string().required('Department is required'),
    }),

    onSubmit: async (values) => {
      setLoading(true);
      try {
        const { data: sessionData } = await SupabaseClient.auth.getSession();
        const adminSession = sessionData.session;

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
          toast.error('Signup failed, try again.');
          return;
        }

        const { data: roleData } = await SupabaseClient.from('roles')
          .select('id')
          .eq('emprole', values.role)
          .maybeSingle();

        if (!roleData) {
          toast.error('Role not found');
          return;
        }

        const { data: deptData } = await SupabaseClient.from('departments')
          .select('id')
          .eq('empDepartment', values.department)
          .maybeSingle();

        if (!deptData) {
          toast.error('Department not found');
          return;
        }

        let imageUrl = null;

        if (values.photo) {
          const fileExt = values.photo.name.split('.').pop();
          const fileName = `${userId}.${fileExt}`;

          const { error: uploadError } = await SupabaseClient.storage
            .from('profile_image')
            .upload(fileName, values.photo, {
              upsert: true,
            });

          if (uploadError) {
            toast.error('Image upload failed');
            return;
          }

          const { data: publicUrlData } = SupabaseClient.storage
            .from('profile_image')
            .getPublicUrl(fileName);

          imageUrl = publicUrlData.publicUrl;
        }

        const { data: profileData, error: profileError } = await SupabaseClient
          .from('profiles')
          .upsert([
            {
              id: userId,
              full_name: values.name,
              phone: values.phoneNumber,
              role_id: roleData.id,
              department_id: deptData.id,
              email: values.email,
              avatar_url: imageUrl,
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile insert error:', profileError);
          toast.error(profileError.message);
          return;
        }
        if (!profileData) {
          toast.error('Profile creation failed');
          return;
        }

        toast.success('Signup successful!');
        setSuccessMsg(`Welcome, ${values.name}! Your Educator profile (${values.role}) under ${values.department} department has been registered.`);
        teacherFormik.resetForm();
        if (teacherPreview) {
          URL.revokeObjectURL(teacherPreview);
        }
        setTeacherPreview(null);
        if (adminSession) {
          await SupabaseClient.auth.setSession(adminSession);
        }
        navigate('/signup');
      } catch (err) {
        console.error(err);
        toast.error('Something went wrong');
      } finally {
        setLoading(false);
      }
    },
  });

  const handleTeacherFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Max 2MB allowed');
        return;
      }
      teacherFormik.setFieldValue('photo', file);
      if (teacherPreview) {
        URL.revokeObjectURL(teacherPreview);
      }
      const objectUrl = URL.createObjectURL(file);
      setTeacherPreview(objectUrl);
    }
  };

  const handleReset = () => {
    studentFormik.resetForm();
    teacherFormik.resetForm();
    if (teacherPreview) {
      URL.revokeObjectURL(teacherPreview);
    }
    setTeacherPreview(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsStudent(true);
  };

  return (
    <div className={styles['app-body']}>
      <div className={styles.container}>
        {/* Exact diagonal slice design from image_0f5198.png */}
        <div className={styles['diagonal-overlay']}></div>

        <div className={styles['card-grid']}>
          {/* Left branding pane with dynamic single outlined toggle */}
          <div className={styles['left-pane']}>
            <div className={styles['brand-title']}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
              LEARNOVA
            </div>

            <div className={styles['banner-welcome-content']}>
              <h2 className={styles['banner-title']}>Welcome!</h2>
              <p className={styles['banner-subtitle']}>Create your account.<br />For Free!</p>

              <div className={styles['button-group-left']}>
                <button
                  className={styles['pill-btn']}
                  onClick={handleToggleState}
                  type="button"
                  disabled={loading}
                >
                  {isStudent ? 'Sign Up as Teacher' : 'Sign Up as Student'}
                </button>
              </div>
            </div>

            <div></div>
          </div>

          {/* Right form submission dynamic viewports */}
          <div className={styles['right-pane']}>

            {loading ? (
              <PageLoader />
            ) : (
              <>
                {/* Error Notifications Panel (student form only — teacher errors surface via toast) */}
                {errorMsg && (
                  <div className={styles['error-banner']}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg ? (
                  /* Success Panel view */
                  <div className={styles['success-panel']}>
                    <div className={styles['success-badge']}>✓</div>
                    <h1 className={styles['form-title']} style={{ marginBottom: '8px' }}>Success!</h1>
                    <p style={{ marginBottom: '24px', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {successMsg}
                    </p>
                    <button
                      type="button"
                      className={styles['action-btn-pill-solid']}
                      style={{ maxWidth: '240px', marginTop: 0 }}
                      onClick={handleReset}
                    >
                      Register Another Account
                    </button>
                  </div>
                ) : isStudent ? (
                  <div className={styles['form-wrapper']}>
                    <h1 className={styles['form-title']}>Student Sign Up</h1>
                    <form onSubmit={studentFormik.handleSubmit} noValidate>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="studentName">Full Name<span className={styles['required-star']}>*</span></label>
                        <input
                          type="text"
                          className={styles.input}
                          id="studentName"
                          name="name"
                          placeholder="e.g. John Doe"
                          value={studentFormik.values.name}
                          onChange={studentFormik.handleChange}
                          onBlur={studentFormik.handleBlur}
                        />
                        {studentFormik.touched.name && studentFormik.errors.name && (
                          <div className={styles['field-error']}>{studentFormik.errors.name}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="studentEmail">Email Address<span className={styles['required-star']}>*</span></label>
                        <input
                          type="email"
                          className={styles.input}
                          id="studentEmail"
                          name="email"
                          placeholder="student@example.com"
                          value={studentFormik.values.email}
                          onChange={studentFormik.handleChange}
                          onBlur={studentFormik.handleBlur}
                        />
                        {studentFormik.touched.email && studentFormik.errors.email && (
                          <div className={styles['field-error']}>{studentFormik.errors.email}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="studentPassword">Password<span className={styles['required-star']}>*</span></label>
                        <div className={styles['password-container']}>
                          <input
                            type={studentPassVisible ? 'text' : 'password'}
                            className={styles.input}
                            id="studentPassword"
                            name="password"
                            placeholder="Min. 6 characters"
                            value={studentFormik.values.password}
                            onChange={studentFormik.handleChange}
                            onBlur={studentFormik.handleBlur}
                          />
                          <button
                            type="button"
                            className={styles['toggle-pass-btn']}
                            onClick={() => setStudentPassVisible(!studentPassVisible)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        {studentFormik.touched.password && studentFormik.errors.password && (
                          <div className={styles['field-error']}>{studentFormik.errors.password}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="studentConfirmPassword">Confirm Password<span className={styles['required-star']}>*</span></label>
                        <div className={styles['password-container']}>
                          <input
                            type={studentConfirmPassVisible ? 'text' : 'password'}
                            className={styles.input}
                            id="studentConfirmPassword"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={studentFormik.values.confirmPassword}
                            onChange={studentFormik.handleChange}
                            onBlur={studentFormik.handleBlur}
                          />
                          <button
                            type="button"
                            className={styles['toggle-pass-btn']}
                            onClick={() => setStudentConfirmPassVisible(!studentConfirmPassVisible)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        {studentFormik.touched.confirmPassword && studentFormik.errors.confirmPassword && (
                          <div className={styles['field-error']}>{studentFormik.errors.confirmPassword}</div>
                        )}
                      </div>

                      <button type="submit" className={styles['action-btn-pill-solid']}>Register Student</button>
                    </form>
                  </div>
                ) : (
                  <div className={styles['form-wrapper']}>
                    <h1 className={styles['form-title']}>Teacher Sign Up</h1>
                    <form onSubmit={teacherFormik.handleSubmit} noValidate>

                      {/* Photo Input Area */}
                      <div className={styles.previewContainer}>
                        <div className={styles.previewImage}>
                          {!teacherPreview && <div className={styles.previewPlaceholder}>Add Photo</div>}
                          {teacherPreview && <img src={teacherPreview} alt="Teacher Preview" />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={styles.label} style={{ marginBottom: 0 }}>Avatar Image</span>
                          <div className={styles['upload-btn-container']}>
                            <button type="button" className={styles['upload-btn-custom']}>Choose Photo</button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleTeacherFileChange}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherName">Name<span className={styles['required-star']}>*</span></label>
                        <input
                          type="text"
                          className={styles.input}
                          id="teacherName"
                          name="name"
                          placeholder="Enter your full name"
                          value={teacherFormik.values.name}
                          onChange={teacherFormik.handleChange}
                          onBlur={teacherFormik.handleBlur}
                        />
                        {teacherFormik.touched.name && teacherFormik.errors.name && (
                          <div className={styles['field-error']}>{teacherFormik.errors.name}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherPhone">Phone Number<span className={styles['required-star']}>*</span></label>
                        <input
                          type="text"
                          className={styles.input}
                          id="teacherPhone"
                          name="phoneNumber"
                          inputMode="numeric"
                          placeholder="Enter 10-digit phone number"
                          value={teacherFormik.values.phoneNumber}
                          onChange={teacherFormik.handleChange}
                          onBlur={teacherFormik.handleBlur}
                        />
                        {teacherFormik.touched.phoneNumber && teacherFormik.errors.phoneNumber && (
                          <div className={styles['field-error']}>{teacherFormik.errors.phoneNumber}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherEmail">Email<span className={styles['required-star']}>*</span></label>
                        <input
                          type="email"
                          className={styles.input}
                          id="teacherEmail"
                          name="email"
                          placeholder="Enter your email"
                          value={teacherFormik.values.email}
                          onChange={teacherFormik.handleChange}
                          onBlur={teacherFormik.handleBlur}
                        />
                        {teacherFormik.touched.email && teacherFormik.errors.email && (
                          <div className={styles['field-error']}>{teacherFormik.errors.email}</div>
                        )}
                      </div>

                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherPassword">Password<span className={styles['required-star']}>*</span></label>
                        <div className={styles['password-container']}>
                          <input
                            type={teacherPassVisible ? 'text' : 'password'}
                            className={styles.input}
                            id="teacherPassword"
                            name="password"
                            placeholder="Enter your password"
                            value={teacherFormik.values.password}
                            onChange={teacherFormik.handleChange}
                            onBlur={teacherFormik.handleBlur}
                          />
                          <button
                            type="button"
                            className={styles['toggle-pass-btn']}
                            onClick={() => setTeacherPassVisible(!teacherPassVisible)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                        {teacherFormik.touched.password && teacherFormik.errors.password && (
                          <div className={styles['field-error']}>{teacherFormik.errors.password}</div>
                        )}
                      </div>

                      {/* Department Dropdown */}
                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherDepartment">Department<span className={styles['required-star']}>*</span></label>
                        <select
                          className={styles.input}
                          id="teacherDepartment"
                          name="department"
                          value={teacherFormik.values.department}
                          onChange={teacherFormik.handleChange}
                          onBlur={teacherFormik.handleBlur}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`
                          }}
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
                        {teacherFormik.touched.department && teacherFormik.errors.department && (
                          <div className={styles['field-error']}>{teacherFormik.errors.department}</div>
                        )}
                      </div>

                      {/* Role Dropdown */}
                      <div className={styles['form-group']}>
                        <label className={styles.label} htmlFor="teacherRole">Role<span className={styles['required-star']}>*</span></label>
                        <select
                          className={styles.input}
                          id="teacherRole"
                          name="role"
                          value={teacherFormik.values.role}
                          onChange={teacherFormik.handleChange}
                          onBlur={teacherFormik.handleBlur}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`
                          }}
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
                        {teacherFormik.touched.role && teacherFormik.errors.role && (
                          <div className={styles['field-error']}>{teacherFormik.errors.role}</div>
                        )}
                      </div>

                      <button type="submit" className={styles['action-btn-pill-solid']}>Submit Registration</button>
                    </form>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPortal;