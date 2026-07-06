import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Certificate.css";
import { lmsService } from "../../Elearning/lms/services/lmsService";
import type { Course as LmsCourse } from "../../Elearning/lms/types/lms";
import { SupabaseClient } from "../../Helper/Supabase";

type TabKey = "enrolled" | "active" | "completed" | "certificates";

type EnrolledCourse = LmsCourse & {
  progress: number; // 0 - 100
  certificateId: string | null;
  completedOn: string | null;
};

// Shape expected by Downloadcert.tsx (kept in sync with that component).
type CompletedCertificate = {
  id: string;
  courseName: string;
  credentialId: string;
  dateIssued: string;
  grade: string;
  instructorName: string;
  registrarName: string;
  verificationSlug: string;
};

const CATEGORY_COLOR: Record<string, string> = {
  "Software engineering": "amber",
  "Cyber security": "blue",
  "Product management": "purple",
  "Data science": "teal",
  Design: "coral",
};

function getCategoryColor(category?: string | null): string {
  return CATEGORY_COLOR[category ?? ""] ?? "amber";
}

function getField<T = string>(course: any, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (course?.[key] !== undefined && course?.[key] !== null) return course[key];
  }
  return undefined;
}

// completed_at from Supabase is usually an ISO timestamp — format it the
// way the certificate card expects, e.g. "June 20, 2026".
function formatDateIssued(raw: string | null): string {
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Builds the exact certificate object Downloadcert.tsx renders, using this
// specific course's real data instead of any hardcoded/mock values.
function buildCertificateFromCourse(course: EnrolledCourse): CompletedCertificate {
  const instructor =
    getField<string>(course, "instructor", "instructor_name") ?? "Instructor";
  const registrar =
    getField<string>(course, "registrar", "registrar_name") ?? "Course Registrar";
  const grade =
    getField<string>(course, "grade", "final_grade", "score") ?? "100% (Completion)";
  const credentialId = course.certificateId ?? course.id;

  return {
    id: course.id,
    courseName: course.title,
    credentialId,
    dateIssued: formatDateIssued(course.completedOn),
    grade,
    instructorName: instructor,
    registrarName: registrar,
    verificationSlug: credentialId,
  };
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "enrolled", label: "Enrolled" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "certificates", label: "Certificates" },
];

function filterCourses(courses: EnrolledCourse[], tab: TabKey): EnrolledCourse[] {
  switch (tab) {
    case "active":
      return courses.filter((c) => c.progress > 0 && c.progress < 100);
    case "completed":
    case "certificates":
      return courses.filter((c) => c.progress === 100);
    default:
      return courses;
  }
}

export default function Certificate() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("enrolled");
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [institute, setInstitute] = useState<string>("Learnova Institute");

  /* ── Fetch real enrolled courses + progress from Supabase ──
     Same approach as EnrolledCourses.tsx: pull the course catalog + this
     employee's enrollments, then read progress_percentage / completed_at
     directly from public.course_enrollment so it always matches what the
     player writes back while watching a course. */
  useEffect(() => {
    const loadEnrolledCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
        } = await SupabaseClient.auth.getUser();

        if (!user) {
          setCourses([]);
          return;
        }

        // Used to personalize the certificate ("Congratulations, <name>!")
        setStudentName(
          (user.user_metadata as any)?.full_name ??
            (user.user_metadata as any)?.name ??
            user.email ??
            "Student"
        );

        const allCourses = await lmsService.fetchCourses("all");

        const enrollments: any[] = await lmsService.fetchEmployeeEnrollments(user.id);

        const directProgress = new Map<string, { progress: number; completedOn: string | null }>();
        const { data: enrollmentRows, error: enrollFetchError } = await SupabaseClient
          .from("course_enrollment")
          .select("course_id, progress_percentage, completed_at")
          .eq("employee_id", user.id);

        if (enrollFetchError) {
          console.error("[course_enrollment] fetch on load FAILED:", enrollFetchError);
        } else {
          for (const row of enrollmentRows ?? []) {
            directProgress.set(row.course_id, {
              progress: Number(row.progress_percentage ?? 0),
              completedOn: row.completed_at ?? null,
            });
          }
        }

        const hydrated: EnrolledCourse[] = enrollments
          .map((enr) => {
            const courseId =
              typeof enr === "string" ? enr : enr.course_id ?? enr.courseId ?? enr.id;
            const course = allCourses.find((c: any) => c.id === courseId);
            if (!course) return null;

            const direct = directProgress.get(courseId);
            const progress =
              direct?.progress ??
              (typeof enr === "object"
                ? Number(enr.progress ?? enr.progress_percent ?? enr.progress_percentage ?? 0)
                : 0);
            const certificateId =
              typeof enr === "object"
                ? enr.certificate_id ?? enr.certificateId ?? null
                : null;
            const completedOn =
              direct?.completedOn ??
              (typeof enr === "object"
                ? enr.completed_on ?? enr.completedOn ?? null
                : null);

            return {
              ...course,
              progress,
              certificateId,
              completedOn,
            } as EnrolledCourse;
          })
          .filter((c): c is EnrolledCourse => c !== null);

        setCourses(hydrated);
      } catch (err) {
        console.error("Error loading enrolled courses:", err);
        setError("Could not load your enrolled courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadEnrolledCourses();
  }, []);

  const handleNavigateToDownloadcertificate = (course: EnrolledCourse) => {
    if (course.progress >= 100) {
      // Build the real certificate for THIS course and carry it along via
      // router state, so Downloadcert.tsx shows exactly what was clicked —
      // no id-matching against a static list required.
      const certificate = buildCertificateFromCourse(course);
      const routeId = course.certificateId ?? course.id;

      navigate(`/learning/student/downloadcertificate/${routeId}`, {
        state: {
          certificate,
          studentName,
          institute,
        },
      });
    } else {
      // Not yet completed — send them to continue learning instead.
      navigate(`/learning/student/enroll/${course.id}`);
    }
  };

  const certificateCount = useMemo(
    () => courses.filter((c) => c.progress === 100).length,
    [courses]
  );

  const visibleCourses = useMemo(
    () => filterCourses(courses, activeTab),
    [courses, activeTab]
  );

  const isCertificatesTab = activeTab === "certificates";

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading your certificates...
      </div>
    );
  }

  return (
    <div className="cert-page">
      <div className="cert-banner">
        <div className="cert-banner-text">
          <h1>Certificate</h1>
          <p>Continue learning from where you left off, track your progress across every course.</p>
        </div>
        {/* <button className="cert-banner-menu" aria-label="More options"> */}
          {/* <DotsIcon /> */}
        {/* </button> */}
      </div>

      {error && <div className="cert-empty" style={{ marginBottom: 16 }}>{error}</div>}

      <nav className="cert-tabs" role="tablist" aria-label="Course filters">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`cert-tab ${activeTab === tab.key ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "certificates" && certificateCount > 0 && (
              <span className="cert-tab-badge">{certificateCount}</span>
            )}
          </button>
        ))}
      </nav>

      {visibleCourses.length === 0 ? (
        <div className="cert-empty">
          <p className="cert-empty-title">Nothing here yet</p>
          <p className="cert-empty-body">
            {activeTab === "certificates"
              ? "Complete a course to earn your first certificate."
              : "No courses match this filter right now."}
          </p>
        </div>
      ) : (
        <div className="cert-grid">
          {visibleCourses.map((course) => {
            const isDone = course.progress === 100;
            const category = getField<string>(course, "category");
            const instructor = getField<string>(course, "instructor", "instructor_name") ?? "Instructor";
            const thumbnail =
              getField<string>(course, "thumbnail", "thumbnail_url") ??
              "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=300&fit=crop";
            const colorKey = getCategoryColor(category);

            return (
              <article
                key={course.id}
                className={`cert-card ${isCertificatesTab ? "has-strip" : ""}`}
                style={
                  isCertificatesTab
                    ? ({ "--strip-color": `var(--c-${colorKey})` } as React.CSSProperties)
                    : undefined
                }
              >
                <div
                  className="cert-card-thumb"
                  style={{ backgroundImage: `url(${thumbnail})` }}
                  role="img"
                  aria-label={course.title}
                />

                <div className="cert-card-body">
                  {category && <p className="cert-card-category">{category}</p>}
                  <h3 className="cert-card-title">{course.title}</h3>
                  <p className="cert-card-instructor">{instructor}</p>

                  <div className="cert-progress-track">
                    <div
                      className="cert-progress-fill"
                      style={{
                        width: `${course.progress}%`,
                        backgroundColor: isDone ? `var(--c-${colorKey})` : undefined,
                      }}
                    />
                  </div>
                  <p className="cert-progress-label">{course.progress}% complete</p>

                  <div className="cert-card-footer">
                    {course.certificateId ? (
                      <span className="cert-id">{course.certificateId}</span>
                    ) : (
                      <span />
                    )}
                    <button
                      className={`cert-action-btn ${isDone ? "is-done" : "is-locked"}`}
                      disabled={!isDone}
                      onClick={() => {
                        if (isDone) handleNavigateToDownloadcertificate(course);
                      }}
                    >
                      <AwardIcon />
                      View certificate
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Inline icons (no external icon dependency) ---- */
function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" />
      <path d="M9 13.5 7 22l5-3 5 3-2-8.5" />
    </svg>
  );
}