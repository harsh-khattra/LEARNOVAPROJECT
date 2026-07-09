import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Enrolledcourses.css";
import { lmsService } from "../../Elearning/lms/services/lmsService";
import type { Course } from "../../Elearning/lms/types/lms";
import { SupabaseClient } from "../../Helper/Supabase";
import { useAuth } from "../../Context/AuthContext";


type TabKey = "enrolled" | "active" | "completed" | "certificates";

type EnrolledCourse = Course & {
  progress: number; // 0 - 100
  certificateId: string | null;
  completedOn: string | null;
  enrollmentId?: string;
};

type ContentRow = {
  id: string;
  chapter_id: string;
  title: string;
  type: string; // "video" | "pdf" | "youtube" | ...
  content_url: string;
  duration_seconds: number | null;
  order_index: number | null;
};

type PlayerState = {
  open: boolean;
  loading: boolean;
  error: string | null;
  course: EnrolledCourse | null;
  content: ContentRow | null;
  queue: ContentRow[]; // all playable content for the course, in order
  queueIndex: number;
  watchSeconds: Map<string, number>; // best seconds_watched per content id, for this employee
  durationOverrides: Map<string, number>; // browser-detected durations, used when contents.duration_seconds is NULL/0
};

const INITIAL_PLAYER_STATE: PlayerState = {
  open: false,
  loading: false,
  error: null,
  course: null,
  content: null,
  queue: [],
  queueIndex: 0,
  watchSeconds: new Map(),
  durationOverrides: new Map(),
};

/**
 * Course-wide progress = average, across all lessons, of how much of each
 * lesson was watched (capped at 100% per lesson). This gives partial credit
 * for a half-watched video instead of requiring every video to be watched
 * to the very end before anything moves.
 *
 * durationOverrides lets us fall back to a browser-detected duration (from
 * the <video> element or the YouTube player) when contents.duration_seconds
 * is NULL/0 in the database — otherwise that lesson could never contribute
 * to progress no matter how much of it was watched.
 */
function computeProgressPercent(
  queue: ContentRow[],
  watchSeconds: Map<string, number>,
  durationOverrides: Map<string, number>
): number {
  if (queue.length === 0) return 0;
  const totalRatio = queue.reduce((sum, c) => {
    const duration = (c.duration_seconds && c.duration_seconds > 0)
      ? c.duration_seconds
      : durationOverrides.get(c.id) ?? 0;
    const watched = watchSeconds.get(c.id) ?? 0;
    if (duration <= 0) return sum; // still unknown: can't compute a ratio, contributes 0
    return sum + Math.min(watched / duration, 1);
  }, 0);
  return Math.round((totalRatio / queue.length) * 100);
}

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


/**
 * Turns a YouTube "watch" or "playlist" URL into an embeddable URL.
 * Falls back to returning the original URL for direct video files (mp4 etc.)
 * or anything that isn't recognizably YouTube.
 */
function toEmbeddableUrl(rawUrl: string): { kind: "youtube" | "direct"; url: string } {
  try {
    const url = new URL(rawUrl);
    const isYouTube =
      url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be");

    if (isYouTube) {
      // youtu.be/<id>
      if (url.hostname.includes("youtu.be")) {
        const id = url.pathname.replace("/", "");
        return { kind: "youtube", url: `https://www.youtube.com/embed/${id}` };
      }
      // youtube.com/watch?v=<id>
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return { kind: "youtube", url: `https://www.youtube.com/embed/${videoId}` };
      }
      // youtube.com/playlist?list=<id>
      const listId = url.searchParams.get("list");
      if (listId) {
        return {
          kind: "youtube",
          url: `https://www.youtube.com/embed/videoseries?list=${listId}`,
        };
      }
    }
  } catch {
    // not a valid absolute URL — fall through to direct
  }
  return { kind: "direct", url: rawUrl };
}

export default function EnrolledCourses() {

   console.log("Enrolled Page Loaded");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("enrolled");
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
const { user: authUser } = useAuth();
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

        setEmployeeId(user.id);

        const allCourses = await lmsService.fetchCourses("all");

  let enrollments: any[] = [];

if (authUser?.role === "Student") {
  enrollments = await lmsService.fetchEmployeeEnrollments(user.id);
}

else if (authUser?.role === "Teacher") {
  const { data, error } = await SupabaseClient
    .from("course_enrollment")
    .select(`
      *,
      profiles(full_name,email),
      courses!inner(
        id,
        title,
        created_by
      )
    `)
    .eq("courses.created_by", user.id);

  if (error) throw error;

  enrollments = data ?? [];
  console.log("Logged in Role:", authUser?.role);
console.log("Permissions:", authUser);
}

else if (authUser?.role === "Admin") {
  const { data, error } = await SupabaseClient
    .from("course_enrollment")
    .select(`
      *,
      profiles(full_name,email),
      courses(
        id,
        title
      )
    `);

  if (error) throw error;

  enrollments = data ?? [];
}

       

           const hydrated: EnrolledCourse[] = enrollments
  .map((enr) => {
    const courseId =
      typeof enr === "string" ? enr : enr.course_id ?? enr.courseId ?? enr.id;
    const course = allCourses.find((c: any) => c.id === courseId);
    if (!course) return null;

    const progress =
      typeof enr === "object"
        ? Number(enr.progress ?? enr.progress_percent ?? enr.progress_percentage ?? 0)
        : 0;
    const certificateId =
      typeof enr === "object" ? enr.certificate_id ?? enr.certificateId ?? null : null;
    const completedOn =
      typeof enr === "object" ? enr.completed_on ?? enr.completedOn ?? null : null;

    return {
      ...course,
      progress,
      certificateId,
      completedOn,
      enrollmentId: typeof enr === "object" ? enr.id : undefined, // 👈 add this
    } as EnrolledCourse;
  })
  .filter((c): c is EnrolledCourse => c !== null);

  console.log("hydrated ids:", hydrated.map(c => c.id));
console.log("enrollment ids:", hydrated.map(c => (c as any).enrollmentId));
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

  const certificateCount = useMemo(
    () => courses.filter((c) => c.progress === 100).length,
    [courses]
  );

  const visibleCourses = useMemo(
    () => filterCourses(courses, activeTab),
    [courses, activeTab]
  );

  const isCertificatesTab = activeTab === "certificates";

  /**
   * Fetches every chapter for the course, then every content row for those
   * chapters (public.contents), ordered by chapter order then content
   * order_index, and opens the player on the first item. Works the same
   * whether the course is fresh, in progress, or already 100% complete
   * (in the completed case it's effectively a rewatch, starting from the
   * first lesson since none are "not yet watched").
   */
  async function openPlayer(course: EnrolledCourse) {
    setPlayer({ ...INITIAL_PLAYER_STATE, open: true, loading: true, course });

    try {
      const { data: chapters, error: chaptersError } = await SupabaseClient
        .from("chapters")
        .select("id, order_index")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (chaptersError) throw chaptersError;

      const chapterIds = (chapters ?? []).map((c: any) => c.id);

      if (chapterIds.length === 0) {
        setPlayer((prev) => ({
          ...prev,
          loading: false,
          error: "This course has no chapters yet.",
        }));
        return;
      }

      const { data: contents, error: contentsError } = await SupabaseClient
        .from("contents")
        .select("id, chapter_id, title, type, content_url, duration_seconds, order_index")
        .in("chapter_id", chapterIds)
        .order("order_index", { ascending: true });

      if (contentsError) throw contentsError;

      const queue: ContentRow[] = (contents ?? []).filter(
        (c: ContentRow) => !!c.content_url && c.content_url !== "EMPTY"
      );

      if (queue.length === 0) {
        setPlayer((prev) => ({
          ...prev,
          loading: false,
          error: "No playable content was found for this course.",
        }));
        return;
      }

      let watchSeconds = new Map<string, number>();
      if (employeeId) {
        const { data: sessionRows, error: sessionError } = await SupabaseClient
          .from("watch_sessions")
          .select("lesson_id, seconds_watched")
          .eq("student_id", employeeId)
          .eq("course_id", course.id);

        if (sessionError) {
          console.error("Error loading watch sessions:", sessionError);
        } else {
          // Keep the best (max) seconds_watched seen per lesson, since each
          // heartbeat is a new inserted row rather than an upsert.
          for (const row of sessionRows ?? []) {
            const prevBest = watchSeconds.get(row.lesson_id) ?? 0;
            if (row.seconds_watched > prevBest) {
              watchSeconds.set(row.lesson_id, row.seconds_watched);
            }
          }
        }
      }

      // Resume from the first lesson that isn't ~fully watched yet, or the
      // first item (rewatch from the start) if everything is already done.
      const resumeIndex = Math.max(
        queue.findIndex((c) => {
          const duration = c.duration_seconds ?? 0;
          const watched = watchSeconds.get(c.id) ?? 0;
          return duration <= 0 || watched < duration * 0.9;
        }),
        0
      );

      setPlayer({
        open: true,
        loading: false,
        error: null,
        course,
        content: queue[resumeIndex],
        queue,
        queueIndex: resumeIndex,
        watchSeconds,
        durationOverrides: new Map(),
      });
    } catch (err) {
      console.error("Error loading course content:", err);
      setPlayer((prev) => ({
        ...prev,
        loading: false,
        error: "Could not load the video for this course. Please try again.",
      }));
    }
  }

  function closePlayer() {
    setPlayer(INITIAL_PLAYER_STATE);
  }

  function playQueueIndex(index: number) {
    setPlayer((prev) => {
      if (index < 0 || index >= prev.queue.length) return prev;
      return { ...prev, queueIndex: index, content: prev.queue[index] };
    });
  }

  /**
   * Logs a row into public.watch_sessions (student_id, course_id, lesson_id,
   * seconds_watched, watched_at). Used both for periodic heartbeats while a
   * video plays and for the final "completed" entry.
   */
  async function logWatchSession(course: EnrolledCourse, contentId: string, secondsWatched: number) {
    if (!employeeId) {
      console.warn("[watch_sessions] skipped: no employeeId yet");
      return;
    }
    console.log("[watch_sessions] inserting", {
      student_id: employeeId,
      course_id: course.id,
      lesson_id: contentId,
      seconds_watched: Math.floor(secondsWatched),
    });
    try {
      const { error: insertError, data } = await SupabaseClient.from("watch_sessions").insert({
        student_id: employeeId,
        course_id: course.id,
        lesson_id: contentId,
        seconds_watched: Math.max(0, Math.floor(secondsWatched)),
        watched_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      console.log("[watch_sessions] insert OK", data);
    } catch (err) {
      console.error("[watch_sessions] insert FAILED:", err);
    }
  }

  /**
   * Called once a video's real duration is known from the browser (either
   * the <video> element's metadata or the YouTube player), used as a
   * fallback when contents.duration_seconds is NULL/0 in the database.
   */
  function recordDuration(contentId: string, durationSeconds: number) {
    if (!durationSeconds || durationSeconds <= 0) return;
    setPlayer((prev) => {
      if (prev.durationOverrides.has(contentId)) return prev;
      console.log("[recordDuration]", { contentId, durationSeconds });
      const next = new Map(prev.durationOverrides);
      next.set(contentId, durationSeconds);
      return { ...prev, durationOverrides: next };
    });
  }

  /**
   * Called on every heartbeat AND when a video ends. Logs the watch_sessions
   * row, updates the in-memory best-seconds-watched for that lesson, then
   * recomputes the course's overall progress as the average watched-ratio
   * across all lessons (partial credit — no need to finish a video to see
   * progress move), and writes that back to public.course_enrollment.
   */
  async function recordProgress(contentId: string, secondsWatched: number) {
    console.log("[recordProgress] called", { contentId, secondsWatched, employeeId });
    if (!employeeId) {
      console.warn("[recordProgress] skipped: no employeeId yet");
      return;
    }

    const currentCourse = player.course;
    if (!currentCourse) {
      console.warn("[recordProgress] skipped: no current course in player state");
      return;
    }

    await logWatchSession(currentCourse, contentId, secondsWatched);

    setPlayer((prev) => {
      const prevBest = prev.watchSeconds.get(contentId) ?? 0;
      if (secondsWatched <= prevBest) {
        // No new ground covered — nothing to recompute.
        return prev;
      }

      const nextWatchSeconds = new Map(prev.watchSeconds);
      nextWatchSeconds.set(contentId, secondsWatched);

      const newProgress = computeProgressPercent(prev.queue, nextWatchSeconds, prev.durationOverrides);
      console.log("[recordProgress] new progress", {
        newProgress,
        contentDuration: prev.queue.find((c) => c.id === contentId)?.duration_seconds,
        durationOverride: prev.durationOverrides.get(contentId),
      });

      if (prev.course) {
        const isCourseDone = newProgress >= 100;
        // Generate a certificate ID the moment the course is completed, so
        // course.certificateId is no longer stuck at null once progress hits 100%.
        const generatedCertificateId = isCourseDone
          ? `CERT-${new Date().getFullYear()}-${prev.course.id.slice(0, 8).toUpperCase()}`
          : undefined;

        SupabaseClient
          .from("course_enrollment")
          .update({
            progress_percentage: newProgress,
            updated_at: new Date().toISOString(),
            status: isCourseDone ? "completed" : "in_progress",
            ...(isCourseDone ? { completed_at: new Date().toISOString() } : {}),
            ...(generatedCertificateId ? { certificate_id: generatedCertificateId } : {}),
          }, { count: "exact" })
          .eq("employee_id", employeeId)
          .eq("course_id", prev.course.id)
          .select()
          .then(({ error: enrollError, data, count }) => {
            if (enrollError) {
              console.error("[course_enrollment] update FAILED:", enrollError);
            } else {
              console.log("[course_enrollment] update OK — rows affected:", count, "returned rows:", data);
              if (!data || data.length === 0) {
                console.warn(
                  "[course_enrollment] ⚠️ ZERO ROWS MATCHED — check that employee_id/course_id types & values line up with the row in the table."
                );
              }
            }
          });

        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c.id === prev.course!.id
              ? { ...c, progress: newProgress, certificateId: generatedCertificateId ?? c.certificateId }
              : c
          )
        );
      }

      return { ...prev, watchSeconds: nextWatchSeconds };
    });
  }

  /**
   * Both fresh and completed courses open the same player. There's no more
   * "View certificate" redirect here — a finished course just replays from
   * the top (see the resumeIndex fallback in openPlayer).
   */
  function handlePrimaryAction(course: EnrolledCourse) {
    openPlayer(course);
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading your enrolled courses...
      </div>
    );
  }

  return (
    <div className="cert-page">
      <div className="cert-banner">
        <div className="cert-banner-text">
          <h2></h2>
          <h1>
  {authUser?.role === "Admin"
    ? "All Course Enrollments"
    : authUser?.role === "Teacher"
    ? "Students Enrolled in Your Courses"
    : "My Enrolled Courses"}
</h1>
          <p>Continue learning from where you left off, track your progress across every course.</p>
        </div>
        
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
                key={course.enrollmentId ?? course.id}
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
                      className={`cert-action-btn ${isDone ? "is-done" : ""}`}
                      onClick={() => handlePrimaryAction(course)}
                    >
                      <PlayIcon />
                      {isDone ? "Rewatch" : "Continue learning"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {player.open && (
        <VideoPlayerModal
          player={player}
          onClose={closePlayer}
          onSelect={playQueueIndex}
          onComplete={recordProgress}
          onHeartbeat={recordProgress}
          onDurationKnown={recordDuration}
        />
      )}
    </div>
  );
}

/* ---- Video player modal ---- */
function VideoPlayerModal({
  player,
  onClose,
  onSelect,
  onComplete,
  onHeartbeat,
  onDurationKnown,
}: {
  player: PlayerState;
  onClose: () => void;
  onSelect: (index: number) => void;
  onComplete: (contentId: string, secondsWatched: number) => void;
  onHeartbeat: (contentId: string, secondsWatched: number) => void;
  onDurationKnown: (contentId: string, durationSeconds: number) => void;
}) {
  const { loading, error, course, content, queue, queueIndex, watchSeconds, durationOverrides } = player;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content ? content.title : "Course player"}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "min(920px, 100%)",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {course?.title ?? "Course"}
            </p>
            {content && (
              <p style={{ margin: 0, fontSize: 13, color: "#666" }}>{content.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close player"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 18, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
              Loading video...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: 40, textAlign: "center", color: "#b00020" }}>
              {error}
            </div>
          )}

          {!loading && !error && content && (
            <PlayableContent
              content={content}
              resumeSeconds={watchSeconds.get(content.id) ?? 0}
              onComplete={(secondsWatched) => onComplete(content.id, secondsWatched)}
              onHeartbeat={(secondsWatched) => onHeartbeat(content.id, secondsWatched)}
              onDurationKnown={(duration) => onDurationKnown(content.id, duration)}
            />
          )}

          {!loading && !error && queue.length > 1 && (
            <div style={{ marginTop: 18 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 8 }}>
                Up next
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {queue.map((item, idx) => {
                  const duration = (item.duration_seconds && item.duration_seconds > 0)
                    ? item.duration_seconds
                    : durationOverrides.get(item.id) ?? 0;
                  const watched = watchSeconds.get(item.id) ?? 0;
                  const isDone = duration > 0 && watched >= duration * 0.9;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onSelect(idx)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: idx === queueIndex ? "#f0f0f0" : "transparent",
                          cursor: "pointer",
                          fontWeight: idx === queueIndex ? 600 : 400,
                        }}
                      >
                        {isDone ? "✓ " : `${idx + 1}. `}
                        {item.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayableContent({
  content,
  resumeSeconds,
  onComplete,
  onHeartbeat,
  onDurationKnown,
}: {
  content: ContentRow;
  resumeSeconds: number;
  onComplete: (secondsWatched: number) => void;
  onHeartbeat: (secondsWatched: number) => void;
  onDurationKnown: (durationSeconds: number) => void;
}) {
  const type = (content.type ?? "").toLowerCase();

  if (type === "pdf") {
    return (
      <iframe
        title={content.title}
        src={content.content_url}
        style={{ width: "100%", height: "60vh", border: "none", borderRadius: 8 }}
      />
    );
  }

  const { kind, url } = toEmbeddableUrl(content.content_url);

  if (kind === "youtube") {
    return (
      <YouTubePlayer
        key={url}
        embedUrl={url}
        title={content.title}
        resumeSeconds={resumeSeconds}
        onComplete={onComplete}
        onHeartbeat={onHeartbeat}
        onDurationKnown={onDurationKnown}
      />
    );
  }

  // Direct video file (mp4, etc.)
  return (
    <DirectVideoPlayer
      key={url}
      url={url}
      resumeSeconds={resumeSeconds}
      onComplete={onComplete}
      onHeartbeat={onHeartbeat}
      onDurationKnown={onDurationKnown}
    />
  );
}

const HEARTBEAT_INTERVAL_MS = 10000;
// Don't bother resuming into the last few seconds of a video — treat it as
// finished and just start over instead of seeking to 0:00 remaining.
const RESUME_END_BUFFER_SECONDS = 5;

function DirectVideoPlayer({
  url,
  resumeSeconds,
  onComplete,
  onHeartbeat,
  onDurationKnown,
}: {
  url: string;
  resumeSeconds: number;
  onComplete: (secondsWatched: number) => void;
  onHeartbeat: (secondsWatched: number) => void;
  onDurationKnown: (durationSeconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastHeartbeatRef = useRef(resumeSeconds);
  const hasSeekedRef = useRef(false);

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      autoPlay
      onLoadedMetadata={(e) => {
        const duration = e.currentTarget.duration;
        console.log("[DirectVideoPlayer] duration detected", duration);
        if (isFinite(duration) && duration > 0) onDurationKnown(duration);

        if (!hasSeekedRef.current) {
          hasSeekedRef.current = true;
          const safeResume = isFinite(duration) && duration > 0
            ? Math.min(resumeSeconds, Math.max(duration - RESUME_END_BUFFER_SECONDS, 0))
            : resumeSeconds;
          if (safeResume > 0) {
            console.log("[DirectVideoPlayer] resuming at", safeResume);
            e.currentTarget.currentTime = safeResume;
          }
        }
      }}
      onTimeUpdate={(e) => {
        const current = e.currentTarget.currentTime;
        if (current - lastHeartbeatRef.current >= HEARTBEAT_INTERVAL_MS / 1000) {
          lastHeartbeatRef.current = current;
          onHeartbeat(current);
        }
      }}
      onEnded={(e) => {
        console.log("[DirectVideoPlayer] onEnded fired", { duration: e.currentTarget.duration });
        onComplete(e.currentTarget.duration || lastHeartbeatRef.current);
      }}
      style={{ width: "100%", maxHeight: "60vh", borderRadius: 8, background: "#000" }}
    />
  );
}

/**
 * Wraps a YouTube embed with the IFrame Player API's postMessage protocol so
 * we can (a) detect when the video actually finishes (player state 0 =
 * ended) and (b) periodically read the current playback position to log
 * heartbeat rows into watch_sessions. A plain
 * <iframe src="...youtube.com/embed/..."> gives neither on its own, which
 * is why progress never moved before.
 */
function YouTubePlayer({
  embedUrl,
  title,
  resumeSeconds,
  onComplete,
  onHeartbeat,
  onDurationKnown,
}: {
  embedUrl: string;
  title: string;
  resumeSeconds: number;
  onComplete: (secondsWatched: number) => void;
  onHeartbeat: (secondsWatched: number) => void;
  onDurationKnown: (durationSeconds: number) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firedEndedRef = useRef(false);
  const lastKnownTimeRef = useRef(resumeSeconds);
  const durationReportedRef = useRef(false);
  const hasSeekedRef = useRef(false);

  const src = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}enablejsapi=1&origin=${encodeURIComponent(
    window.location.origin
  )}`;

  useEffect(() => {
    firedEndedRef.current = false;
    lastKnownTimeRef.current = resumeSeconds;
    durationReportedRef.current = false;
    hasSeekedRef.current = false;

    const iframe = iframeRef.current;

    function postToPlayer(func: string, args: any[] = []) {
      iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
    }

    function handleMessage(event: MessageEvent) {
      if (!event.origin.includes("youtube.com")) return;
      let data: any;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (data?.event === "infoDelivery" && typeof data?.info?.currentTime === "number") {
        lastKnownTimeRef.current = data.info.currentTime;
      }

      if (
        data?.event === "infoDelivery" &&
        typeof data?.info?.duration === "number" &&
        data.info.duration > 0 &&
        !durationReportedRef.current
      ) {
        durationReportedRef.current = true;
        console.log("[YouTubePlayer] duration detected", data.info.duration);
        onDurationKnown(data.info.duration);

        if (!hasSeekedRef.current && resumeSeconds > 0) {
          hasSeekedRef.current = true;
          const safeResume = Math.min(resumeSeconds, Math.max(data.info.duration - RESUME_END_BUFFER_SECONDS, 0));
          if (safeResume > 0) {
            console.log("[YouTubePlayer] resuming at", safeResume);
            postToPlayer("seekTo", [safeResume, true]);
          }
        }
      }

      if (data?.event === "onStateChange") {
        console.log("[YouTubePlayer] onStateChange", data.info);
      }

      // YT.PlayerState.ENDED === 0
      if (data?.event === "onStateChange" && data?.info === 0 && !firedEndedRef.current) {
        firedEndedRef.current = true;
        console.log("[YouTubePlayer] ENDED, marking complete", { lastKnownTime: lastKnownTimeRef.current });
        onComplete(lastKnownTimeRef.current);
      }
    }

    window.addEventListener("message", handleMessage);

    const listen = () => {
      iframe?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: title }),
        "*"
      );
      postToPlayer("addEventListener", ["onStateChange"]);
      // Ask for the duration a couple of times shortly after load — the
      // player sometimes isn't ready to answer on the very first request.
      // The duration response is also what triggers the resume-seek above.
      setTimeout(() => postToPlayer("getDuration"), 500);
      setTimeout(() => postToPlayer("getDuration"), 1500);
    };
    iframe?.addEventListener("load", listen);

    const heartbeat = setInterval(() => {
      postToPlayer("getCurrentTime");
      if (!durationReportedRef.current) postToPlayer("getDuration");
      // Give the response a moment to arrive via postMessage, then log it.
      setTimeout(() => {
        if (lastKnownTimeRef.current > 0) onHeartbeat(lastKnownTimeRef.current);
      }, 300);
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.removeEventListener("message", handleMessage);
      iframe?.removeEventListener("load", listen);
      clearInterval(heartbeat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedUrl]);

  return (
    <div className="body1">
    <div style={{ position: "relative", paddingTop: "56.25%" }}>
      <iframe
        ref={iframeRef}
        title={title}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 8,
        }}
      />
    </div>
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