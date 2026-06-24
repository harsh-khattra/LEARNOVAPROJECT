// src/modules/lms/components/AllCoursesGrid.tsx
import React, { useEffect, useState } from 'react';
import { SupabaseClient } from '../../../Helper/Supabase'; // Adjust path if needed


const YOUTUBE_API_KEY = 'AIzaSyDCjS8TxBh4Ddu0KOtdY2yKeHBx83bIcfI';
const PLAYLIST_ID = 'PL9i39jUQljInNAIHUnnZhKrYhLbFt5I_6&index=2';

interface AssetCard {
  id: string;
  title: string;
  type: 'video' | 'pdf';
  metaText: string;
  mediaUrl: string;
}

export const AllCoursesGrid: React.FC = () => {
  const [assets, setAssets] = useState<AssetCard[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'pdf'>('all');
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const loadAllDataSources = async () => {
    try {
      setLoading(true);
      let youtubeVideos: AssetCard[] = [];
      let supabaseAssets: AssetCard[] = [];

      // Stream 1: Fetch Live YouTube Videos
      // CHANGED: Just check if the key exists instead of comparing literal strings
      if (YOUTUBE_API_KEY) {
        try {
          const ytRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}`
          );
          const ytData = await ytRes.json();
          
          if (ytData.items) {
            youtubeVideos = ytData.items.map((item: any, index: number) => ({
              id: item.id,
              title: `1.${index + 1} ${item.snippet?.title || 'Untitled Video'}`,
              type: 'video',
              metaText: 'Video · YouTube Stream',
              mediaUrl: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId}`
            }));
          }
        } catch (ytErr) {
          console.error("YouTube fetch failed, continuing to Supabase...", ytErr);
        }
      }

      // Stream 2: Fetch Live Supabase Uploads (PDFs / Manual Videos)
      try {
        const { data, error } = await SupabaseClient
          .from('contents')
          .select('*');

        if (!error && data) {
          supabaseAssets = data.map((item: any) => {
            const isVideo = item.content_type === 'video' || item.content_type === 'youtube';
            return {
              id: item.id,
              title: item.title,
              type: isVideo ? 'video' : 'pdf',
              metaText: isVideo ? 'Video · Lecture' : 'PDF · Resource Document',
              mediaUrl: item.content_url || '#'
            };
          });
        }
      } catch (sbErr) {
        console.error("Supabase fetch failed, displaying available data...", sbErr);
      }

      // Combine both data streams together seamlessly
      setAssets([...youtubeVideos, ...supabaseAssets]);

    } catch (globalErr) {
      console.error("Error aggregating dashboard assets:", globalErr);
    } finally {
      setLoading(false);
    }
  };

  loadAllDataSources();
}, []);

  const filteredAssets = assets.filter(asset => {
    if (activeTab === 'all') return true;
    return asset.type === activeTab;
  });

  if (loading) return <div className="loading-grid-spinner">Loading Academy Matrix Stream...</div>;

  return (
    <div className="matrix-content-container">
      {/* Horizontal Filter Tabs */}
      <div className="filter-tab-bar">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} 
          onClick={() => setActiveTab('all')}
        >
          All ({assets.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'video' ? 'active' : ''}`} 
          onClick={() => setActiveTab('video')}
        >
          <span className="btn-icon">▷</span> Videos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pdf' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pdf')}
        >
          <span className="btn-icon">📄</span> PDFs
        </button>
      </div>

      {/* Asset Grid */}
      <div className="asset-matrix-grid">
        {filteredAssets.length === 0 ? (
          <div className="no-assets-notice" style={{ padding: '40px', gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8' }}>
            No uploads or videos found matching this section.
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <a 
              key={asset.id} 
              href={asset.mediaUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="asset-structural-card"
            >
              <div className="asset-card-media-box">
                {asset.type === 'video' ? (
                  <div className="blue-play-icon">▷</div>
                ) : (
                  <div className="pdf-outline-icon">
                    <span className="pdf-small-tag">PDF</span>
                  </div>
                )}
              </div>

              <div className="asset-card-text-footer">
                <h3>{asset.title}</h3>
                <p>{asset.metaText}</p>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
};