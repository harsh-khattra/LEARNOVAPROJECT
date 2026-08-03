import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '../../../Helper/Supabase';
import './mySandbox.css';
import Loader2 from '../../Header/Loader2';
import toast from 'react-hot-toast';
interface SavedVideo {
  id: string;
  video_id: string;
  video_title: string;
  thumbnail_url: string;
  channel_title: string;
}

export const MySandbox: React.FC = () => {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPlaylist();
  }, []);

  const fetchMyPlaylist = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await SupabaseClient.auth.getUser();

      if (user) {
        const { data, error } = await SupabaseClient
          .from('student_playlists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSavedVideos(data || []);
      }
    } catch (err) {
      console.error("Error loading sandbox:", err);
    } finally {
      setLoading(false);
    }
  };

const handleRemove = async (idToRemove: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this video from your Sandbox?"
  );

  if (!confirmed) return;

  try {
    const { error } = await SupabaseClient
      .from('student_playlists')
      .delete()
      .eq('id', idToRemove);

    if (error) throw error;

    setSavedVideos((prev) =>
      prev.filter((video) => video.id !== idToRemove)
    );

    toast.success("Video removed from Sandbox.");
  } catch (err) {
    console.error("Failed to remove item:", err);
    toast.error("Failed to remove video.");
  }
};
if (loading) {

  return <Loader2 />;
  
}

return (
    <div className="sandbox-dashboard-container">
      {/* BLUE HERO BANNER */}
      <div className="sandbox-hero-banner">
        <div className="hero-body">
          <h1 className="hero-title"> My Learnova Sandbox</h1>
          <p className="hero-subtitle">
            ⏺Your personal library of saved external tutorials and global learning resources.
          </p>
        </div>
      </div>

      {/* ⬜ MAIN CONTENT AREA */}
      <main className="sandbox-main-content">
        <div className="workspace-header">
          <h2 className="workspace-title"> 🗁Here is your Saved Resources</h2>
        </div>

        {savedVideos.length === 0 ? (
          <div className="empty-sandbox">
            <h3>Your Sandbox is empty</h3>
            <p>Search for global topics in the course directory and click "Save" to build your library.</p>
          </div>
        ) : (
          <div className="sandbox-grid">
            {savedVideos.map((video) => (
              <div key={video.id} className="sandbox-card">
                <img src={video.thumbnail_url} alt={video.video_title} className="sandbox-thumbnail" />
                <div className="sandbox-card-content">
                  <div>
                    <h4 className="sandbox-video-title">{video.video_title}</h4>
                    <p className="sandbox-channel-name">By: {video.channel_title}</p>
                  </div>
                  <div className="sandbox-actions">
                    <button 
                      className="sandbox-watch-btn"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.video_id}`, '_blank')}
                    >
                      Stream 📺
                    </button>
                    <button 
                      className="sandbox-remove-btn"
                      onClick={() => handleRemove(video.id)}
                    >
                      Remove 🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};