import { useState, useEffect } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiBookOpen,
  FiAward,
  FiChevronDown,
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";

import { SupabaseClient } from "../../Helper/Supabase";
import styles from "./CourseCompletion.module.css";

// ── Types ─────────────────────────────────────────────────
type CourseStatus = "completed" | "inprogress" | "notstarted";

interface CourseItem {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail_url: string;
  progressPercentage: number;
  status: CourseStatus;
  enrolledAt: string | null;
  completedAt: string | null;
}

interface WeeklyPoint {
  week: string;
  completed: number;
}

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

// ── Helpers ───────────────────────────────────────────────
const statusIcon: Record<CourseStatus, React.ReactElement> = {
  completed: <FiCheckCircle />,
  inprogress: <FiClock />,
  notstarted: <FiBookOpen />,
};

const statusIconClass: Record<CourseStatus, string> = {
  completed: styles.iconPass,
  inprogress: styles.iconWarning,
  notstarted: styles.iconNeutral,
};

const progressBarClass: Record<CourseStatus, string> = {
  completed: styles.barPass,
  inprogress: styles.barWarning,
  notstarted: styles.barNeutral,
};

const progressLabelClass: Record<CourseStatus, string> = {
  completed: styles.labelPass,
  inprogress: styles.labelWarning,
  notstarted: styles.labelNeutral,
};

function getPercent(value: number | null | undefined): number {
  if (!value || value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function getStatusFromPercent(percent: number): CourseStatus {
  if (percent >= 100) return "completed";
  if (percent > 0) return "inprogress";
  return "notstarted";
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeklyCompletionData(enrollments: EnrollmentRow[]): WeeklyPoint[] {
  const now = new Date();
  const thisWeekStart = getWeekStart(now);

  const weekStarts: Date[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = new Date(thisWeekStart);
    ws.setDate(ws.getDate() - i * 7);
    weekStarts.push(ws);
  }

  const counts = new Array(8).fill(0);
  enrollments.forEach((enrollment) => {
    if (!enrollment.completed_at) return;
    const completedWeekStart = getWeekStart(new Date(enrollment.completed_at)).getTime();
    const idx = weekStarts.findIndex((ws) => ws.getTime() === completedWeekStart);
    if (idx !== -1) counts[idx] += 1;
  });

  return weekStarts.map((_, i) => ({ week: `W${i + 1}`, completed: counts[i] }));
}

/** Generate a unique certificate number like LO-2025-XXXXX */
function generateCertNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `LO-${year}-${rand}`;
}

/**
 * Auto-generate a certificate for a completed course if one doesn't exist yet.
 * Uses INSERT ... ON CONFLICT DO NOTHING so it's safe to call multiple times.
 */
async function ensureCertificate(userId: string, courseId: string): Promise<void> {
  // Check if certificate already exists
  const { data: existing } = await SupabaseClient
    .from("certificates")
    .select("id")
    .eq("student_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) return; // already exists, nothing to do

  // Insert new certificate
  const { error } = await SupabaseClient
    .from("certificates")
    .insert({
      student_id: userId,
      course_id: courseId,
      certificate_number: generateCertNumber(),
    });

  if (error) {
    // Ignore unique-constraint violations (race condition — another tab inserted first)
    if (error.code !== "23505") {
      console.error("Certificate insert error:", error);
    }
  }
}

// ── Donut SVG chart ───────────────────────────────────────
const DonutChart = ({ percent }: { percent: number }) => {
  const r = 70;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const filled = (percent / 100) * circumference;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e4d9" strokeWidth="14" />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="#0f9d6e" strokeWidth="14"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="24" fontWeight="700" fill="#1f1d1a">
        {percent}%
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fill="#9b958c">
        completed
      </text>
    </svg>
  );
};

// ── Component ─────────────────────────────────────────────
const CourseCompletion = () => {
  const [visibleCount, setVisibleCount] = useState<number>(4);
  const [courseList, setCourseList] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [completedCount, setCompletedCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [overallPercent, setOverallPercent] = useState(0);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [certificateCount, setCertificateCount] = useState<number | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  async function fetchEnrollments() {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: authError,
    } = await SupabaseClient.auth.getUser();

    if (authError || !user) {
      setError("Please log in to see your course completion stats.");
      setLoading(false);
      return;
    }

    // ── 1. Fetch enrollments ──
    const { data, error: fetchError } = await SupabaseClient
      .from("course_enrollment")
      .select(
        `id, progress_percentage, enrolled_at, completed_at, course_id,
         courses ( id, title, description, category, thumbnail_url, status )`
      )
      .eq("employee_id", user.id)
      .order("enrolled_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase error:", fetchError);
      setError("Couldn't load your course data. Please try again.");
      setLoading(false);
      return;
    }

    const enrollments = (data as unknown as EnrollmentRow[]) ?? [];

    // ── 2. Auto-generate certificates for every 100% course ──
    const completedEnrollments = enrollments.filter(
      (e) => getPercent(e.progress_percentage) >= 100
    );

    // Run all certificate inserts in parallel (safe — each has ON CONFLICT DO NOTHING)
    await Promise.all(
      completedEnrollments.map((e) => ensureCertificate(user.id, e.course_id))
    );

    // ── 3. Fetch real certificate count from certificates table ──
    const { count: certCount } = await SupabaseClient
      .from("certificates")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id);

    setCertificateCount(certCount ?? 0);

    // ── 4. Map enrollments to display items ──
    const mapped: CourseItem[] = enrollments
      .filter((e) => e.courses !== null)
      .map((e) => {
        const percent = getPercent(e.progress_percentage);
        return {
          id: e.course_id,
          title: e.courses!.title ?? "Untitled",
          category: e.courses!.category ?? "Uncategorized",
          description: e.courses!.description ?? "",
          thumbnail_url: e.courses!.thumbnail_url ?? "",
          progressPercentage: percent,
          status: getStatusFromPercent(percent),
          enrolledAt: e.enrolled_at,
          completedAt: e.completed_at,
        };
      });
    setCourseList(mapped);

    // ── 5. Stats ──
    const completed = completedEnrollments.length;
    const inProgress = enrollments.filter((e) => {
      const p = getPercent(e.progress_percentage);
      return p > 0 && p < 100;
    }).length;
    const total = enrollments.length;

    setCompletedCount(completed);
    setInProgressCount(inProgress);
    setTotalEnrolled(total);
    setOverallPercent(total > 0 ? Math.round((completed / total) * 100) : 0);
    setWeeklyData(buildWeeklyCompletionData(enrollments));

    setLoading(false);
  }

  const remaining = Math.max(totalEnrolled - completedCount, 0);
  const maxWeeklyValue = Math.max(...weeklyData.map((w) => w.completed), 1);

  const stats = [
    { label: "Courses completed", value: String(completedCount), icon: <FiCheckCircle /> },
    { label: "In progress",       value: String(inProgressCount), icon: <FiClock /> },
    { label: "Total enrolled",    value: String(totalEnrolled),   icon: <FiBookOpen /> },
    {
      label: "Certificates",
      value: certificateCount === null ? "—" : String(certificateCount),
      icon: <FiAward />,
    },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <p style={{ color: "#9b958c", fontSize: 14 }}>Loading your progress…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <span className={styles.statIcon}>{s.icon}</span>
            <div className={styles.statText}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Overall completion</h3>
          <div className={styles.donutWrap}>
            <DonutChart percent={overallPercent} />
          </div>
          <div className={styles.radialLegend}>
            <span className={styles.legendDot} style={{ background: "#0f9d6e" }} />
            <span className={styles.legendLabel}>Completed ({completedCount})</span>
            <span className={styles.legendDot} style={{ background: "#e8e4d9", border: "1.5px solid #c9c4b8" }} />
            <span className={styles.legendLabel}>Remaining ({remaining})</span>
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
          <h3 className={styles.chartTitle}>Courses completed per week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={28} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ece9e0" strokeDasharray="3 3" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#9b958c", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9b958c", fontSize: 12 }} allowDecimals={false} />
              <Bar dataKey="completed">
                {weeklyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.completed >= maxWeeklyValue && entry.completed > 0 ? "#0f9d6e" : "#b8ddd0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Course history ── */}
      <div className={styles.historySection}>
        <h3 className={styles.historyTitle}>Course history</h3>

        {courseList.length === 0 ? (
          <p style={{ color: "#9b958c", fontSize: 14 }}>
            You haven't enrolled in any courses yet.
          </p>
        ) : (
          <>
            <div className={styles.historyList}>
              {courseList.slice(0, visibleCount).map((course) => (
                <div key={course.id} className={styles.courseCard}>
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className={styles.courseThumbnail}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className={`${styles.statusIcon} ${statusIconClass[course.status]}`}>
                      {statusIcon[course.status]}
                    </span>
                  )}

                  <div className={styles.courseInfo}>
                    <span className={styles.courseTitle}>{course.title}</span>
                    <span className={styles.courseCategory}>{course.category}</span>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={`${styles.progressBarFill} ${progressBarClass[course.status]}`}
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <span className={`${styles.progressLabel} ${progressLabelClass[course.status]}`}>
                    {course.progressPercentage}%
                  </span>
                </div>
              ))}
            </div>

            {visibleCount < courseList.length && (
              <button
                className={styles.loadMoreBtn}
                onClick={() => setVisibleCount((p) => p + 4)}
                aria-label="Load more"
              >
                <FiChevronDown />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseCompletion;