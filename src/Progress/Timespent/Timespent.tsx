import React, { useEffect, useMemo, useState, useRef } from "react";
import "./Timespent.css";

/* =========================================================================
   TIME SPENT ANALYTICS
   A self-contained, dependency-free dashboard component for an e-learning
   product. Drop the .tsx and .css file into your project — no chart
   library or icon package required.
   ========================================================================= */

/* ---------------------------------- Types -------------------------------- */

type Period = "day" | "week" | "month";
type AccentColor = "blue" | "green";

interface CourseTime {
  id: string;
  name: string;
  hours: number;
  color: AccentColor;
}

interface StudySession {
  id: string;
  course: string;
  date: Date;
  minutes: number;
  type: "Video Lecture" | "Reading" | "Quiz" | "Coding Exercise" | "Practice";
}

/* ----------------------------- Helper functions --------------------------- */

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setHours(9 + (n % 5), 15, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

const formatHM = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* --------------------------------- Mock data ------------------------------ */

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Hours logged Mon → Sun. Today is Thursday; Fri–Sun haven't happened yet.
const dailyHours = [1.25, 0.75, 2.25, 1.75, 0, 0, 0];
const TODAY_INDEX = 3;

// Last 8 weeks of total hours, the final entry is the current (in-progress) week.
const weeklyHours = [7.5, 8.25, 6.75, 9.0, 7.25, 8.5, 9.75, 6.0];
const WEEK_TAB_LABELS = ["W-7", "W-6", "W-5", "W-4", "W-3", "W-2", "W-1", "This wk"];

// Last 6 months of total hours, the final entry is the current (in-progress) month.
const monthlyHours = [29.5, 33.25, 31.0, 35.5, 30.75, 32.5];
const MONTH_TAB_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const courses: CourseTime[] = [
  { id: "react-ts", name: "React & TypeScript Mastery", hours: 11.17, color: "blue" },
  { id: "ui-ux", name: "UI/UX Design Principles", hours: 8.75, color: "green" },
  { id: "dsa-py", name: "Data Structures in Python", hours: 7.33, color: "blue" },
  { id: "node-api", name: "Node.js API Design", hours: 5.25, color: "green" },
];

const sessions: StudySession[] = [
  { id: "s1", course: "React & TypeScript Mastery", date: daysAgo(0), minutes: 105, type: "Coding Exercise" },
  { id: "s2", course: "Data Structures in Python", date: daysAgo(0), minutes: 40, type: "Quiz" },
  { id: "s3", course: "UI/UX Design Principles", date: daysAgo(1), minutes: 135, type: "Video Lecture" },
  { id: "s4", course: "React & TypeScript Mastery", date: daysAgo(1), minutes: 50, type: "Reading" },
  { id: "s5", course: "Node.js API Design", date: daysAgo(2), minutes: 80, type: "Coding Exercise" },
  { id: "s6", course: "UI/UX Design Principles", date: daysAgo(3), minutes: 30, type: "Practice" },
  { id: "s7", course: "Data Structures in Python", date: daysAgo(4), minutes: 95, type: "Video Lecture" },
  { id: "s8", course: "React & TypeScript Mastery", date: daysAgo(6), minutes: 60, type: "Quiz" },
  { id: "s9", course: "Node.js API Design", date: daysAgo(8), minutes: 45, type: "Reading" },
  { id: "s10", course: "UI/UX Design Principles", date: daysAgo(11), minutes: 70, type: "Practice" },
];

// 12 weeks × 7 days calendar heatmap, intensity 0–4. Built deterministically
// (no Math.random) so the page renders identically every time.
const buildHeatmap = (): number[] => {
  const cells: number[] = [];
  for (let w = 0; w < 12; w++) {
    for (let d = 0; d < 7; d++) {
      const weekendDip = d >= 5 ? 0.45 : 1;
      const trend = 0.55 + (w / 11) * 0.6;
      const wave = Math.sin((w * 7 + d) / 4.5) * 0.5 + 0.5;
      const level = Math.min(4, Math.round(trend * weekendDip * wave * 4));
      cells.push(level);
    }
  }
  return cells;
};
const heatmapCells = buildHeatmap();

// 24-hour focus ring — relative study intensity by hour of day.
const hourlyFocus = [
  2, 1, 0, 0, 0, 0, 1, 3, 5, 6, 7, 6, 5, 6, 7, 6, 7, 8, 10, 10, 9, 6, 3, 2,
];

const streakDays = [true, true, true, true, true, false, false]; // Mon–Sun, this week so far
const CURRENT_STREAK = 9;
const LONGEST_STREAK = 14;

/* ---------------------------------- Icons --------------------------------- */

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
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
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
};

/* -------------------------------- Subcomponents ---------------------------- */

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: AccentColor;
  delay?: number;
}> = ({ label, value, sub, icon, accent, delay = 0 }) => (
  <div className="card stat-card" style={{ animationDelay: `${delay}ms` }}>
    <div className="stat-card__top">
      <span className="stat-card__label">{label}</span>
      {icon && (
        <span className={`stat-card__icon ${accent ? `accent-${accent}` : ""}`}>{icon}</span>
      )}
    </div>
    <div className="stat-card__value">{value}</div>
    {sub && <div className="stat-card__sub">{sub}</div>}
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
              title={`${labels[i]}: ${formatHM(v * 60)}`}
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
  maxHours: number;
  mounted: boolean;
  dimmed: boolean;
  delay: number;
}> = ({ course, maxHours, mounted, dimmed, delay }) => (
  <div className={`course-row ${dimmed ? "is-dimmed" : ""}`} style={{ animationDelay: `${delay}ms` }}>
    <span className="course-row__name">{course.name}</span>
    <div className="course-row__track">
      <div
        className={`course-row__fill accent-${course.color}-bg`}
        style={{ width: mounted ? `${(course.hours / maxHours) * 100}%` : "0%" }}
      />
    </div>
    <span className="course-row__value">{formatHM(course.hours * 60)}</span>
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
        7–9
      </text>
      <text x={center} y={center + 16} textAnchor="middle" className="focus-ring__small">
        PM peak
      </text>
    </svg>
  );
};

/* ----------------------------------- Main --------------------------------- */

const TimeSpentAnalytics: React.FC = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [period, setPeriod] = useState<Period>("day");
  const [mounted, setMounted] = useState(false);

  const [dateRange, setDateRange] = useState("7d");
  const [courseFilter, setCourseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Ref to the scrollable main content area. The sidebar lives OUTSIDE this
  // element, so scrolling this ref never moves/scrolls the sidebar.
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Handles sidebar nav clicks ourselves instead of letting the browser's
  // native "#id" anchor-jump behaviour run. The native behaviour scrolls the
  // nearest scrollable ancestor of the target — if that ancestor wraps both
  // the sidebar and the main content, the sidebar appears to "scroll" too.
  // By calling preventDefault() and scrolling `.tsa-main` directly, only the
  // content area moves and the sidebar stays perfectly static.
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const container = mainRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`#${id}`);
    if (!target) return;
    const top = target.offsetTop - container.offsetTop;
    container.scrollTo({ top, behavior: "smooth" });
  };

  const chartData = useMemo(() => {
    if (period === "day") return { values: dailyHours, labels: WEEK_LABELS, highlight: TODAY_INDEX };
    if (period === "week") return { values: weeklyHours, labels: WEEK_TAB_LABELS, highlight: weeklyHours.length - 1 };
    return { values: monthlyHours, labels: MONTH_TAB_LABELS, highlight: monthlyHours.length - 1 };
  }, [period]);

  const maxCourseHours = Math.max(...courses.map((c) => c.hours));
  const monthTotal = courses.reduce((s, c) => s + c.hours, 0);

  const rangeDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "month" ? 31 : 9999;

  const filteredSessions = sessions
    .filter((s) => (courseFilter === "all" ? true : s.course === courseFilter))
    .filter((s) => (categoryFilter === "all" ? true : s.type === categoryFilter))
    .filter((s) => {
      const diff = (Date.now() - s.date.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= rangeDays;
    });

  const weeklyGoalHours = 20;
  const weeklyActualHours = dailyHours.reduce((a, b) => a + b, 0);
  const goalPct = Math.min(100, Math.round((weeklyActualHours / weeklyGoalHours) * 100));

  const navItems: { id: string; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "trends", label: "Trends" },
    { id: "courses", label: "Courses" },
    { id: "calendar", label: "Calendar" },
    { id: "sessions", label: "Sessions" },
    { id: "insights", label: "Insights" },
  ];

  return (
    <div className="tsa-root" data-theme={theme}>
      <div className="tsa-shell">
        {/* ---------- Sidebar (static — never scrolls) ---------- */}
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
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            aria-label="Toggle dark mode"
          >
            {theme === "light" ? <Icon.Moon /> : <Icon.Sun />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
        </aside>

        {/* ---------- Main (only this area scrolls) ---------- */}
        <div className="tsa-main" ref={mainRef}>
          <header className="tsa-topbar" id="overview">
            <div>
              <h1>Time Spent Analytics</h1>
              <p>Track your study habits and stay on pace with your goals.</p>
            </div>

            <div className="tsa-filters">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} aria-label="Date range">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>
              <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Course filter">
                <option value="all">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category filter">
                <option value="all">All activity types</option>
                <option value="Video Lecture">Video Lecture</option>
                <option value="Reading">Reading</option>
                <option value="Quiz">Quiz</option>
                <option value="Coding Exercise">Coding Exercise</option>
                <option value="Practice">Practice</option>
              </select>
            </div>
          </header>

          {/* ---------- Hero stats ---------- */}
          <section className="tsa-grid stats-grid">
            <StatCard label="Today" value={formatHM(dailyHours[TODAY_INDEX] * 60)} sub="1 session logged" icon={<Icon.Clock />} accent="blue" delay={0} />
            <StatCard label="This week" value={formatHM(weeklyActualHours * 60)} sub={`Goal: ${weeklyGoalHours}h`} icon={<Icon.Trend />} accent="green" delay={40} />
            <StatCard label="This month" value={formatHM(monthTotal * 60)} sub={`${courses.length} active courses`} icon={<Icon.Book />} accent="blue" delay={80} />
            <StatCard label="Current streak" value={`${CURRENT_STREAK} days`} sub="Study today to keep it going" icon={<Icon.Flame />} accent="green" delay={120} />
          </section>

          {/* ---------- Charts + course distribution ---------- */}
          <section className="tsa-grid two-col" id="trends">
            <div className="card chart-card">
              <div className="card__head">
                <h2>Study hours</h2>
                <div className="tab-switch">
                  {(["day", "week", "month"] as Period[]).map((p) => (
                    <button
                      key={p}
                      className={period === p ? "is-active" : ""}
                      onClick={() => setPeriod(p)}
                    >
                      {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
                    </button>
                  ))}
                </div>
              </div>
              <BarChart values={chartData.values} labels={chartData.labels} mounted={mounted} highlightIndex={chartData.highlight} />
            </div>

            <div className="card streak-card">
              <div className="card__head">
                <h2>Streak</h2>
                <span className="pill accent-green">{LONGEST_STREAK}d best</span>
              </div>
              <div className="streak-card__big">
                <Icon.Flame />
                <span>{CURRENT_STREAK} days</span>
              </div>
              <p className="streak-card__copy">Study today to keep it going.</p>
              <div className="streak-card__days">
                {WEEK_LABELS.map((label, i) => (
                  <div key={label} className={`streak-dot ${streakDays[i] ? "is-filled" : ""} ${i === TODAY_INDEX ? "is-today" : ""}`}>
                    {label[0]}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- Course distribution ---------- */}
          <section className="card" id="courses">
            <div className="card__head">
              <h2>Time by course</h2>
              <span className="card__head-meta">{formatHM(monthTotal * 60)} total this month</span>
            </div>
            <div className="course-list">
              {courses.map((c, i) => (
                <CourseRow
                  key={c.id}
                  course={c}
                  maxHours={maxCourseHours}
                  mounted={mounted}
                  dimmed={courseFilter !== "all" && courseFilter !== c.name}
                  delay={i * 60}
                />
              ))}
            </div>
          </section>

          {/* ---------- Calendar heatmap ---------- */}
          <section className="card" id="calendar">
            <div className="card__head">
              <h2>Activity calendar</h2>
              <span className="card__head-meta">Last 12 weeks</span>
            </div>
            <Heatmap cells={heatmapCells} />
          </section>

          {/* ---------- Session metrics + focus ring + goal ---------- */}
          <section className="tsa-grid three-col">
            <div className="card">
              <div className="card__head"><h2>Session metrics</h2></div>
              <div className="metric-row">
                <span>Average session</span>
                <strong>52m</strong>
              </div>
              <div className="metric-row">
                <span>Longest session</span>
                <strong>2h 15m</strong>
              </div>
              <div className="metric-row">
                <span>Daily average</span>
                <strong>1h 25m</strong>
              </div>
              <div className="metric-row">
                <span>Longest streak</span>
                <strong>{LONGEST_STREAK} days</strong>
              </div>
            </div>

            <div className="card focus-card" id="insights">
              <div className="card__head"><h2>Peak focus hours</h2></div>
              <FocusRing values={hourlyFocus} />
              <p className="focus-card__copy">You study most effectively between <strong>7–9 PM</strong>.</p>
            </div>

            <div className="card goal-card">
              <div className="card__head"><h2>Weekly goal</h2></div>
              <div className="goal-card__ring" style={{ "--pct": `${goalPct}%` } as React.CSSProperties}>
                <div className="goal-card__ring-inner">
                  <strong>{goalPct}%</strong>
                  <span>of {weeklyGoalHours}h</span>
                </div>
              </div>
              <p className="goal-card__copy">
                {formatHM(weeklyActualHours * 60)} logged · {formatHM((weeklyGoalHours - weeklyActualHours) * 60)} to go
              </p>
            </div>
          </section>

          {/* ---------- Recent sessions ---------- */}
          <section className="card" id="sessions">
            <div className="card__head">
              <h2>Recent sessions</h2>
              <button className="btn-outline"><Icon.Plus /> Add entry</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Date</th>
                    <th>Activity</th>
                    <th className="align-right">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 && (
                    <tr><td colSpan={4} className="empty-row">No sessions match these filters yet.</td></tr>
                  )}
                  {filteredSessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.course}</td>
                      <td className="mono">{formatDate(s.date)}</td>
                      <td><span className="tag">{s.type}</span></td>
                      <td className="align-right mono">{formatHM(s.minutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------- Insights ---------- */}
          <section className="tsa-grid three-col">
            <div className="card insight-card">
              <span className="insight-card__icon accent-green"><Icon.Bulb /></span>
              <p>You study most effectively between <strong>7–9 PM</strong> — consider scheduling harder topics then.</p>
            </div>
            <div className="card insight-card">
              <span className="insight-card__icon accent-blue"><Icon.Target /></span>
              <p>You're <strong>{goalPct}%</strong> toward your weekly goal with time left to close the gap.</p>
            </div>
            <div className="card insight-card">
              <span className="insight-card__icon accent-green"><Icon.Flame /></span>
              <p>You're on a <strong>{CURRENT_STREAK}-day streak</strong> — {LONGEST_STREAK - CURRENT_STREAK} more days ties your best.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TimeSpentAnalytics;