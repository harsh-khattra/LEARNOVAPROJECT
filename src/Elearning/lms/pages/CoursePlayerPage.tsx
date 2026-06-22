import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
// import './coursePlayer.css'; 

export const CoursePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL se Course ID nikali
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFullCourseContent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Poora nested data course + chapters + contents call kiya
        const data = await lmsService.fetchCourses('all');
        const currentCourse = data.find((c: any) => c.id === id);

        if (!currentCourse) {
          setError("Requested academic course could not be found.");
          return;
        }

        setCourse(currentCourse);

        // 🎥 First available video ko auto-select karein playback ke liye
        if (currentCourse.chapters && currentCourse.chapters.length > 0) {
          const firstChapter = currentCourse.chapters[0];
          if (firstChapter.contents && firstChapter.contents.length > 0) {
            setActiveVideo(firstChapter.contents[0]);
          }
        }
      } catch (err) {
        console.error("Player data optimization crash:", err);
        setError("Failed to stream playlist metadata.");
      } finally {
        setLoading(false);
      }
    };

    fetchFullCourseContent();
  }, [id]);

  if (loading) return <div className="player-loading">Syncing Video Playback Streams...</div>;
  if (error || !course) return <div className="player-error">⚠️ {error || "Course offline"}</div>;

  return (
    <div className="course-player-workspace">
      
      {/*  LEFT SIDE: Big Screen Video Player Viewport */}
      <div className="video-viewport-area">
        <div className="video-wrapper">
          {activeVideo && (activeVideo.content_url || activeVideo.url) ? (
            <video 
              key={activeVideo.id} // Prevents element caching on toggle 
              src={activeVideo.content_url || activeVideo.url} 
              controls 
              autoPlay
              controlsList="nodownload" // Basic privacy security
              className="main-html5-player"
            />
          ) : (
            <div className="video-placeholder-box">
              🎬 No active secure streaming video link attached to this topic yet.
            </div>
          )}
        </div>
        
        {/* Active Playing Video Info */}
        <div className="video-metadata-card">
          <span className="badge-category">{course.category}</span>
          <h1 className="playing-lecture-title">
            {activeVideo ? activeVideo.title : "Welcome to " + course.title}
          </h1>
          <p className="playing-course-context">{course.description}</p>
        </div>
      </div>

      {/* RIGHT SIDE: Course Playlist Sidebar Accordion */}
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
                      className={`playlist-lecture-row ${activeVideo?.id === lecture.id ? 'active-playing' : ''}`}
                      onClick={() => setActiveVideo(lecture)}
                    >
                      <span className="play-status-icon">
                        {activeVideo?.id === lecture.id ? "🔊" : "▶"}
                      </span>
                      <div className="lecture-row-details">
                        <p className="lecture-row-title">{lecture.title}</p>
                        <span className="lecture-row-type">{lecture.type || 'Video'}</span>
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
  );
};