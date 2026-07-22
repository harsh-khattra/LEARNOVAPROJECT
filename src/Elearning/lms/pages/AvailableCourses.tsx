import React, { useEffect, useState } from 'react';
import { lmsService } from '../services/lmsService';
import { SupabaseClient } from '../../../Helper/Supabase';
import type { Course } from '../types/lms';
import { CourseCard } from '../components/CourseCard';
import Loader2 from '../../Header/Loader2';
import Enrollment from '../../../Progress/Enrollment/Enroll'; 

import './courseDashboard.css'






import './availableCourses.css';

// import './availableCourses.css';








export const AvailableCourses: React.FC = () => {
      const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY; 
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  //  NEW STATES FOR YOUTUBE STREAM
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [ytLoading, setYtLoading] = useState(false);

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);

  // 1. Initial Database Setup (Load local courses)
  useEffect(() => {
    const loadStudentCatalog = async () => {
      try {
        setLoading(true);
        const data = await lmsService.fetchCourses('all');
        const approvedCourses = data.filter((course) => course.status === 'published');
        setCourses(approvedCourses);

        // Logged-in user ke existing enrollments fetch karo
        const {
          data: { user },
        } = await SupabaseClient.auth.getUser();

        if (user) {
          const enrolledIds = await lmsService.fetchEmployeeEnrollments(user.id);
          setEnrolledCourseIds(enrolledIds);
        }
      } catch (err) {
        console.error("Error loading student course catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentCatalog();
  }, []);

  // Yeh useEffect tabhi chalega jab searchQuery badlegi, par 600ms rukne ke baad!
  useEffect(() => {
    if (!searchQuery.trim()) {
      setYtVideos([]); // Agar search box khali hai toh data clear karo
      return;
    }
 
    const fetchYouTubeData = async () => {
      try {
        setYtLoading(true);
        const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchQuery)}&type=video&key=${YT_API_KEY}`;
        
        const response = await fetch(endpoint);
        const result = await response.json();
        
        if (result.items) {
          setYtVideos(result.items);
        }
      } catch (error) {
        console.error("Failed to stream supplemental YouTube tokens:", error);
      } finally {
        setYtLoading(false);
      }
    };
  
    //  Quota Saver: Timer triggers endpoint only if user stops typing for 600ms
    const delayDebounceTimer = setTimeout(() => {
      fetchYouTubeData();
    }, 600);

    return () => clearTimeout(delayDebounceTimer);
  }, [searchQuery]);

  // Local filtering calculation
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartLearning = (id: string) => {
    const course = courses.find((c) => c.id === id) || null;
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };
      // Function to save a video to the sandbox
const handleSaveToPlaylist = async (video: any) => {
  try {
    const { data: { user } } = await SupabaseClient.auth.getUser();
    
    if (!user) {
      alert("Please log in to save resources to your sandbox!");
      return;
    }

    // Check for duplicates first
    const { data: existing } = await SupabaseClient
      .from('student_playlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', video.id.videoId)
      .maybeSingle();

    if (existing) {
      alert("This resource is already in your Learnova Sandbox! 📚");
      return;
    }

    // Save to database
    const { error } = await SupabaseClient
      .from('student_playlists')
      .insert({
        user_id: user.id,
        video_id: video.id.videoId,
        video_title: video.snippet.title,
        thumbnail_url: video.snippet.thumbnails.medium.url,
        channel_title: video.snippet.channelTitle
      });

    if (error) throw error;
    alert("🎉 Successfully added to your Personal Sandbox!");

  } catch (err) {
    console.error("Failed to save resource:", err);
  }
};

  const closeEnrollModal = () => {
    setShowEnrollModal(false);
    setSelectedCourse(null);
  };

  const handleEnrolledSuccess = (courseId: string) => {
    setEnrolledCourseIds((prev) =>
      prev.includes(courseId) ? prev : [...prev, courseId]
    );
  };

 if (loading) {

  return <Loader2 />;
  
}

  return (
    <div className="dashboard-container">
      <div className="hero-banner student-theme">
        <div className="hero-body">
          <h1 className="hero-title">🎓 Student Study Terminal</h1>
          <p className="hero-subtitle">
            Browse corporate academic courses approved by your organization's experts. Learn at your own pace.
          </p>
          <br/>
          <div className="search-container">
            <input 
              type="text"
              className="search-input"
              placeholder="Type to search database & global open source streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <main className="main-content">
   
        <div className="workspace-header">
          <h2 className="workspace-title">Available Academic Programs</h2>
        </div>

        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">No approved database courses match your criteria.</div>
          ) : (
            filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isTeacher={false} 



                isEnrolled={enrolledCourseIds.includes(course.id)}
                onManageContent={(_id: string) => {}} 
                onPublish={(_id: string) => {}}
                onRevertToDraft={(_id: string) => {}}
                onDelete={(_id: string) => {}}


               


                onStartLearning={handleStartLearning}
              />
            ))
          )}
        </div>

      
    {searchQuery.trim() && (
  <div className="youtube-supplemental-section">
    <hr className="youtube-divider" />

    <div className="workspace-header">
      <h2 className="workspace-title youtube-title">
        <span className="youtube-title-text">
          🔴 Global Open-Source Learning Stream (YouTube)
        </span>
      </h2>

      <p className="youtube-subtitle">
        Top verified open resources for "{searchQuery}"
      </p>
    </div>

    {ytLoading ? (
      <div className="youtube-loading">
        Fetching live streams from satellite channels... ⚡
      </div>
    ) : ytVideos.length === 0 ? (
      <div className="youtube-empty">
        No global open video metrics resolved.
      </div>
    ) : (
      <div className="course-grid youtube-grid">
        {ytVideos.map((video) => (
          <div key={video.id.videoId} className="course-card-mock youtube-card">
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="youtube-thumbnail"
            />

            <div className="youtube-card-content">
              <div>
                <h4 className="youtube-video-title">
                  {video.snippet.title}
                </h4>

                <p className="youtube-channel">
                  By: {video.snippet.channelTitle}
                </p>
              </div>

             <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
  <button 
    onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id.videoId}`, '_blank')}
    style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
  >
    Watch 📺
  </button>
  <button 
    onClick={() => handleSaveToPlaylist(video)}
    style={{ flex: 1, padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
  >
    Save 📁
  </button>
</div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}
      </main>

      {/* Enrollment Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="modal-overlay" onClick={closeEnrollModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <Enrollment
              course={selectedCourse}
              onClose={closeEnrollModal}
              onEnrolled={handleEnrolledSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};