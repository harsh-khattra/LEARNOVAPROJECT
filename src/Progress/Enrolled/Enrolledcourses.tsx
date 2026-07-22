import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseSkeleton from "../../Elearning/Header/CourseSkeleton";
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
  completed: Set<string>; // content ids explicitly marked "ended" — bypasses duration ratio math entirely
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
  completed: new Set(),
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
 *
 * `completed` is an explicit "this lesson's ended event fired" flag, checked
 * BEFORE the ratio math. This matters for lessons where duration/watched
 * numbers are unreliable — most notably a YouTube *playlist* embed, where
 * the player's reported duration is only ever for the currently-playing
 * video within the playlist, not the whole thing, so a plain watched/duration
 * ratio can land anywhere and never cleanly hit 1.0 even after the entire
 * playlist has finished. The "ended" event still fires correctly once the
 * whole playlist completes, so we use that as the source of truth instead.
 * PDFs are also added to `completed` as soon as they're opened (see
 * PdfViewer below), since there's no meaningful "watch time" concept for a
 * document — otherwise a course containing a PDF lesson could never reach
 * 100% no matter how much progress was made on the other lessons.
 */
function computeProgressPercent(
  queue: ContentRow[],
  watchSeconds: Map<string, number>,
  durationOverrides: Map<string, number>,
  completed: Set<string>
): number {
  if (queue.length === 0) return 0;
  const totalRatio = queue.reduce((sum, c) => {
    if (completed.has(c.id)) return sum + 1; // explicit completion always wins
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
   const [searchQuery, setSearchQuery] = useState('');
   
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

const visibleCourses = useMemo(() => {
  const tabFiltered = filterCourses(courses, activeTab);
  const q = searchQuery.trim().toLowerCase();
  if (!q) return tabFiltered;

  return tabFiltered.filter((course) => {
    const title = course.title?.toLowerCase() ?? "";
    const category = getField<string>(course, "category")?.toLowerCase() ?? "";
    const instructor =
      getField<string>(course, "instructor", "instructor_name")?.toLowerCase() ?? "";
    return (
      title.includes(q) ||
      category.includes(q) ||
      instructor.includes(q)
    );
  });
}, [courses, activeTab, searchQuery]);

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
             

        console.log("Current Employee ID:", employeeId);
        console.log("Current Course ID:", course.id);
        console.log("Watch Sessions:", sessionRows);
        console.log("Watch Session Error:", sessionError);


        if (!employeeId) {
  console.warn("[watch_sessions] skipped: no employeeId yet");
  return;
}
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

      // Approximate initial "completed" set from persisted watch_sessions:
      // a lesson counts as already-completed if we've recorded watched time
      // at or beyond ~90% of its known duration, OR if it's a PDF (PDFs are
      // always treated as complete once opened — see PdfViewer). This is a
      // best-effort reconstruction only — it can't recover true "ended"
      // events from a past session, but it keeps the resume/checkmark UI
      // reasonably accurate for lessons with reliable duration data.
      // Lessons whose duration was never resolved (e.g. a playlist) will
      // re-derive their completed status the next time they're played to
      // the end.
      const initialCompleted = new Set<string>();
      for (const c of queue) {
        const duration = c.duration_seconds ?? 0;
        const watched = watchSeconds.get(c.id) ?? 0;
        const isPdf = (c.type ?? "").toLowerCase() === "pdf";
        if (isPdf && watched > 0) {
          initialCompleted.add(c.id);
        } else if (duration > 0 && watched >= duration * 0.9) {
          initialCompleted.add(c.id);
        }
      }

      // Resume from the first lesson that isn't ~fully watched yet, or the
      // first item (rewatch from the start) if everything is already done.
      const resumeIndex = Math.max(
        queue.findIndex((c) => {
          if (initialCompleted.has(c.id)) return false;
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
        completed: initialCompleted,
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
  try {
    const { error: insertError, data } = await SupabaseClient.from("watch_sessions").insert({
      student_id: employeeId,
      course_id: course.id,
      lesson_id: contentId,
      seconds_watched: Math.max(0, Math.floor(secondsWatched)),
      watched_at: new Date().toISOString(),
    }).select();   // 👈 sirf isi insert ke end mein lagana tha
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

    const existingContent = prev.queue.find((c) => c.id === contentId);
    const dbDurationMissing = !existingContent?.duration_seconds || existingContent.duration_seconds <= 0;

    if (dbDurationMissing) {
      (async () => {
        const { error } = await SupabaseClient
          .from("contents")
          .update({ duration_seconds: Math.round(durationSeconds) })
          .eq("id", contentId);

        if (error) {
          console.error("[contents] duration_seconds update FAILED:", error);
        } else {
          console.log("[contents] duration_seconds saved permanently:", {
            contentId,
            durationSeconds: Math.round(durationSeconds),
          });
        }
      })();
    }

    return { ...prev, durationOverrides: next };
  });
}

  /**
   * Called on every heartbeat AND when a video ends (or a PDF is opened).
   * Logs the watch_sessions row, updates the in-memory best-seconds-watched
   * for that lesson, then recomputes the course's overall progress as the
   * average watched-ratio across all lessons (partial credit — no need to
   * finish a video to see progress move), and writes that back to
   * public.course_enrollment.
   *
   * isFinal=true means this call came from an actual "ended" event (video
   * onEnded, the YouTube player's ENDED state, or a PDF being opened)
   * rather than a periodic heartbeat. When true, the lesson is added to the
   * `completed` set, which makes it count as 100% in
   * computeProgressPercent regardless of whether the watched/duration
   * ratio is reliable (e.g. a YouTube playlist, or a PDF which has no
   * duration at all).
   *
   * IMPORTANT: the write to `course_enrollment` below matches rows using
   * `.eq("student_id", employeeId)`, matching the same column name used
   * everywhere else in this file (watch_sessions, fetch queries, etc).
   * If your `course_enrollment` table actually uses a different column
   * name (e.g. `employee_id`), update the `.eq(...)` call below to match —
   * otherwise the update will silently match zero rows and progress will
   * reset to whatever's in the DB on every page refresh, which was the
   * original bug. Watch the console: a successful save logs
   * "[course_enrollment] update OK — rows affected: 1"; zero rows logs an
   * explicit warning.
   */
  async function recordProgress(contentId: string, secondsWatched: number, isFinal: boolean = false) {
    console.log("[recordProgress] called", { contentId, secondsWatched, employeeId, isFinal });
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
      const alreadyCompleted = prev.completed.has(contentId);

      // Nothing new to record: not a final/ended call, and no new watch
      // time either.
      if (secondsWatched <= prevBest && !isFinal) {
        return prev;
      }
      // Final call but this lesson was already marked completed and there's
      // no new watch time — avoid redundant writes.
      if (isFinal && alreadyCompleted && secondsWatched <= prevBest) {
        return prev;
      }

      const nextWatchSeconds = new Map(prev.watchSeconds);
      if (secondsWatched > prevBest) {
        nextWatchSeconds.set(contentId, secondsWatched);
      }

      const nextCompleted = new Set(prev.completed);
      if (isFinal) nextCompleted.add(contentId);

      const newProgress = computeProgressPercent(prev.queue, nextWatchSeconds, prev.durationOverrides, nextCompleted);
      console.log("[recordProgress] new progress", {
        newProgress,
        contentDuration: prev.queue.find((c) => c.id === contentId)?.duration_seconds,
        durationOverride: prev.durationOverrides.get(contentId),
        isFinal,
      });

      if (prev.course) {
        const isCourseDone = newProgress >= 100;
        // Generate a certificate ID the moment the course is completed, so
        // course.certificateId is no longer stuck at null once progress hits 100%.
        const generatedCertificateId = isCourseDone
          ? `CERT-${new Date().getFullYear()}-${prev.course.id.slice(0, 8).toUpperCase()}`
          : undefined;

        // FIX: first read the existing row ourselves (instead of blindly
        // calling .update()) so we can tell the two failure modes apart:
        //   (a) no enrollment row exists yet for this student/course →
        //       .update() would match 0 rows and silently do nothing, so
        //       progress for THAT course specifically would never persist
        //       and would reset to 0% on every refresh — this matches
        //       "some videos reset, not all".
        //   (b) a row exists but our stale-write guard blocks this write.
        // We fetch first, then either update (row exists) or insert (row
        // missing), and log exactly which path was taken so it's easy to
        // confirm in the console which courses are hitting which case.
        (async () => {
          const { data: existingRows, error: fetchErr } = await SupabaseClient
            .from("course_enrollment")
  .select("id, progress_percentage")
  .eq("employee_id", employeeId)   // 👈 student_id → employee_id
  .eq("course_id", prev.course!.id);

          if (fetchErr) {
            console.error("[course_enrollment] lookup FAILED:", fetchErr);
            return;
          }

          const payload = {
            progress_percentage: newProgress,
            updated_at: new Date().toISOString(),
            status: isCourseDone ? "completed" : "in_progress",
            ...(isCourseDone ? { completed_at: new Date().toISOString() } : {}),
            ...(generatedCertificateId ? { certificate_id: generatedCertificateId } : {}),
          };

          if (!existingRows || existingRows.length === 0) {
            // No enrollment row for this student/course at all — this is
            // almost certainly why THIS course keeps resetting to 0% on
            // refresh. Insert one instead of silently no-op-ing.
           console.warn(
  "[course_enrollment] ⚠️ no existing row for employee_id/course_id — inserting a new one instead of updating",
  { employee_id: employeeId, course_id: prev.course!.id }
);

         const { error: insertErr, data: insertData } = await SupabaseClient
  .from("course_enrollment")
  .insert({ employee_id: employeeId, course_id: prev.course!.id, ...payload })  // 👈 yahan bhi
  .select();
            if (insertErr) {
              console.error("[course_enrollment] insert FAILED:", insertErr);
            } else {
              console.log("[course_enrollment] insert OK:", insertData);
            }
            return;
          }

          // Row exists — only overwrite if this doesn't decrease progress
          // from what's already stored, guarding against out-of-order
          // heartbeat/complete network responses overwriting a later,
          // higher value with a stale lower one.
          const storedProgress = existingRows[0].progress_percentage;
         if (storedProgress != null && storedProgress > newProgress) {
    console.log(
    "[course_enrollment] skipped write — stored progress is already higher",
    { storedProgress, newProgress }
  );
  return;
}

          const { error: updateErr, data: updateData } = await SupabaseClient
            .from("course_enrollment")
            .update(payload)
            .eq("id", existingRows[0].id)
            .select();

          if (updateErr) {
            console.error("[course_enrollment] update FAILED:", updateErr);
          } else {
            console.log("[course_enrollment] update OK:", updateData);
          }
        })();

        setCourses((prevCourses) =>
          prevCourses.map((c) =>
            c.id === prev.course!.id
              ? { ...c, progress: newProgress, certificateId: generatedCertificateId ?? c.certificateId }
              : c
          )
        );
      }

      return { ...prev, watchSeconds: nextWatchSeconds, completed: nextCompleted };
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
    <div className="dashboard-container">
      <div className="course-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="cert-page">
      <div className="cert-banner">
        <div className="cert-banner-text">
    
          <h1>
  {authUser?.role === "Admin"
    ? "All Course Enrollments"
    : authUser?.role === "Teacher"
    ? "Students Enrolled in Your Courses"
    : "My Enrolled Courses"}
</h1>
          <p>Continue learning from where you left off, track your progress across every course.</p>
          <br/>
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Search active catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
          onComplete={(contentId, secondsWatched) => recordProgress(contentId, secondsWatched, true)}
          onHeartbeat={(contentId, secondsWatched) => recordProgress(contentId, secondsWatched, false)}
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
  const { loading, error, course, content, queue, queueIndex, watchSeconds, durationOverrides, completed } = player;

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
                  const isDone = completed.has(item.id) || (duration > 0 && watched >= duration * 0.9);
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
      <PdfViewer
        key={content.id}
        content={content}
        onComplete={onComplete}
        onDurationKnown={onDurationKnown}
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

/**
 * FIX: previously PDFs just rendered an <iframe> with no progress
 * signalling at all. Because they never call onDurationKnown/onComplete,
 * their duration stayed at 0 forever, and computeProgressPercent
 * explicitly gives a duration<=0 lesson a contribution of 0 no matter what
 * — so any course containing a PDF lesson could never reach 100%, and its
 * PDF lesson would never show as "watched" either.
 *
 * A PDF has no meaningful watch-time/duration concept, so instead of
 * trying to fake a ratio, we treat "opened the PDF" as "completed this
 * lesson", the same way the YouTube-playlist ENDED event is treated as an
 * unconditional completion signal elsewhere in this file.
 */
function PdfViewer({
  content,
  onComplete,
  onDurationKnown,
}: {
  content: ContentRow;
  onComplete: (secondsWatched: number) => void;
  onDurationKnown: (durationSeconds: number) => void;
}) {
  useEffect(() => {
    // Give it a non-zero "duration" so it's never treated as unknown, then
    // immediately mark it complete — opening a PDF is the whole interaction.
    onDurationKnown(1);
    onComplete(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.id]);

  return (
    <iframe
      title={content.title}
      src={content.content_url}
      style={{ width: "100%", height: "60vh", border: "none", borderRadius: 8 }}
    />
  );
}

const HEARTBEAT_INTERVAL_MS = 30000; // har 30 second mein progress update
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

  // Har 30 second mein ek baar current position check karke save karo —
  // play ho ya pause, dono states mein chalta rahega (jaise wall-clock timer).
  useEffect(() => {
    const interval = setInterval(() => {
      const current = videoRef.current?.currentTime;
      if (current && current > 0) {
        console.log("[DirectVideoPlayer] 30s interval heartbeat", current);
        lastHeartbeatRef.current = current;
        onHeartbeat(current);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
 *
 * For a *playlist* embed specifically: YouTube auto-advances through videos
 * within the same iframe, so `currentTime`/`duration` reset with each new
 * video and don't represent "progress through the whole playlist" — only
 * the final ENDED event (state 0, fired once when the whole playlist is
 * done) is trustworthy here. onComplete's caller marks this lesson as
 * explicitly `completed` in that case, sidestepping the unreliable ratio.
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

        // PAUSED (state 2) — turant heartbeat, 10 second wait nahi karna.
        if (data.info === 2 && lastKnownTimeRef.current > 0) {
          console.log("[YouTubePlayer] paused, sending immediate heartbeat", lastKnownTimeRef.current);
          onHeartbeat(lastKnownTimeRef.current);
        }
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
      setTimeout(() => postToPlayer("getDuration"), 500);
      setTimeout(() => postToPlayer("getDuration"), 1500);
    };
    iframe?.addEventListener("load", listen);

    const heartbeat = setInterval(() => {
      postToPlayer("getCurrentTime");
      if (!durationReportedRef.current) postToPlayer("getDuration");
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