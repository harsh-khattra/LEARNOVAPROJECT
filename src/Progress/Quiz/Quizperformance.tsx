import { useState } from "react";
import {
  FiMoreHorizontal,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiChevronDown,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import styles from "./Quizperformance.module.css";

// ── Types ─────────────────────────────────────────────────
interface QuizStat {
  label: string;
  value: string;
}

type QuizStatus = "pass" | "warning" | "fail";

interface QuizHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  status: QuizStatus;
}

interface ScorePoint {
  attempt: number;
  score: number;
}

// ── Mock data (replace with API data) ────────────────────
const stats: QuizStat[] = [
  { label: "Quizzes taken", value: "8" },
  { label: "Average score", value: "82%" },
  { label: "Best score", value: "98%" },
  { label: "Pass rate", value: "88%" },
];

const scoreTrend: ScorePoint[] = [
  { attempt: 1, score: 62 },
  { attempt: 2, score: 73 },
  { attempt: 3, score: 70 },
  { attempt: 4, score: 81 },
  { attempt: 5, score: 85 },
  { attempt: 6, score: 78 },
  { attempt: 7, score: 91 },
  { attempt: 8, score: 98 },
];

const quizHistory: QuizHistoryItem[] = [
  {
    id: "1",
    title: "Final assessment quiz",
    subtitle: "UI/UX design principles · June 14",
    score: 98,
    status: "pass",
  },
  {
    id: "2",
    title: "Async patterns quiz",
    subtitle: "Node.js API design · June 10",
    score: 92,
    status: "pass",
  },
  {
    id: "3",
    title: "React hooks quiz",
    subtitle: "React & TypeScript mastery · June 6",
    score: 78,
    status: "warning",
  },
  {
    id: "4",
    title: "Data structures quiz",
    subtitle: "Data structures in Python · June 2",
    score: 64,
    status: "fail",
  },
];

// ── Status → icon helper ──────────────────────────────────
const statusIcon: Record<QuizStatus, React.ReactElement> = {
  pass: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  fail: <FiXCircle />,
};

const statusIconClass: Record<QuizStatus, string> = {
  pass: styles.statusPass,
  warning: styles.statusWarning,
  fail: styles.statusFail,
};

const getScoreClass = (score: number) =>
  score >= 70 ? styles.scorePass : styles.scoreFail;

const Quizperformance= () => {
  const [visibleCount, setVisibleCount] = useState(4);

  const handleLoadMore = () => setVisibleCount((prev) => prev + 4);

  return (
    <div className={styles.container}>
      {/* Stat cards */}
      <div className={styles.statsRow}>
        <div className={styles.statsCards}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statCard}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statValue}>{stat.value}</span>
            </div>
          ))}
        </div>
        <button className={styles.menuButton} aria-label="More options">
          <FiMoreHorizontal />
        </button>
      </div>

      {/* Score trend chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Score trend across attempts</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={scoreTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f9d6e" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0f9d6e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e6e3da" strokeDasharray="3 3" />
            <XAxis
              dataKey="attempt"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9b958c", fontSize: 12 }}
              label={{
                value: "Attempt",
                position: "insideBottom",
                offset: -5,
                fill: "#9b958c",
                fontSize: 12,
              }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9b958c", fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
           <Tooltip
  formatter={(value) => {
    const num = typeof value === "number" ? value : Number(value);
    return [`${num}%`, "Score"];
  }}
  labelFormatter={(label) => `Attempt ${label}`}
/>
            <Area
              type="monotone"
              dataKey="score"
              stroke="#0f9d6e"
              strokeWidth={2.5}
              fill="url(#scoreFill)"
              dot={{ r: 4, fill: "#0f9d6e", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quiz history */}
      <div className={styles.historySection}>
        <h3 className={styles.historyTitle}>Quiz history</h3>
        <div className={styles.historyList}>
          {quizHistory.slice(0, visibleCount).map((item) => (
            <div key={item.id} className={styles.historyCard}>
              <span className={`${styles.statusIconWrap} ${statusIconClass[item.status]}`}>
                {statusIcon[item.status]}
              </span>
              <div className={styles.historyText}>
                <span className={styles.historyItemTitle}>{item.title}</span>
                <span className={styles.historyItemSubtitle}>{item.subtitle}</span>
              </div>
              <span className={`${styles.historyScore} ${getScoreClass(item.score)}`}>
                {item.score}%
              </span>
            </div>
          ))}
        </div>

        {visibleCount < quizHistory.length && (
          <button className={styles.loadMoreButton} onClick={handleLoadMore} aria-label="Load more">
            <FiChevronDown />
          </button>
        )}
      </div>
    </div>
  );
};

export default Quizperformance;