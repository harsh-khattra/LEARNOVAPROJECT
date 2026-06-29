import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import './CoursePlayer.css'
export const CoursePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<any>(null); // Acts as active content (Video or PDF)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchFullCourseContent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      console.log("🚀 Player Mount Hua! Fetching for Course ID:", id);
      
      const data = await lmsService.fetchCourses('all');
      console.log("📦 Supabase se saara data aaya:", data);

      const currentCourse = data.find((c: any) => c.id === id);
      console.log("🎯 Match Hone Wala Course:", currentCourse);

      if (!currentCourse) {
        console.warn("❌ Yeh ID data mein nahi mili!");
        setError("Requested academic course could not be found.");
        return;
      }

      setCourse(currentCourse);

      if (currentCourse.chapters && currentCourse.chapters.length > 0) {
        const firstChapter = currentCourse.chapters[0];
        if (firstChapter.contents && firstChapter.contents.length > 0) {
          setActiveVideo(firstChapter.contents[0]);
        }
      }
    } catch (err) {
      console.error("💥 Player crash error:", err);
      setError("Failed to stream playlist metadata.");
    } finally {
      setLoading(false);
    }
  };

  fetchFullCourseContent();
}, [id]);

  // Helper to detect and format YouTube URLs
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    }
    return null;
  };

  if (loading) return <div className="player-loading">Syncing Academic Content Streams...</div>;
  if (error || !course) return <div className="player-error">⚠️ {error || "Course offline"}</div>;

  // Smart URL and Type Detection
  const currentUrl = activeVideo?.content_url || activeVideo?.url || '';
  const youtubeEmbedUrl = getYouTubeEmbedUrl(currentUrl);
  
  // Detect if the content is a PDF (by content type or file extension)
  const isPdf = activeVideo?.type?.toLowerCase() === 'pdf' || 
                currentUrl.toLowerCase().includes('.pdf') || 
                activeVideo?.lecture_row_type?.toLowerCase() === 'pdf';

  return (
    <div className="course-player-workspace">
      
      {/* LEFT SIDE: Dynamic Viewport (Player or Document Viewer) */}
      <div className="video-viewport-area">
        <div className="video-wrapper">
          {activeVideo && currentUrl ? (
            
            /* 1️⃣ IF CONTENT IS A PDF */
            isPdf ? (
              <iframe
                key={activeVideo.id}
                src={`${currentUrl}#toolbar=0`} // #toolbar=0 disables downloading/printing if supported
                title={activeVideo.title || "PDF Document"}
                className="main-html5-player"
                style={{ border: 'none', width: '100%', height: '100%', background: '#fff' }}
              />
            ) : 
            
            /* 2️⃣ IF CONTENT IS A YOUTUBE VIDEO */
            youtubeEmbedUrl ? (
              <iframe
                key={activeVideo.id}
                src={youtubeEmbedUrl}
                title={activeVideo.title || "YouTube Video Player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="main-html5-player"
                style={{ border: 'none', width: '100%', height: '100%' }}
              />
            ) : (
              
              /* 3️⃣ IF CONTENT IS A SUPABASE STORAGE VIDEO (.mp4) */
              <video 
                key={activeVideo.id}
                src={currentUrl} 
                controls 
                autoPlay
                controlsList="nodownload"
                className="main-html5-player"
              />
            )
          ) : (
            <div className="video-placeholder-box">
              🎬 No active secure streaming link attached to this topic yet.
            </div>
          )}
        </div>
        
        {/* Content Metadata */}
        <div className="video-metadata-card">
          <span className="badge-category">{course.category}</span>
          <h1 className="playing-lecture-title">
            {activeVideo ? activeVideo.title : "Welcome to " + course.title}
          </h1>
          <p className="playing-course-context">{course.description}</p>
        </div>
      </div>

      {/* RIGHT SIDE: Playlist Sidebar */}
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
                        {activeVideo?.id === lecture.id ? "🔊" : (lecture.type?.toLowerCase() === 'pdf' ? "📄" : "▶")}
                      </span>
                      <div className="lecture-row-details">
                        <p className="lecture-row-title">{lecture.title}</p>
                        <span className="lecture-row-type">{lecture.type || 'Video'}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="empty-lecture-notice">No content inside this module.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};