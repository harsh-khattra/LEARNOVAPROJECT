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

interface CourseStat {
  label: string;
  value: string;
  icon: React.ReactElement;
}

interface CourseItem {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail_url: string;
  status: CourseStatus;
  dbStatus: string; // raw status from Supabase e.g. "published"
  duration: string | null;
  created_at: string;
}

interface WeeklyPoint {
  week: string;
  completed: number;
}

// ── Static Data ───────────────────────────────────────────
const stats: CourseStat[] = [
  { label: "Courses completed", value: "12", icon: <FiCheckCircle /> },
  { label: "In progress",       value: "4",  icon: <FiClock />       },
  { label: "Total enrolled",    value: "18", icon: <FiBookOpen />    },
  { label: "Certificates",      value: "9",  icon: <FiAward />       },
];

const weeklyData: WeeklyPoint[] = [
  { week: "W1", completed: 1 },
  { week: "W2", completed: 3 },
  { week: "W3", completed: 2 },
  { week: "W4", completed: 4 },
  { week: "W5", completed: 1 },
  { week: "W6", completed: 3 },
  { week: "W7", completed: 5 },
  { week: "W8", completed: 2 },
];

// ── Donut SVG Chart ───────────────────────────────────────
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
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#0f9d6e"
        strokeWidth="14"
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

// ── Helpers ───────────────────────────────────────────────
const statusIcon: Record<CourseStatus, React.ReactElement> = {
  completed:  <FiCheckCircle />,
  inprogress: <FiClock />,
  notstarted: <FiBookOpen />,
};

const statusIconClass: Record<CourseStatus, string> = {
  completed:  styles.iconPass,
  inprogress: styles.iconWarning,
  notstarted: styles.iconNeutral,
};

const progressBarClass: Record<CourseStatus, string> = {
  completed:  styles.barPass,
  inprogress: styles.barWarning,
  notstarted: styles.barNeutral,
};

const progressLabelClass: Record<CourseStatus, string> = {
  completed:  styles.labelPass,
  inprogress: styles.labelWarning,
  notstarted: styles.labelNeutral,
};

// ── Helper: map Supabase status string → CourseStatus ────
const getStatus = (dbStatus: string): CourseStatus => {
  const s = (dbStatus ?? "").toLowerCase();
  if (s === "completed")  return "completed";
  if (s === "published")  return "completed";   // published = done
  if (s === "inprogress" || s === "in_progress" || s === "draft") return "inprogress";
  return "notstarted";
};

// ── Helper: progress % from status ───────────────────────
const getProgress = (dbStatus: string): number => {
  const s = (dbStatus ?? "").toLowerCase();
  if (s === "completed" || s === "published") return 100;
  if (s === "inprogress" || s === "in_progress" || s === "draft") return 50;
  return 0;
};

// ── Component ─────────────────────────────────────────────
const CourseCompletion = () => {
  const [visibleCount, setVisibleCount] = useState<number>(4);

  // ✅ Single courses state — fetched from Supabase
  const [courseList, setCourseList] = useState<CourseItem[]>([]);
  const [loading, setLoading]       = useState<boolean>(true);

  useEffect(() => {
    getCourses();
  }, []);

  async function getCourses() {
    setLoading(true);
    const { data, error } = await SupabaseClient
      .from("course")
      .select("id, title, description, category, thumbnail_url, status, duration, created_at");

    if (error) {
      console.error("Supabase error:", error);
    } else {
      const mapped: CourseItem[] = (data ?? []).map((item: any) => ({
        id:            String(item.id),
        title:         item.title ?? "Untitled",
        description:   item.description ?? "",
        category:      item.category ?? "Uncategorized",
        thumbnail_url: item.thumbnail_url ?? "",
        dbStatus:      item.status ?? "",
        status:        getStatus(item.status ?? ""),
        duration:      item.duration ?? null,
        created_at:    item.created_at ?? "",
      }));
      setCourseList(mapped);
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>

      {/* Stat cards */}
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

      {/* Charts row */}
      <div className={styles.chartsRow}>

        {/* Donut chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Overall completion</h3>
          <div className={styles.donutWrap}>
            <DonutChart percent={67} />
          </div>
          <div className={styles.radialLegend}>
            <span className={styles.legendDot} style={{ background: "#0f9d6e" }} />
            <span className={styles.legendLabel}>Completed (12)</span>
            <span className={styles.legendDot} style={{ background: "#e8e4d9", border: "1.5px solid #c9c4b8" }} />
            <span className={styles.legendLabel}>Remaining (6)</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className={`${styles.chartCard} ${styles.chartCardWide}`}>
          <h3 className={styles.chartTitle}>Courses completed per week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={weeklyData}
              barSize={28}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#ece9e0" strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9b958c", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9b958c", fontSize: 12 }}
                allowDecimals={false}
              />
              <Bar dataKey="completed">
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.completed >= 4 ? "#0f9d6e" : "#b8ddd0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Course list — dynamic from Supabase */}
      <div className={styles.historySection}>
        <h3 className={styles.historyTitle}>Course history</h3>

        {loading ? (
          <p style={{ color: "#9b958c", fontSize: 14 }}>Loading courses...</p>
        ) : courseList.length === 0 ? (
          <p style={{ color: "#9b958c", fontSize: 14 }}>No courses found.</p>
        ) : (
          <>
            <div className={styles.historyList}>
              {courseList.slice(0, visibleCount).map((course) => (
                <div key={course.id} className={styles.courseCard}>
                  {/* Thumbnail or fallback icon */}
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
                    <span className={styles.courseCategory}>
                      {course.category}
                      {course.duration ? ` · ${course.duration}` : ""}
                    </span>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={`${styles.progressBarFill} ${progressBarClass[course.status]}`}
                        style={{ width: `${getProgress(course.dbStatus)}%` }}
                      />
                    </div>
                  </div>

                  <span className={`${styles.progressLabel} ${progressLabelClass[course.status]}`}>
                    {course.dbStatus}
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