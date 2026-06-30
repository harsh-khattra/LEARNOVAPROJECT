import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import "./Timespent.css";
import { SupabaseClient as supabase } from "../../Helper/Supabase";

/* =========================================================================
   TIME SPENT ANALYTICS — Fully Dynamic Version
   All data fetched from watch_sessions table in Supabase.
   ========================================================================= */

type Period = "day" | "week" | "month";
type AccentColor = "blue" | "green";

interface CourseTime {
  id: string;
  name: string;
  minutes: number;
  color: AccentColor;
}

interface StudySession {
  id: string;
  course: string;
  date: Date;
  minutes: number;
}

interface WatchSessionRow {
  id: number;
  student_id: string;
  course_id: string;
  lesson_id: string | null;
  seconds_watched: number;
  watched_at: string;
  courses?: { title: string } | null;
}

const formatHM = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h <= 0 && m === 0) return "0m";
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ACCENT_COLORS: AccentColor[] = ["blue", "green"];

const Icon = {
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2c1 3-3 4-3 7.5a3 3 0 1 0 6 0c0-1-.3-1.8-.8-2.5.8.3 2.8 1.8 2.8 5.5A5.8 5.8 0 0 1 11.2 18 5.8 5.8 0 0 1 6 12.2C6 7 12 6 12 2Z" strokeLinejoin="round" />
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" />
    </svg>
  ),
  Trend: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 16l5-5 4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" strokeLinecap="round" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.7 8.7 0 1 0 20 14.5Z" />
    </svg>
  ),
  Bulb: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 18h6M10 21h4M7 9a5 5 0 1 1 8.6 3.5c-.8.8-1.6 1.5-1.6 3.5h-6c0-2-.8-2.7-1.6-3.5A5 5 0 0 1 7 9Z" strokeLinejoin="round" />
    </svg>
  ),
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5.5A2 2 0 0 1 6 4h6v16H6a2 2 0 0 1-2-2Z" strokeLinejoin="round" />
      <path d="M20 5.5A2 2 0 0 0 18 4h-6v16h6a2 2 0 0 0 2-2Z" strokeLinejoin="round" />
    </svg>
  ),
  Spinner: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tsa-spinner">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  ),
};

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: AccentColor;
  delay?: number;
  loading?: boolean;
}> = ({ label, value, sub, icon, accent, delay = 0, loading }) => (
  <div className="card stat-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="stat-card__top">
      <span className="stat-card__label">{label}</span>
      {icon && (
        <span className={`stat-card__icon ${accent ? `accent-${accent}` : ""}`}>{icon}</span>
      )}
    </div>
    {loading ? (
      <div className="stat-card__value tsa-loading-text">—</div>
    ) : (
      <div className="stat-card__value">{value}</div>
    )}
    {sub && <div className="stat-card__sub">{loading ? "Loading..." : sub}</div>}
  </div>
);

const BarChart: React.FC<{
  values: number[];
  labels: string[];
  mounted: boolean;
  highlightIndex?: number;
}> = ({ values, labels, mounted, highlightIndex }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="barchart">
      {values.map((v, i) => (
        <div className="barchart__col" key={i}>
          <div className="barchart__track">
            <div
              className={`barchart__bar ${i === highlightIndex ? "is-today" : ""}`}
              style={{ height: mounted ? `${(v / max) * 100}%` : "0%" }}
              title={`${labels[i]}: ${formatHM(v)}`}
            />
          </div>
          <span className="barchart__label">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
};

const CourseRow: React.FC<{
  course: CourseTime;
  maxMinutes: number;
  mounted: boolean;
  dimmed: boolean;
  delay: number;
}> = ({ course, maxMinutes, mounted, dimmed, delay }) => (
  <div className={`course-row ${dimmed ? "is-dimmed" : ""}`} style={{ animationDelay: `${delay}ms` }}>
    <span className="course-row__name">{course.name}</span>
    <div className="course-row__track">
      <div
        className={`course-row__fill accent-${course.color}-bg`}
        style={{ width: mounted ? `${(course.minutes / maxMinutes) * 100}%` : "0%" }}
      />
    </div>
    <span className="course-row__value">{formatHM(course.minutes)}</span>
  </div>
);

const Heatmap: React.FC<{ cells: number[] }> = ({ cells }) => {
  const weeks = 12;
  const days = 7;
  const cols: number[][] = [];
  for (let w = 0; w < weeks; w++) cols.push(cells.slice(w * days, w * days + days));

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {cols.map((col, ci) => (
          <div className="heatmap__col" key={ci}>
            {col.map((level, ri) => (
              <div
                key={ri}
                className={`heatmap__cell level-${level}`}
                title={`Activity level ${level} of 4`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap__legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`heatmap__cell level-${l}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

const FocusRing: React.FC<{ values: number[] }> = ({ values }) => {
  const max = Math.max(...values, 1);
  const size = 220;
  const center = size / 2;
  const innerR = 46;
  const outerR = 100;

  const peakHour = values.indexOf(Math.max(...values));
  const peakLabel =
    peakHour < 12
      ? `${peakHour === 0 ? 12 : peakHour} AM`
      : `${peakHour === 12 ? 12 : peakHour - 12} PM`;

  const segments = values.map((v, i) => {
    const a0 = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / 24) * Math.PI * 2 - Math.PI / 2;
    const r = innerR + (v / max) * (outerR - innerR);
    const x0 = center + innerR * Math.cos(a0);
    const y0 = center + innerR * Math.sin(a0);
    const x1 = center + r * Math.cos(a0);
    const y1 = center + r * Math.sin(a0);
    const x2 = center + r * Math.cos(a1);
    const y2 = center + r * Math.sin(a1);
    const x3 = center + innerR * Math.cos(a1);
    const y3 = center + innerR * Math.sin(a1);
    const isPeak = v / max > 0.85;
    return (
      <path
        key={i}
        d={`M${x0},${y0} L${x1},${y1} L${x2},${y2} L${x3},${y3} Z`}
        className={isPeak ? "focus-ring__seg is-peak" : "focus-ring__seg"}
      />
    );
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="focus-ring">
      {segments}
      <circle cx={center} cy={center} r={innerR - 2} className="focus-ring__hub" />
      <text x={center} y={center - 4} textAnchor="middle" className="focus-ring__big">
        {peakLabel}
      </text>
      <text x={center} y={center + 16} textAnchor="middle" className="focus-ring__small">
        peak
      </text>
    </svg>
  );
};

/* ----------------------------------- Main --------------------------------- */

const TimeSpentAnalytics: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [period, setPeriod] = useState<Period>("day");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState("7d");
  const [courseFilter, setCourseFilter] = useState("all");

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [monthMinutes, setMonthMinutes] = useState(0);
  const [monthActiveCourses, setMonthActiveCourses] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [streakDays, setStreakDays] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const [dailyMinutesArr, setDailyMinutesArr] = useState<number[]>(Array(7).fill(0));
  const [weeklyMinutesArr, setWeeklyMinutesArr] = useState<number[]>(Array(8).fill(0));
  const [monthlyMinutesArr, setMonthlyMinutesArr] = useState<number[]>(Array(6).fill(0));
  const [monthTabLabels, setMonthTabLabels] = useState<string[]>(["", "", "", "", "", ""]);

  const [courseList, setCourseList] = useState<CourseTime[]>([]);
  const [heatmapCells, setHeatmapCells] = useState<number[]>(Array(84).fill(0));
  const [hourlyFocus, setHourlyFocus] = useState<number[]>(Array(24).fill(0));

  const [avgSessionMin, setAvgSessionMin] = useState(0);
  const [longestSessionMin, setLongestSessionMin] = useState(0);
  const [dailyAvgMin, setDailyAvgMin] = useState(0);

  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [allCourseNames, setAllCourseNames] = useState<string[]>([]);

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  /* ── MAIN DATA FETCH ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // ── Fetch watch_sessions using correct column names ──
      const { data: rows, error } = await supabase
        .from("watch_sessions")
        .select("id, student_id, course_id, lesson_id, seconds_watched, watched_at")
        .eq("student_id", user.id)
        .gte("watched_at", sixMonthsAgo.toISOString())
        .order("watched_at", { ascending: false });

      if (error) {
        console.error("watch_sessions fetch error:", error);
        setLoading(false);
        return;
      }

      if (!rows || rows.length === 0) {
        setLoading(false);
        return;
      }

      // ── Fetch course titles ──
      const uniqueCourseIds = [...new Set((rows as any[]).map((r: any) => r.course_id))];
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", uniqueCourseIds);

      const courseNameMap: Record<string, string> = {};
      (coursesData ?? []).forEach((c: any) => {
        courseNameMap[c.id] = c.title;
      });

      const typedRows: WatchSessionRow[] = (rows as any[]).map((r: any) => ({
        ...r,
        courses: { title: courseNameMap[r.course_id] ?? "Unknown Course" },
      }));

      const now = new Date();

      // ── TODAY ──
      const todayStart = startOfDay(now);
      const todayRows = typedRows.filter(r => new Date(r.watched_at) >= todayStart);
      setTodayMinutes(todayRows.reduce((s, r) => s + r.seconds_watched, 0) / 60);

      // ── THIS WEEK ──
      const weekStart = getMonday(now);
      const weekRows = typedRows.filter(r => new Date(r.watched_at) >= weekStart);
      setWeekMinutes(weekRows.reduce((s, r) => s + r.seconds_watched, 0) / 60);

      // ── THIS MONTH ──
      const monthStart = startOfMonth(now);
      const monthRows = typedRows.filter(r => new Date(r.watched_at) >= monthStart);
      setMonthMinutes(monthRows.reduce((s, r) => s + r.seconds_watched, 0) / 60);
      setMonthActiveCourses(new Set(monthRows.map(r => r.course_id)).size);

      // ── STREAK ──
      const studyDaySet = new Set(
        typedRows.map(r => {
          const d = new Date(r.watched_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );

      let streak = 0;
      const check = new Date(now);
      while (true) {
        const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
        if (studyDaySet.has(key)) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
      setCurrentStreak(streak);

      const sortedDays = Array.from(studyDaySet)
        .map(k => {
          const [y, mo, d] = k.split("-").map(Number);
          return new Date(y, mo, d).getTime();
        })
        .sort((a, b) => a - b);

      let maxStreak = 0, curRun = 0;
      let prevTs: number | null = null;
      for (const ts of sortedDays) {
        curRun = (prevTs !== null && ts - prevTs === 86400000) ? curRun + 1 : 1;
        if (curRun > maxStreak) maxStreak = curRun;
        prevTs = ts;
      }
      setLongestStreak(Math.max(maxStreak, streak));

      const thisMonday = weekStart.getTime();
      setStreakDays(
        WEEK_LABELS.map((_, i) => {
          const day = new Date(thisMonday + i * 86400000);
          return studyDaySet.has(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`);
        })
      );

      // ── DAILY CHART ──
      setDailyMinutesArr(
        WEEK_LABELS.map((_, i) => {
          const dayStart = new Date(thisMonday + i * 86400000);
          const dayEnd = new Date(dayStart.getTime() + 86400000);
          return typedRows
            .filter(r => { const t = new Date(r.watched_at).getTime(); return t >= dayStart.getTime() && t < dayEnd.getTime(); })
            .reduce((s, r) => s + r.seconds_watched, 0) / 60;
        })
      );

      // ── WEEKLY CHART ──
      const weeklyArr: number[] = [];
      for (let w = 7; w >= 0; w--) {
        const wStart = new Date(weekStart.getTime() - w * 7 * 86400000);
        const wEnd = new Date(wStart.getTime() + 7 * 86400000);
        weeklyArr.push(
          typedRows
            .filter(r => { const t = new Date(r.watched_at).getTime(); return t >= wStart.getTime() && t < wEnd.getTime(); })
            .reduce((s, r) => s + r.seconds_watched, 0) / 60
        );
      }
      setWeeklyMinutesArr(weeklyArr);

      // ── MONTHLY CHART ──
      const monthlyArr: number[] = [];
      const monthLabels: string[] = [];
      for (let m = 5; m >= 0; m--) {
        const mDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const mStart = new Date(mDate.getFullYear(), mDate.getMonth(), 1);
        const mEnd = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 1);
        monthLabels.push(mDate.toLocaleDateString("en-US", { month: "short" }));
        monthlyArr.push(
          typedRows
            .filter(r => { const t = new Date(r.watched_at).getTime(); return t >= mStart.getTime() && t < mEnd.getTime(); })
            .reduce((s, r) => s + r.seconds_watched, 0) / 60
        );
      }
      setMonthlyMinutesArr(monthlyArr);
      setMonthTabLabels(monthLabels);

      // ── TIME BY COURSE ──
      const courseMap: Record<string, { name: string; minutes: number }> = {};
      for (const r of typedRows) {
        const name = (r.courses as any)?.title ?? "Unknown Course";
        if (!courseMap[r.course_id]) courseMap[r.course_id] = { name, minutes: 0 };
        courseMap[r.course_id].minutes += r.seconds_watched / 60;
      }
      const sortedCourses: CourseTime[] = Object.entries(courseMap)
        .sort((a, b) => b[1].minutes - a[1].minutes)
        .map(([id, v], i) => ({ id, name: v.name, minutes: v.minutes, color: ACCENT_COLORS[i % 2] }));
      setCourseList(sortedCourses);
      setAllCourseNames(sortedCourses.map(c => c.name));

      // ── HEATMAP ──
      const heatStart = new Date(now.getTime() - 84 * 86400000);
      const dayMinMap: Record<string, number> = {};
      for (const r of typedRows) {
        const d = new Date(r.watched_at);
        if (d < heatStart) continue;
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dayMinMap[key] = (dayMinMap[key] ?? 0) + r.seconds_watched / 60;
      }
      const maxDayMin = Math.max(...Object.values(dayMinMap), 1);
      const cells: number[] = [];
      for (let i = 83; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const mins = dayMinMap[key] ?? 0;
        cells.push(Math.min(4, Math.ceil((mins / maxDayMin) * 4)));
      }
      const startDow = new Date(now.getTime() - 83 * 86400000).getDay();
      const mondayOffset = startDow === 0 ? 6 : startDow - 1;
      setHeatmapCells([...Array(mondayOffset).fill(0), ...cells.reverse()].slice(0, 84));

      // ── HOURLY FOCUS ──
      const hourArr = Array(24).fill(0);
      for (const r of typedRows) hourArr[new Date(r.watched_at).getHours()] += r.seconds_watched / 60;
      setHourlyFocus(hourArr);

      // ── SESSION METRICS ──
      const sessionMap: Record<string, number> = {};
      for (const r of typedRows) {
        const d = new Date(r.watched_at);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${r.course_id}`;
        sessionMap[key] = (sessionMap[key] ?? 0) + r.seconds_watched / 60;
      }
      const sessionMins = Object.values(sessionMap);
      if (sessionMins.length > 0) {
        setAvgSessionMin(sessionMins.reduce((a, b) => a + b, 0) / sessionMins.length);
        setLongestSessionMin(Math.max(...sessionMins));
      }
      const totalAllMin = typedRows.reduce((s, r) => s + r.seconds_watched, 0) / 60;
      setDailyAvgMin(studyDaySet.size > 0 ? totalAllMin / studyDaySet.size : 0);

      // ── RECENT SESSIONS ──
      setRecentSessions(
        typedRows.slice(0, 50).map(r => ({
          id: String(r.id),
          course: (r.courses as any)?.title ?? "Unknown Course",
          date: new Date(r.watched_at),
          minutes: r.seconds_watched / 60,
        }))
      );

    } catch (err) {
      console.error("TimeSpent fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── DERIVED ── */
  const todayDayIndex = useMemo(() => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  }, []);

  const WEEK_TAB_LABELS = ["W-7", "W-6", "W-5", "W-4", "W-3", "W-2", "W-1", "This wk"];

  const chartData = useMemo(() => {
    if (period === "day") return { values: dailyMinutesArr, labels: WEEK_LABELS, highlight: todayDayIndex };
    if (period === "week") return { values: weeklyMinutesArr, labels: WEEK_TAB_LABELS, highlight: weeklyMinutesArr.length - 1 };
    return { values: monthlyMinutesArr, labels: monthTabLabels, highlight: monthlyMinutesArr.length - 1 };
  }, [period, dailyMinutesArr, weeklyMinutesArr, monthlyMinutesArr, monthTabLabels, todayDayIndex]);

  const maxCourseMinutes = Math.max(...courseList.map(c => c.minutes), 1);
  const monthTotal = courseList.reduce((s, c) => s + c.minutes, 0);
  const weeklyGoalMinutes = 20 * 60;
  const goalPct = Math.min(100, Math.round((weekMinutes / weeklyGoalMinutes) * 100));

  const rangeDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "month" ? 31 : 9999;
  const filteredSessions = recentSessions
    .filter(s => courseFilter === "all" || s.course === courseFilter)
    .filter(s => (Date.now() - s.date.getTime()) / (1000 * 60 * 60 * 24) <= rangeDays)
    .slice(0, 20);

  const peakHour = hourlyFocus.indexOf(Math.max(...hourlyFocus, 1));
  const peakHourLabel =
    peakHour < 12
      ? `${peakHour === 0 ? 12 : peakHour} AM`
      : `${peakHour === 12 ? 12 : peakHour - 12} PM`;

  /* ── SIDEBAR NAV ── */
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const container = mainRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    container.scrollTo({ top: target.offsetTop - container.offsetTop, behavior: "smooth" });
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "trends", label: "Trends" },
    { id: "courses", label: "Courses" },
    { id: "calendar", label: "Calendar" },
    { id: "sessions", label: "Sessions" },
    { id: "insights", label: "Insights" },
  ];

  /* ── RENDER ── */
  return (
    <div className="tsa-root" data-theme={theme}>
      <div className="tsa-shell">
        <aside className="tsa-sidebar">
          <div className="tsa-sidebar__brand">
            <span className="tsa-sidebar__mark">◐</span>
            <span>LearnTrack</span>
          </div>
          <nav className="tsa-sidebar__nav">
            {navItems.map((item, i) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={i === 0 ? "is-active" : ""}
                onClick={(e) => handleNavClick(e, item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <button
            className="tsa-theme-toggle"
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? <Icon.Moon /> : <Icon.Sun />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
        </aside>

        <div className="tsa-main" ref={mainRef}>
          <header className="tsa-topbar" id="overview">
            <div>
              <h1>Time Spent Analytics</h1>
              <p>Track your study habits and stay on pace with your goals.</p>
            </div>
            <div className="tsa-filters">
              <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>
              <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                <option value="all">All courses</option>
                {allCourseNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </header>

          <section className="tsa-grid stats-grid">
            <StatCard label="Today" value={formatHM(todayMinutes)} sub={todayMinutes > 0 ? "Active today" : "No sessions yet"} icon={<Icon.Clock />} accent="blue" delay={0} loading={loading} />
            <StatCard label="This week" value={formatHM(weekMinutes)} sub="Goal: 20h" icon={<Icon.Trend />} accent="green" delay={40} loading={loading} />
            <StatCard label="This month" value={formatHM(monthMinutes)} sub={`${monthActiveCourses} active course${monthActiveCourses !== 1 ? "s" : ""}`} icon={<Icon.Book />} accent="blue" delay={80} loading={loading} />
            <StatCard label="Current streak" value={`${currentStreak} day${currentStreak !== 1 ? "s" : ""}`} sub={currentStreak > 0 ? "Study today to keep it going" : "Start your streak today!"} icon={<Icon.Flame />} accent="green" delay={120} loading={loading} />
          </section>

          <section className="tsa-grid two-col" id="trends">
            <div className="card chart-card">
              <div className="card__head">
                <h2>Study hours</h2>
                <div className="tab-switch">
                  {(["day", "week", "month"] as Period[]).map(p => (
                    <button key={p} className={period === p ? "is-active" : ""} onClick={() => setPeriod(p)}>
                      {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>
              {loading ? <div className="tsa-chart-loading"><Icon.Spinner /></div> : (
                <BarChart values={chartData.values} labels={chartData.labels} mounted={mounted} highlightIndex={chartData.highlight} />
              )}
            </div>

            <div className="card streak-card">
              <div className="card__head">
                <h2>Streak</h2>
                {longestStreak > 0 && <span className="pill accent-green">{longestStreak}d best</span>}
              </div>
              <div className="streak-card__big">
                <Icon.Flame />
                <span>{loading ? "—" : `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`}</span>
              </div>
              <p className="streak-card__copy">
                {currentStreak > 0 ? "Study today to keep it going." : "Start learning to build your streak!"}
              </p>
              <div className="streak-card__days">
                {WEEK_LABELS.map((label, i) => (
                  <div key={label} className={`streak-dot ${streakDays[i] ? "is-filled" : ""} ${i === todayDayIndex ? "is-today" : ""}`}>
                    {label[0]}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card" id="courses">
            <div className="card__head">
              <h2>Time by course</h2>
              <span className="card__head-meta">{loading ? "Loading..." : `${formatHM(monthTotal)} total this month`}</span>
            </div>
            {loading ? <div className="tsa-chart-loading"><Icon.Spinner /></div> : courseList.length === 0 ? (
              <p className="empty-row">No watch data yet. Start a course to see time breakdown!</p>
            ) : (
              <div className="course-list">
                {courseList.map((c, i) => (
                  <CourseRow key={c.id} course={c} maxMinutes={maxCourseMinutes} mounted={mounted} dimmed={courseFilter !== "all" && courseFilter !== c.name} delay={i * 60} />
                ))}
              </div>
            )}
          </section>

          <section className="card" id="calendar">
            <div className="card__head">
              <h2>Activity calendar</h2>
              <span className="card__head-meta">Last 12 weeks</span>
            </div>
            <Heatmap cells={heatmapCells} />
          </section>

          <section className="tsa-grid three-col">
            <div className="card">
              <div className="card__head"><h2>Session metrics</h2></div>
              <div className="metric-row"><span>Average session</span><strong>{loading ? "—" : formatHM(avgSessionMin)}</strong></div>
              <div className="metric-row"><span>Longest session</span><strong>{loading ? "—" : formatHM(longestSessionMin)}</strong></div>
              <div className="metric-row"><span>Daily average</span><strong>{loading ? "—" : formatHM(dailyAvgMin)}</strong></div>
              <div className="metric-row"><span>Longest streak</span><strong>{loading ? "—" : `${longestStreak} day${longestStreak !== 1 ? "s" : ""}`}</strong></div>
            </div>

            <div className="card focus-card" id="insights">
              <div className="card__head"><h2>Peak focus hours</h2></div>
              {loading ? <div className="tsa-chart-loading"><Icon.Spinner /></div> : <FocusRing values={hourlyFocus} />}
              <p className="focus-card__copy">
                {hourlyFocus.some(v => v > 0)
                  ? <><strong>{peakHourLabel}</strong> is your peak focus time.</>
                  : "Start studying to discover your peak focus time."}
              </p>
            </div>

            <div className="card goal-card">
              <div className="card__head"><h2>Weekly goal</h2></div>
              <div className="goal-card__ring" style={{ "--pct": `${mounted ? goalPct : 0}%` } as React.CSSProperties}>
                <div className="goal-card__ring-inner">
                  <strong>{loading ? "—" : `${goalPct}%`}</strong>
                  <span>of 20h</span>
                </div>
              </div>
              <p className="goal-card__copy">
                {loading ? "Loading..." : `${formatHM(weekMinutes)} logged · ${formatHM(Math.max(0, weeklyGoalMinutes - weekMinutes))} to go`}
              </p>
            </div>
          </section>

          <section className="card" id="sessions">
            <div className="card__head"><h2>Recent sessions</h2></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th className="align-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={3} className="empty-row">Loading sessions...</td></tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr><td colSpan={3} className="empty-row">No sessions found for these filters.</td></tr>
                  ) : (
                    filteredSessions.map(s => (
                      <tr key={s.id}>
                        <td>{s.course}</td>
                        <td className="mono">{formatDate(s.date)}</td>
                        <td className="align-right mono">{formatHM(s.minutes)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="tsa-grid three-col">
            <div className="card insight-card">
              <span className="insight-card__icon accent-green"><Icon.Bulb /></span>
              <p>
                {hourlyFocus.some(v => v > 0)
                  ? <>You study most at <strong>{peakHourLabel}</strong> — schedule harder topics then.</>
                  : <>Start watching videos to discover your <strong>peak focus time</strong>.</>}
              </p>
            </div>
            <div className="card insight-card">
              <span className="insight-card__icon accent-blue"><Icon.Target /></span>
              <p>
                You're <strong>{goalPct}%</strong> toward your weekly goal
                {goalPct < 100
                  ? <> with <strong>{formatHM(Math.max(0, weeklyGoalMinutes - weekMinutes))}</strong> to go.</>
                  : <> — you've hit your goal this week! 🎉</>}
              </p>
            </div>
            <div className="card insight-card">
              <span className="insight-card__icon accent-green"><Icon.Flame /></span>
              <p>
                {currentStreak > 0
                  ? <>You're on a <strong>{currentStreak}-day streak</strong>
                    {longestStreak > currentStreak
                      ? <> — {longestStreak - currentStreak} more day{longestStreak - currentStreak !== 1 ? "s" : ""} ties your best!</>
                      : <> — that's your best streak yet!</>}
                  </>
                  : <>Start a session today to <strong>begin your streak</strong>!</>}
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TimeSpentAnalytics;