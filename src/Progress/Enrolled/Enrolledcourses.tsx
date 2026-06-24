import React, { useEffect, useState } from "react";
import { SupabaseClient } from "../../Helper/Supabase";
import "./EnrolledCourses.css";

type TabKey = "enrolled" | "active" | "completed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "enrolled", label: "Enrolled courses" },
  { key: "active", label: "Active courses" },
  { key: "completed", label: "Completed courses" },
];

// Shape of a single row returned by the join query below
interface EnrollmentRow {
  id: string;
  progress_percentage: number | null;
  enrolled_at: string | null;
  completed_at: string | null;
  course_id: string;
  courses: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    thumbnail_url: string | null;
    status: string | null;
  } | null;
}

function getPercent(value: number | null | undefined): number {
  if (!value || value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

const CourseCard: React.FC<{ enrollment: EnrollmentRow }> = ({
  enrollment,
}) => {
  const course = enrollment.courses;
  const percent = getPercent(enrollment.progress_percentage);

  if (!course) return null;

  return (
    <div className="course-card">
      <div className="course-card__thumb">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="course-card__thumb-img"
          />
        ) : (
          <span className="course-card__thumb-fallback" aria-hidden="true">
            {course.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{course.title}</h3>

        <div
          className="course-card__progress-track"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${course.title} progress`}
        >
          <div
            className="course-card__progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="course-card__percent">{percent}% complete</p>

        <button type="button" className="course-card__cta">
          Continue learning
        </button>
      </div>
    </div>
  );
};

const EnrolledCourses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("enrolled");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  async function fetchEnrolledCourses() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: authError,
    } = await SupabaseClient.auth.getUser();

    if (authError || !user) {
      setError("Please log in to see your enrolled courses.");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await SupabaseClient
      .from("course_enrollment")
      .select(
        `
        id,
        progress_percentage,
        enrolled_at,
        completed_at,
        course_id,
        courses (
          id,
          title,
          description,
          category,
          thumbnail_url,
          status
        )
      `
      )
      .eq("employee_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (fetchError) {
      setError("Couldn't load your courses. Please try again.");
      setLoading(false);
      return;
    }

    setEnrollments((data as unknown as EnrollmentRow[]) ?? []);
    setLoading(false);
  }

  // Filter rows for the Active / Completed tabs based on progress
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const percent = getPercent(enrollment.progress_percentage);
    if (activeTab === "completed") return percent >= 100;
    if (activeTab === "active") return percent > 0 && percent < 100;
    return true; // "enrolled" tab shows everything
  });

  return (
    <div className="enrolled-courses">
      <header className="enrolled-courses__hero">
        <button
          type="button"
          className="enrolled-courses__more"
          aria-label="More options"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>

        <h1 className="enrolled-courses__heading">Enrolled courses</h1>
        <p className="enrolled-courses__subheading">
          Continue learning from where you left off, track your progress
          across every course.
        </p>
      </header>

      <nav className="enrolled-courses__tabs" aria-label="Course filters">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={
              "enrolled-courses__tab" +
              (activeTab === tab.key ? " enrolled-courses__tab--active" : "")
            }
            onClick={() => setActiveTab(tab.key)}
            aria-current={activeTab === tab.key ? "true" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <p className="enrolled-courses__state">Loading your courses…</p>
      )}

      {!loading && error && (
        <p className="enrolled-courses__state enrolled-courses__state--error">
          {error}
        </p>
      )}

      {!loading && !error && filteredEnrollments.length === 0 && (
        <p className="enrolled-courses__state">
          No courses to show here yet.
        </p>
      )}

      {!loading && !error && filteredEnrollments.length > 0 && (
        <div className="enrolled-courses__grid">
          {filteredEnrollments.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;