import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '../../../Helper/Supabase';
interface Playlist {
  id: string;
  title: string;
}

interface AddContentFormProps {
  courseId: string;
  onSuccess?: () => void;
}

export const AddContentForm: React.FC<AddContentFormProps> = ({ courseId, onSuccess }) => {
  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'video' | 'pdf'>('video');
  const [playlistId, setPlaylistId] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  // Playlists dropdown ke liye state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  // Course ki playlists fetch karne ke liye
  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data, error } = await SupabaseClient
        .from('playlists')
        .select('id, title')
        .eq('course_id', courseId);
      
      if (!error && data) setPlaylists(data);
    };
    fetchPlaylists();
  }, [courseId]);

  // Main Submit Handler
  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!title || !mediaFile || !thumbnailFile || !playlistId) {
      alert('Please fill all required fields and upload files!');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Thumbnail (Public Bucket)
      const thumbExt = thumbnailFile.name.split('.').pop();
      const thumbName = `${Date.now()}_thumb.${thumbExt}`;
      const { error: thumbUploadError } = await SupabaseClient.storage
        .from('thumbnails')
        .upload(thumbName, thumbnailFile);

      if (thumbUploadError) throw thumbUploadError;

      const { data: thumbUrlData } = SupabaseClient.storage
        .from('thumbnails')
        .getPublicUrl(thumbName);
      
      const thumbnailUrl = thumbUrlData.publicUrl;

      // 2. Upload Media File (Videos or lesson_files Bucket)
      const targetBucket = contentType === 'video' ? 'videos' : 'lesson_files';
      const mediaExt = mediaFile.name.split('.').pop();
      const mediaName = `${Date.now()}_content.${mediaExt}`;
      
      const { error: mediaUploadError } = await SupabaseClient.storage
        .from(targetBucket)
        .upload(mediaName, mediaFile);

      if (mediaUploadError) throw mediaUploadError;

      // 3. Save to Database Table (contents)
      const { error: dbError } = await SupabaseClient
        .from('contents')
        .insert([
          {
            title,
            description,
            playlist_id: playlistId,
            content_type: contentType,
            thumbnail_url: thumbnailUrl,
            video_url: mediaName, // Yahan storage path/name save kar rahe hain kyunki ye private hai
            status: status
          }
        ]);

      if (dbError) throw dbError;

      alert(`Content successfully saved as ${status}!`);
      // Form reset
      setTitle('');
      setDescription('');
      setMediaFile(null);
      setThumbnailFile(null);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Content (Video/PDF)</h2>
      
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Content Title *</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g., Intro to React Hooks"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Briefly describe this topic..."
          />
        </div>

        {/* Playlist Selector */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Select Playlist/Chapter *</label>
          <select 
            value={playlistId} 
            onChange={(e) => setPlaylistId(e.target.value)}
            className="w-full p-2 border rounded-md outline-none"
          >
            <option value="">-- Choose a Playlist --</option>
            {playlists.map(pl => (
              <option key={pl.id} value={pl.id}>{pl.title}</option>
            ))}
          </select>
        </div>

        {/* Content Type Toggle */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Content Type</label>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => { setContentType('video'); setMediaFile(null); }}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${contentType === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              📹 Video Lecture
            </button>
            <button 
              type="button"
              onClick={() => { setContentType('pdf'); setMediaFile(null); }}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${contentType === 'pdf' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              📄 PDF Document
            </button>
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Thumbnail *</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Main Media File Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {contentType === 'video' ? 'Upload Video File (.mp4, .mkv) *' : 'Upload PDF File *'}
          </label>
          <input 
            type="file" 
            accept={contentType === 'video' ? 'video/*' : '.pdf'}
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('draft')}
            className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('published')}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Uploading...' : ' Publish Now'}
          </button>
        </div>
      </div>
    </div>
  );
};