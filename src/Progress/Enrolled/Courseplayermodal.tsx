import  { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SupabaseClient } from "../../Helper/Supabase";
import "./Courseplayermodal.css";

/* =========================================================================
   COURSE PLAYER PAGE
   Route: /courses/:courseId/learn  (wired from EnrolledCourses "Continue
   learning" button)

   Queries Supabase directly against the tables visible in your dashboard:
     courses          - course_id -> title etc.
     chapters         - course_id, title, order (assumed column names below)
     contents         - chapter_id, title, type, content_url, duration_seconds,
                         order_index  (matches your screenshot exactly)
     learning_progress - best-effort "mark complete" write, wrapped in
                         try/catch since the exact columns weren't visible.
                         Adjust CONTENT PROGRESS UPSERT below to match your
                         real schema.

   type values handled: "youtube", "video", "pdf". Anything else falls back
   to a plain "open link" button.
   ========================================================================= */

type ContentItem = {
  id: string;
  chapter_id: string;
  title: string;
  type: string | null;
  content_url: string | null;
  duration_seconds: number | null;
  order_index: number | null;
};

type Chapter = {
  id: string;
  course_id: string;
  title: string;
  order_index: number | null;
  contents: ContentItem[];
};

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;

    if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.replace("/", "");
    } else if (u.searchParams.get("v")) {
      videoId = u.searchParams.get("v");
    } else if (u.pathname.includes("/embed/")) {
      return url; // already an embed url
    }

    const playlistId = u.searchParams.get("list");

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}${playlistId ? `?list=${playlistId}` : ""}`;
    }
    if (playlistId) {
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    return null;
  } catch {
    return null;
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: course, error: courseErr } = await SupabaseClient
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();
        if (courseErr) throw courseErr;
        setCourseTitle(course?.title ?? "Course");

        const { data: chapterRows, error: chapterErr } = await SupabaseClient
          .from("chapters")
          .select("*")
          .eq("course_id", courseId)
          .order("order_index", { ascending: true });
        if (chapterErr) throw chapterErr;

        const chapterIds = (chapterRows ?? []).map((c: any) => c.id);

        let contentRows: any[] = [];
        if (chapterIds.length > 0) {
          const { data, error: contentErr } = await SupabaseClient
            .from("contents")
            .select("*")
            .in("chapter_id", chapterIds)
            .order("order_index", { ascending: true });
          if (contentErr) throw contentErr;
          contentRows = data ?? [];
        }

        const grouped: Chapter[] = (chapterRows ?? []).map((ch: any) => ({
          id: ch.id,
          course_id: ch.course_id,
          title: ch.title,
          order_index: ch.order_index ?? 0,
          contents: contentRows
            .filter((c) => c.chapter_id === ch.id)
            .map((c) => ({
              id: c.id,
              chapter_id: c.chapter_id,
              title: c.title,
              type: c.type,
              content_url: c.content_url,
              duration_seconds: c.duration_seconds,
              order_index: c.order_index ?? 0,
            })),
        }));

        setChapters(grouped);

        // Try to restore previous progress; falls back to the first item.
        // ASSUMPTION on learning_progress columns — adjust to match yours.
        let firstIncompleteId: string | null = null;
        try {
          const {
            data: { user },
          } = await SupabaseClient.auth.getUser();

          if (user) {
            const { data: progressRows } = await SupabaseClient
              .from("learning_progress")
              .select("content_id, completed")
              .eq("employee_id", user.id)
              .eq("course_id", courseId);

            const done = new Set<string>(
              (progressRows ?? [])
                .filter((p: any) => p.completed)
                .map((p: any) => p.content_id)
            );
            setCompletedIds(done);

            const allContentIds = grouped.flatMap((ch) => ch.contents.map((c) => c.id));
            firstIncompleteId = allContentIds.find((id) => !done.has(id)) ?? allContentIds[0] ?? null;
          }
        } catch {
          // learning_progress table shape didn't match — non-fatal, just
          // start from the first content item.
        }

        const fallbackFirstId = grouped.flatMap((ch) => ch.contents.map((c) => c.id))[0] ?? null;
        setSelectedContentId(firstIncompleteId ?? fallbackFirstId);
      } catch (err) {
        console.error("Error loading course player:", err);
        setError("Could not load this course. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const flatContents = useMemo(() => chapters.flatMap((ch) => ch.contents), [chapters]);
  const selectedContent = useMemo(
    () => flatContents.find((c) => c.id === selectedContentId) ?? null,
    [flatContents, selectedContentId]
  );
  const selectedIndex = flatContents.findIndex((c) => c.id === selectedContentId);

  async function markComplete(content: ContentItem) {
    setCompletedIds((prev) => new Set(prev).add(content.id));

    try {
      const {
        data: { user },
      } = await SupabaseClient.auth.getUser();
      if (!user || !courseId) return;

      // CONTENT PROGRESS UPSERT — adjust column names to match your real
      // learning_progress table.
      await SupabaseClient.from("learning_progress").upsert(
        {
          employee_id: user.id,
          course_id: courseId,
          content_id: content.id,
          chapter_id: content.chapter_id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "employee_id,content_id" }
      );
    } catch (err) {
      console.error("Could not save progress:", err);
    }
  }

  function goTo(offset: number) {
    const next = flatContents[selectedIndex + offset];
    if (next) setSelectedContentId(next.id);
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        Loading course...
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-page">
        <div className="player-error">
          <p>{error}</p>
          <button className="player-back-btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-page">
      <div className="player-topbar">
        <button className="player-back-btn" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="player-course-title">{courseTitle}</h1>
      </div>

      <div className="player-layout">
        <main className="player-main">
          {!selectedContent ? (
            <div className="player-empty">This course doesn't have any lessons yet.</div>
          ) : (
            <>
              <div className="player-media">
                {(() => {
                  const rawType = (selectedContent.type ?? "").trim().toLowerCase();
                  const url = (selectedContent.content_url ?? "").trim();

                  if (!url || url.toUpperCase() === "EMPTY" || url.toUpperCase() === "NULL") {
                    return <div className="player-empty">No content available for this lesson yet.</div>;
                  }

                  // Detect by URL too, not just the type column — some rows
                  // may have inconsistent/mistyped "type" values.
                  const isYouTube = rawType === "youtube" || /youtube\.com|youtu\.be/i.test(url);
                  const isPdf = rawType === "pdf" || /\.pdf($|\?)/i.test(url);

                  if (isYouTube) {
                    const embed = getYouTubeEmbedUrl(url);
                    return embed ? (
                      <iframe
                        key={selectedContent.id}
                        className="player-iframe"
                        src={embed}
                        title={selectedContent.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="player-empty">Couldn't read this YouTube link.</div>
                    );
                  }

                  if (isPdf) {
                    return (
                      <iframe
                        key={selectedContent.id}
                        className="player-iframe"
                        src={url}
                        title={selectedContent.title}
                      />
                    );
                  }

                  // Default: treat as a directly playable video file.
                  return (
                    <video
                      key={selectedContent.id}
                      className="player-video"
                      src={url}
                      controls
                      autoPlay
                      onError={(e) => console.error("Video failed to load:", url, e)}
                      onEnded={() => markComplete(selectedContent)}
                    />
                  );
                })()}
              </div>

              <div className="player-content-info">
                <h2>{selectedContent.title}</h2>
                {selectedContent.duration_seconds ? (
                  <p className="player-duration">{formatDuration(selectedContent.duration_seconds)}</p>
                ) : null}

                <div className="player-controls">
                  <button
                    className="player-nav-btn"
                    onClick={() => goTo(-1)}
                    disabled={selectedIndex <= 0}
                  >
                    ← Previous
                  </button>
                  <button
                    className={`player-complete-btn ${completedIds.has(selectedContent.id) ? "is-done" : ""}`}
                    onClick={() => markComplete(selectedContent)}
                  >
                    {completedIds.has(selectedContent.id) ? "✓ Completed" : "Mark as complete"}
                  </button>
                  <button
                    className="player-nav-btn"
                    onClick={() => goTo(1)}
                    disabled={selectedIndex === -1 || selectedIndex >= flatContents.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="player-sidebar">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="player-chapter">
              <p className="player-chapter-title">{chapter.title}</p>
              <ul className="player-lesson-list">
                {chapter.contents.map((content) => (
                  <li key={content.id}>
                    <button
                      className={`player-lesson-item ${
                        content.id === selectedContentId ? "is-active" : ""
                      } ${completedIds.has(content.id) ? "is-done" : ""}`}
                      onClick={() => setSelectedContentId(content.id)}
                    >
                      <span className="player-lesson-status">
                        {completedIds.has(content.id) ? "✓" : "○"}
                      </span>
                      <span className="player-lesson-name">{content.title}</span>
                      {content.duration_seconds ? (
                        <span className="player-lesson-duration">
                          {formatDuration(content.duration_seconds)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}