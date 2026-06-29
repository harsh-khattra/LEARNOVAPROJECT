import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lmsService } from '../services/lmsService';
import './ManageContent.css';
import { useAssetDetails, uploadFileToSupabase } from '../utils/lmsShared';


const SUPABASE_BUCKET_NAME = 'course-content'; 

export const ManageContentPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [syllabus, setSyllabus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chapter States
  const [chapterTitle, setChapterTitle] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Asset States
  const [assetTitle, setAssetTitle] = useState('');
  const [assetType, setAssetType] = useState<'youtube' | 'video' | 'pdf'>('youtube');
  const [assetUrl, setAssetUrl] = useState('');
  const [assetFile, setAssetFile] = useState<File | null>(null);
  const [assetStatus, setAssetStatus] = useState<'published' | 'draft'|'pending'>('draft');
  const [savingAsset, setSavingAsset] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Preview Hook
  const [previewAsset, setPreviewAsset] = useState<any>(null);
  const {
    videoDescription,
    playlistVideos,
    selectedVideo,
    playlistLoading,
    setSelectedVideo,
    setPlaylistVideos
  } = useAssetDetails(previewAsset);

  const getSafeEmbedUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('list=')) {
      const playlistId = url.split('list=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    }
    if (url.includes('v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const loadSyllabus = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await lmsService.fetchCourseSyllabus(courseId);
      setSyllabus(data || []);
    } catch (error) {
      console.error('Error fetching syllabus:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, [courseId]);

  // --- CHAPTER CRUD ---
  const handleAddChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim() || !courseId) return;

    try {
      if (editingChapterId) {
        await lmsService.updateChapter(editingChapterId, { title: chapterTitle });
        setEditingChapterId(null);
      } else {
        const nextOrder = syllabus.length + 1;
        await lmsService.addChapter(courseId, chapterTitle, nextOrder);
      }
      setChapterTitle('');
      loadSyllabus();
    } catch {
      alert('Failed to save chapter.');
    }
  };

  const startEditChapter = (chapter: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChapterId(chapter.id);
    setChapterTitle(chapter.title);
  };

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chapter and all its assets?')) return;

    try {
      await lmsService.deleteChapter(chapterId);
      loadSyllabus();
    } catch {
      alert('Failed to delete chapter.');
    }
  };

  // --- ASSET CRUD ---
  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeChapterId || !assetTitle.trim()) {
      return alert('Please enter title.');
    }

    if (assetType === 'youtube' && !assetUrl.trim()) {
      return alert('Please enter YouTube URL.');
    }

    if (!editingAssetId && assetType !== 'youtube' && !assetFile) {
      return alert(`Please select ${assetType.toUpperCase()} file`);
    }

    try {
      setSavingAsset(true);
      let finalPayload = assetUrl;
      console.log("Form submit with storage bucket sync:", SUPABASE_BUCKET_NAME);
      
      // Local File upload handling
      if (assetType !== 'youtube' && assetFile) {
        const folderName = assetType === 'pdf' ? 'pdfs' : 'videos';
        // Using our unified bucket name token
        finalPayload = await uploadFileToSupabase(SUPABASE_BUCKET_NAME, folderName, assetFile);
      }

      if (editingAssetId) {
        await lmsService.updateContentAsset(editingAssetId, {
          title: assetTitle,
          type: assetType,
          payload: assetFile ? finalPayload : assetUrl || undefined,
          status: assetStatus,
        });
        setEditingAssetId(null);
      } else {
        await lmsService.addContentAsset({
          chapterId: activeChapterId,
          title: assetTitle,
          type: assetType,
          payload: finalPayload,
          status: assetStatus, 
        });
      }

      // Reset Form State completely
      setAssetTitle('');
      setAssetUrl('');
      setAssetFile(null);
      setAssetStatus('draft'); 
      setActiveChapterId(null);
      loadSyllabus();
      alert('Asset processed successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving or uploading content asset. Ensure Supabase bucket exists and is Public.');
    } finally {
      setSavingAsset(false);
    }
  };

  const startEditAsset = (chapterId: string, content: any, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setActiveChapterId(chapterId);
    setEditingAssetId(content.id);
    setAssetTitle(content.title);
    setAssetType(content.type);
    setAssetStatus(content.status === 'draft' ? 'draft' : 'published');
    setAssetUrl(content.content_url || content.url || '');
  };

  const handleDeleteAsset = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this lecture asset?')) return;

    try {
      await lmsService.deleteContentAsset(assetId);
      loadSyllabus();
    } catch {
      alert('Failed to delete asset.');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading Curriculum Blueprints...</div>;
  }

  return (
    <div className="manage-content-container">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/learning/teacher/dashboard')}>
            ◀ Back to Course Dashboard
          </button>
          <h1 className="page-title">Course Content Architect</h1>
        </div>
      </div>

      <div className="content-grid">
        {/* LEFT PANEL: SYLLABUS LIST */}
        <div>
          <h3 className="section-title">Active Curriculum Schema</h3>

          {syllabus.length === 0 ? (
            <div className="empty-state">
              No modular chapters built yet. Start by defining your first course module.
            </div>
          ) : (
            syllabus.map((chapter, index) => (
              <div key={chapter.id} className="chapter-card">
                <div className="chapter-header">
                  <span className="chapter-main-title">
                    Module {index + 1}: {chapter.title}
                  </span>

                  <div className="chapter-actions">
                    <button className="icon-btn edit-btn" onClick={(e) => startEditChapter(chapter, e)} title="Edit Chapter Name">
                      ✏️
                    </button>
                    <button className="icon-btn delete-btn" onClick={(e) => handleDeleteChapter(chapter.id, e)} title="Delete Chapter">
                      🗑️
                    </button>
                    <button
                      className="add-asset-btn"
                      onClick={() => {
                        setEditingAssetId(null); 
                        setAssetTitle('');
                        setAssetUrl('');
                        setAssetFile(null);
                        setAssetStatus('draft');
                        setActiveChapterId(chapter.id);
                      }}
                    >
                      + Add Lecture
                    </button>
                  </div>
                </div>

                <div className="chapter-content">
                  {chapter.contents?.length > 0 ? (
                    chapter.contents.map((content: any) => {
                      return (
                        <div key={content.id} className="asset-row" onClick={() => setPreviewAsset(content)}>
                          <div className="asset-info">
                            <span>{content.type === 'pdf' ? '📄' : '▶️'}</span>
                            <span className="asset-title">{content.title}</span>
                            <span className="asset-badge">{content.type}</span>
                            
                            <span className={`status-badge-indicator ${content.status || 'draft'}`}>
                              {content.status === 'published' && '🟢 Published'}
                              {content.status === 'pending' && '⏳ Pending Admin Approval'}
                              {(content.status === 'draft' || !content.status) && '🔘 Draft'}
                            </span>
                          </div>

                          <div className="asset-row-actions">
                            <button className="icon-btn edit-small-btn" onClick={(e) => startEditAsset(chapter.id, content, e)}>
                              ✏️ Edit
                            </button>
                            <button className="icon-btn delete-small-btn" onClick={(e) => handleDeleteAsset(content.id, e)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-content">No lectures added yet.</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT PANEL: ACTIONS FORM */}
        <div className="right-panel">
          <div className="card">
            <h4 className="card-title">
              {editingChapterId ? '⚠️ Update Chapter Title' : 'Create New Chapter'}
            </h4>

            <form onSubmit={handleAddChapterSubmit} className="form-column">
              <input
                type="text"
                placeholder="e.g. Intro to Routing Setup"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="form-input"
                required
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="primary-btn" style={{ flex: 1 }}>
                  {editingChapterId ? 'Apply Title Update' : 'Create Module Block'}
                </button>
                {editingChapterId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditingChapterId(null);
                      setChapterTitle('');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {activeChapterId && (
            <div className="asset-form-card">
              <div className="asset-form-header">
                <h4>
                  {editingAssetId ? '📝 Edit Lecture Asset' : 'Append Lecture Asset'}
                </h4>
                <button
                  className="close-btn"
                  onClick={() => {
                    setActiveChapterId(null);
                    setEditingAssetId(null);
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddAssetSubmit} className="form-column">
                <div>
                  <label className="form-label">Lecture Title</label>
                  <input
                    type="text"
                    value={assetTitle}
                    onChange={(e) => setAssetTitle(e.target.value)}
                    placeholder="Lecture title"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Content Type</label>
                  <select
                    value={assetType}
                    onChange={(e: any) => setAssetType(e.target.value)}
                    className="form-input"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Publishing Action</label>
                  <select
                    value={assetStatus}
                    onChange={(e: any) => setAssetStatus(e.target.value as any)}
                    className="form-input"
                  >
                    <option value="draft">🔘 Save as Draft (Internal Structure)</option>
                    <option value="pending">🚀 Send to Admin for Live Approval</option>
                    {assetStatus === 'published' && (
                      <option value="published" disabled>🟢 Approved & Live (By Admin)</option>
                    )}
                  </select>
                </div>

                {assetType === 'youtube' ? (
                  <div>
                    <label className="form-label">YouTube URL / Playlist</label>
                    <input
                      type="url"
                      value={assetUrl}
                      onChange={(e) => setAssetUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="form-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="form-label">
                      Upload File {editingAssetId && <span style={{ color: '#eb5757', fontSize: '11px' }}>(Leave empty to keep current file)</span>}
                    </label>
                    <input
                      type="file"
                      className="form-input"
                      accept={assetType === 'video' ? 'video/mp4,video/mkv' : 'application/pdf'}
                      onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                    />
                  </div>
                )}

                <button type="submit" disabled={savingAsset} className="primary-btn">
                  {savingAsset ? 'Processing...' : editingAssetId ? 'Update Lecture details' : 'Commit Lecture Asset'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* PREVIEW OVERLAY MODAL */}
      {previewAsset && (
        <div className="preview-overlay">
          <div className="preview-modal">
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="preview-badge">
                  {playlistVideos.length > 0 ? 'Playlist Series' : `${previewAsset.type} Preview`}
                </span>
                <h3>
                  {previewAsset.title}
                  {selectedVideo && ` - [ ${selectedVideo.title} ]`}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setPreviewAsset(null);
                  setPlaylistVideos([]);
                  setSelectedVideo(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="video-section">
                <div className="video-frame" style={{ minHeight: '400px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                  {playlistLoading ? (
                    <div className="loading-video">Loading Playlist...</div>
                  ) : playlistVideos.length > 0 && selectedVideo ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                      title={selectedVideo.title}
                      allowFullScreen
                      style={{ border: 'none', width: '100%', height: '400px' }}
                    />
                  ) : previewAsset.type === 'youtube' ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={getSafeEmbedUrl(previewAsset.content_url || previewAsset.url)}
                      title={previewAsset.title}
                      allowFullScreen
                      style={{ border: 'none', width: '100%', height: '400px' }}
                    />
                  ) : previewAsset.type === 'video' ? (
                    <video 
                      src={previewAsset.content_url || previewAsset.url} 
                      controls 
                      autoPlay 
                      className="video-player" 
                      style={{ width: '100%', height: '400px', objectFit: 'contain' }}
                    />
                  ) : (
                    /* 📄 FIXED PDF PREVIEW: Explicit inline dimension parameters added to stop layout collapsing */
                    <iframe 
                      src={`${previewAsset.content_url || previewAsset.url}#toolbar=0`} 
                      title={previewAsset.title} 
                      className="pdf-frame" 
                      style={{ width: '100%', height: '550px', border: 'none', background: '#ffffff' }}
                    />
                  )}
                </div>

                <div className="description-box">
                  <h4>📄 Video Description Details</h4>
                  <div className="description-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {videoDescription}
                  </div>
                </div>
              </div>

              {playlistVideos.length > 0 && (
                <div className="playlist-sidebar">
                  <div className="playlist-header">
                    <label>🔀 QUICK SELECT VIDEO</label>
                    <select
                      value={selectedVideo?.videoId || ''}
                      onChange={(e) => {
                        const found = playlistVideos.find((v) => v.videoId === e.target.value);
                        if (found) setSelectedVideo(found);
                      }}
                    >
                      {playlistVideos.map((video, idx) => (
                        <option key={video.videoId} value={video.videoId}>
                          Vid {idx + 1}: {video.title.substring(0, 35)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="playlist-list">
                    {playlistVideos.map((video, idx) => {
                      const isCurrent = selectedVideo?.videoId === video.videoId;
                      return (
                        <div
                          key={video.videoId}
                          onClick={() => setSelectedVideo(video)}
                          className={`playlist-item ${isCurrent ? 'active' : ''}`}
                        >
                          <div className="playlist-number">VIDEO {idx + 1}</div>
                          <div className="playlist-title">{video.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};