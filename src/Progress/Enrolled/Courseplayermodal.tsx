import React, { useEffect, useState } from "react";
import { lmsService } from "../../Elearning/lms/services/lmsService";
import { useWatchTimeTracker } from "./useWatchTimeTracker";

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1] || null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/shorts/")[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function resolvePlayerKind(item: any): "youtube" | "video" | "pdf" | "unknown" {
  const rawType = (item?.type ?? "").toString().toLowerCase().trim();
  const url: string = item?.content_url || item?.url || "";
  if (rawType === "youtube") return "youtube";
  if (rawType === "video") return "video";
  if (rawType === "pdf") return "pdf";
  if (getYouTubeVideoId(url)) return "youtube";
  if (url) return "video";
  return "unknown";
}

interface CoursePlayerModalProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

const CoursePlayerModal: React.FC<CoursePlayerModalProps> = ({
  courseId,
  courseTitle,
  onClose,
}) => {
  const [course, setCourse] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFullCourseContent = async () => {
      try {
        setLoading(true);
        const data = await lmsService.fetchCourses("all");
        const currentCourse = data.find((c: any) => c.id === courseId);
        if (!currentCourse) {
          if (isMounted) setError("Requested academic course could not be found.");
          return;
        }
        if (isMounted) setCourse(currentCourse);
        if (currentCourse.chapters && currentCourse.chapters.length > 0) {
          let firstPlayable: any = null;
          for (const chapter of currentCourse.chapters) {
            if (chapter.contents && chapter.contents.length > 0) {
              if (!firstPlayable) firstPlayable = chapter.contents[0];
              const found = chapter.contents.find(
                (c: any) => resolvePlayerKind(c) !== "unknown"
              );
              if (found) { firstPlayable = found; break; }
            }
          }
          if (isMounted && firstPlayable) setActiveVideo(firstPlayable);
        }
      } catch (err) {
        console.error("Player data fetch crash:", err);
        if (isMounted) setError("Failed to load this course's video content.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchFullCourseContent();
    return () => { isMounted = false; };
  }, [courseId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const rawVideoUrl: string | undefined = activeVideo?.content_url || activeVideo?.url;
  const playerKind = activeVideo ? resolvePlayerKind(activeVideo) : "unknown";

  const { bindYouTubeContainer, bindVideoElement } = useWatchTimeTracker({
    courseId,
    contentId: activeVideo?.id,
    enabled: Boolean(activeVideo),
  });

  return (
    <div
      className="course-player-modal__backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="course-player-modal">
        <div className="course-player-modal__header">
          <h2 className="course-player-modal__title">{courseTitle}</h2>
          <button
            type="button"
            className="course-player-modal__close"
            aria-label="Close video player"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="course-player-modal__state">Syncing video playback…</div>
        )}

        {!loading && error && (
          <div className="course-player-modal__state course-player-modal__state--error">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && course && (
          <div className="course-player-workspace">
            {/* LEFT: Video viewport */}
            <div className="video-viewport-area">
              <div className="video-wrapper">
                {playerKind === "youtube" && rawVideoUrl ? (
                  <div
                    key={activeVideo.id}
                    ref={bindYouTubeContainer(getYouTubeVideoId(rawVideoUrl))}
                    className="main-html5-player"
                  />
                ) : playerKind === "video" && rawVideoUrl ? (
                  <video
                    key={activeVideo.id}
                    ref={bindVideoElement}
                    src={rawVideoUrl}
                    controls
                    autoPlay
                    controlsList="nodownload"
                    className="main-html5-player"
                  />
                ) : playerKind === "pdf" && rawVideoUrl ? (
                  <iframe
                    key={activeVideo.id}
                    src={rawVideoUrl}
                    title={activeVideo.title || "Course material"}
                    className="main-html5-player"
                  />
                ) : (
                  <div className="video-placeholder-box">
                    🎬 No active video attached to this topic yet.
                  </div>
                )}
              </div>

              <div className="video-metadata-card">
                <span className="badge-category">{course.category}</span>
                <h3 className="playing-lecture-title">
                  {activeVideo ? activeVideo.title : "Welcome to " + course.title}
                </h3>
                <p className="playing-course-context">{course.description}</p>
              </div>
            </div>

            {/* RIGHT: Playlist sidebar */}
            <div className="playlist-sidebar-tray">
              <div className="playlist-header">
                <h3>Course Content Syllabus</h3>
                <p>{course.chapters?.length || 0} Modules Available</p>
              </div>
              <div className="playlist-modules-list">
                {course.chapters?.map((chapter: any, cIdx: number) => (
                  <div key={chapter.id} className="playlist-chapter-block">
                    <h4 className="chapter-block-title">
                      Module {cIdx + 1}: {chapter.title}
                    </h4>
                    <div className="chapter-lectures-sublist">
                      {chapter.contents && chapter.contents.length > 0 ? (
                        chapter.contents.map((lecture: any) => (
                          <button
                            key={lecture.id}
                            type="button"
                            className={`playlist-lecture-row ${
                              activeVideo?.id === lecture.id ? "active-playing" : ""
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveVideo(lecture);
                            }}
                          >
                            <span className="play-status-icon">
                              {activeVideo?.id === lecture.id ? "🔊" : "▶"}
                            </span>
                            <div className="lecture-row-details">
                              <p className="lecture-row-title">{lecture.title}</p>
                              <span className="lecture-row-type">
                                {lecture.type || "Video"}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="empty-lecture-notice">No videos inside this module.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlayerModal;