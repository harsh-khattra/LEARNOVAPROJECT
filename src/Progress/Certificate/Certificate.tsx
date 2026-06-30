import React, { useMemo, useState } from "react";
import "./Certificate.css";

/* =========================================================================
   STATIC CERTIFICATES PAGE
   - Dummy data only, no Supabase calls yet.
   - Tabs: Enrolled / Active / Completed / Certificates
   - Certificates tab shows only 100%-complete courses with a
     category-colored left strip and a "View certificate" button.
   ========================================================================= */

type CourseCategory =
  | "Software engineering"
  | "Cyber security"
  | "Product management"
  | "Data science"
  | "Design";

type Course = {
  id: string;
  title: string;
  instructor: string;
  category: CourseCategory;
  thumbnail: string;
  progress: number; // 0 - 100
  certificateId: string | null;
  completedOn: string | null;
};

type TabKey = "enrolled" | "active" | "completed" | "certificates";

const CATEGORY_COLOR: Record<CourseCategory, string> = {
  "Software engineering": "amber",
  "Cyber security": "blue",
  "Product management": "purple",
  "Data science": "teal",
  Design: "coral",
};

/* ---- Static dummy data — replace with Supabase fetch later ---- */
const STATIC_COURSES: Course[] = [
  {
    id: "c1",
    title: "Advanced full-stack engineering and AI systems",
    instructor: "Dr. Samantha Sterling",
    category: "Software engineering",
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=300&fit=crop",
    progress: 100,
    certificateId: "CERT-2026-X9Y2",
    completedOn: "2026-06-26",
  },
  {
    id: "c2",
    title: "Ethical hacking and network defenses",
    instructor: "Prof. Donald Vance",
    category: "Cyber security",
    thumbnail:
      "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&h=300&fit=crop",
    progress: 100,
    certificateId: "CERT-2026-H8K1",
    completedOn: "2026-04-12",
  },
  {
    id: "c3",
    title: "Agile methodologies and product delivery",
    instructor: "Kelly Woods",
    category: "Product management",
    thumbnail:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=300&fit=crop",
    progress: 100,
    certificateId: "CERT-2025-P4A1",
    completedOn: "2025-11-05",
  },
  {
    id: "c4",
    title: "Applied machine learning foundations",
    instructor: "Dr. Wei Chen",
    category: "Data science",
    thumbnail:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop",
    progress: 62,
    certificateId: null,
    completedOn: null,
  },
  {
    id: "c5",
    title: "Full stack web development bootcamp",
    instructor: "Marcus Lee",
    category: "Software engineering",
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=300&fit=crop",
    progress: 0,
    certificateId: null,
    completedOn: null,
  },
  {
    id: "c6",
    title: "Enterprise UI/UX design masterclass",
    instructor: "Priya Nair",
    category: "Design",
    thumbnail:
      "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=600&h=300&fit=crop",
    progress: 18,
    certificateId: null,
    completedOn: null,
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: "enrolled", label: "Enrolled" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "certificates", label: "Certificates" },
];

function filterCourses(courses: Course[], tab: TabKey): Course[] {
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
  const [activeTab, setActiveTab] = useState<TabKey>("enrolled");
  const courses = STATIC_COURSES;

  const certificateCount = useMemo(
    () => courses.filter((c) => c.progress === 100).length,
    [courses]
  );

  const visibleCourses = useMemo(
    () => filterCourses(courses, activeTab),
    [courses, activeTab]
  );

  const isCertificatesTab = activeTab === "certificates";

  function handlePrimaryAction(course: Course) {
    if (course.progress === 100) {
      // Placeholder — wire up to the real Certificate page route later.
      console.log("Open certificate for", course.certificateId);
    } else {
      console.log("Continue learning", course.id);
    }
  }

  return (
    <div className="cert-page">
      <div className="cert-banner">
        <div className="cert-banner-text">
          <h1>Enrolled courses</h1>
          <p>Continue learning from where you left off, track your progress across every course.</p>
        </div>
        <button className="cert-banner-menu" aria-label="More options">
          <DotsIcon />
        </button>
      </div>

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
            const colorKey = CATEGORY_COLOR[course.category];
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
                  style={{ backgroundImage: `url(${course.thumbnail})` }}
                  role="img"
                  aria-label={course.title}
                />

                <div className="cert-card-body">
                  <p className="cert-card-category">{course.category}</p>
                  <h3 className="cert-card-title">{course.title}</h3>
                  <p className="cert-card-instructor">{course.instructor}</p>

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
                      className={`cert-action-btn ${isDone ? "is-done" : ""}`}
                      onClick={() => handlePrimaryAction(course)}
                    >
                      {isDone ? <AwardIcon /> : <PlayIcon />}
                      {isDone ? "View certificate" : "Continue learning"}
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