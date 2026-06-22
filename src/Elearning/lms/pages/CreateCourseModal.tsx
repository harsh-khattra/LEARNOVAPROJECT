import React, { useState } from 'react';
import { SupabaseClient } from '../../../Helper/Supabase';

export const CreateCourseModal: React.FC<{ onClose: () => void; onRefresh: () => void }> = ({ onClose, onRefresh }) => {
  // 1. Existing form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  
  // ADD THIS STATE: For tracking the subject's unique YouTube Playlist ID
  const [youtubePlaylistId, setYoutubePlaylistId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 2. Update your submit handler to push the playlist to Supabase
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Check if they pasted a full URL, and automatically extract just the ID string
      let cleanPlaylistId = youtubePlaylistId;
      if (youtubePlaylistId.includes('list=')) {
        cleanPlaylistId = youtubePlaylistId.split('list=')[1].split('&')[0];
      }

      // Insert into your Supabase 'courses' table
      const { error } = await SupabaseClient
        .from('courses')
        .insert([
          {
            title: title,
            description: description,
            thumbnail_url: thumbnailUrl,
            created_by: '00000000-0000-0000-0000-000000000000', // Your verified user ID profile key
            youtube_playlist_id: cleanPlaylistId //  THIS SENDS IT TO SUPABASE!
          }
        ]);

      if (error) throw error;

      alert('Course subject track initialized successfully!');
      onRefresh(); // Reload dashboard tracking matrix
      onClose();   // Close the modal canvas view
    } catch (err) {
      console.error(err);
      alert('Failed to register course structure inside Supabase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <form onSubmit={handleCreateCourse} className="modal-surface-card">
        <h3>Create New Subject Stream</h3>
        
        <div className="form-input-wrapper">
          <label>Course Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-input-wrapper">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="form-input-wrapper">
          <label>Thumbnail Cover Image URL</label>
          <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
        </div>

        {/*  ADD THIS INPUT FIELD TO YOUR FORM LAYOUT */}
        <div className="form-input-wrapper" style={{ marginTop: '12px' }}>
          <label style={{ fontWeight: '700', color: '#2563eb' }}>YouTube Playlist Link or ID</label>
          <input 
            type="text" 
            placeholder="e.g., PL4Gr5tOAPUt7yN4t5mK70w4..." 
            value={youtubePlaylistId} 
            onChange={(e) => setYoutubePlaylistId(e.target.value)}
            required 
          />
          <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
            Paste the full YouTube playlist link. The app will automatically isolate your single playlist channel tracking key.
          </small>
        </div>

        <div className="modal-actions-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn-close-cancel">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-submit-save">
            {submitting ? 'Uploading Core Data...' : 'Create Course Track'}
          </button>
        </div>
      </form>
    </div>
  );
};