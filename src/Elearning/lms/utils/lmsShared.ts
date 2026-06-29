import { SupabaseClient } from "../../../Helper/Supabase";
import { useState,useEffect } from "react";
 // Aapka jo bhi supabase client ka path ho

/**
 * Reusable Helper: Kisi bhi file (Image, PDF, Video) ko Supabase Storage me upload karega
 * aur uska public URL return karega.
 */
export const uploadFileToSupabase = async (
  bucketName: string, 
  folderName: string, 
  file: File
): Promise<string> => {
  try {
    // Unique filename banane ke liye timestamp aur random number use kar rahe hain
    const fileExt = file.name.split('.').pop();
    const fileName = `${folderName}/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

    // Supabase bucket me file upload karein
    const { data, error } = await SupabaseClient.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Upload hone ke baad file ka Public URL nikalen
    const { data: publicUrlData } = SupabaseClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error uploading file to bucket ${bucketName}:`, error);
    throw new Error('File upload failed. Check bucket permissions.');
  }
};
export type UserRole = 'teacher' | 'employee' |'admin';

export const createCurrentUser = (role: UserRole) => ({
  id: '00000000-0000-0000-0000-000000000000',
  role,
});

// Temporary user for testing
export const CURRENT_USER = createCurrentUser('teacher');
// Change to 'student' when testing student views

export const formatCoursePrice = (category?: string): string => {
  return category === 'Premium' ? '$ 5.00' : 'Free';
};

// ...rest of your utilities 
export const getStatusBadgeStyles = (status: string | undefined) => {

  if (status === 'published') {

    return { text: '● Published', color: '#065f46', backgroundColor: '#d1fae5', border: '1px solid #a7f3d0' };

  }

  return { text: '○ Draft', color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' };

};



/* =========================================================

   🔥 NEW REUSABLE UTILITIES FOR PLAYER & SILLABUS VIEWS

   ========================================================= */



/**

 * Reusable Helper: Har type ke content ke liye clean emoji return karega

 */

export const getContentTypeIcon = (type: string | undefined): string => {

  switch (type?.toLowerCase()) {

    case 'youtube': return '📺';

    case 'video': return '🎥';

    case 'pdf': return '📄';

    default: return '🔗';

  }

};



/**

 * Reusable Helper: Normal YouTube links ko secure embed format me badlega

 * e.g., https://youtube.com/watch?v=123 -> https://youtube.com/embed/123

 */

export const getYouTubeEmbedUrl = (url: string | undefined): string => {

  if (!url) return '';

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

  const match = url.match(regExp);

  return (match && match[2].length === 11) 

    ? `https://www.youtube.com/embed/${match[2]}` 

    : url;

    

};

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

interface PlaylistVideo {
  title: string;
  description: string;
  videoId: string;
}

export const useAssetDetails = (previewAsset: any) => {
  const [videoDescription, setVideoDescription] = useState<string>('');
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<PlaylistVideo | null>(null);
  const [playlistLoading, setPlaylistLoading] = useState<boolean>(false);

  useEffect(() => {
    let isCurrentRequest = true;

    const fetchAssetDetails = async () => {
      // 1. Clear everything if no asset is selected
      if (!previewAsset) {
        setVideoDescription('');
        setPlaylistVideos([]);
        setSelectedVideo(null);
        return;
      }

      // Default description for uploaded items / PDFs
      setVideoDescription(previewAsset.description || 'Standard resource preview');

      // 2. If it's not a youtube asset, no need to call Google API
      if (previewAsset.type !== 'youtube') {
        setPlaylistVideos([]);
        setSelectedVideo(null);
        return;
      }

      const url = previewAsset.content_url || previewAsset.url || '';

      // CASE A: YouTube Playlist
      if (url.includes('list=')) {
        const playlistId = url.split('list=')[1]?.split('&')[0];
        if (!playlistId) return;

        setPlaylistLoading(true);
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`
          );
          const data = await response.json();

          if (!isCurrentRequest) return;

          if (data.items?.length > 0) {
            const videos = data.items.map((item: any) => ({
              title: item.snippet.title,
              description: item.snippet.description || 'No description available for this video.',
              videoId: item.snippet.resourceId.videoId,
            }));
            setPlaylistVideos(videos);
            setSelectedVideo(videos[0]);
            setVideoDescription(videos[0].description);
          }
        } catch (error) {
          console.error('Error fetching playlist:', error);
        } finally {
          if (isCurrentRequest) setPlaylistLoading(false);
        }
      } 
      // CASE B: Single YouTube Video
      else {
        setPlaylistVideos([]);
        setSelectedVideo(null);

        let videoId = '';
        if (url.includes('v=')) {
          videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }

        if (!videoId) return;

        setPlaylistLoading(true);
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          const data = await response.json();

          if (!isCurrentRequest) return;

          if (data.items && data.items[0]) {
            setVideoDescription(data.items[0].snippet.description || 'No description available for this video.');
          }
        } catch (error) {
          console.error('Error fetching video details:', error);
        } finally {
          if (isCurrentRequest) setPlaylistLoading(false);
        }
      }
    };

    fetchAssetDetails();

    return () => {
      isCurrentRequest = false; // Prevents race conditions
    };
  }, [previewAsset]);

  return {
    videoDescription,
    playlistVideos,
    selectedVideo,
    playlistLoading,
    setSelectedVideo,
    setVideoDescription,
    setPlaylistVideos
  };
};