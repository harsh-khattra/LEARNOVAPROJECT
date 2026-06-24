import React, { useEffect, useState } from "react";
import { lmsService } from "../services/lmsService";
import styles from "./AdminApproval.module.css";

export const AdminApprovalDesk: React.FC = () => {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApprovalQueue = async () => {
    try {
      setLoading(true);
      const data = await lmsService.fetchPendingAssets(); 
      setPendingItems(data || []);
    } catch (error) {
      console.error("Error fetching approval queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovalQueue();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await lmsService.updateContentAsset(id, { status: "published" });
      alert("🎉 Course asset approved! It is now live on the Student Portal.");
      loadApprovalQueue(); 
    } catch {
      alert("Failed to approve the asset.");
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.confirm("Are you sure you want to reject this content? It will return to Teacher's Draft.");
    if (!reason) return;

    try {
      await lmsService.updateContentAsset(id, { status: "draft" });
      alert("↩️ Content rejected and sent back to draft mode.");
      loadApprovalQueue(); 
    } catch {
      alert("Failed to reject the asset.");
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Verifying content queue...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>🛡️ Governance & Course Approval Center</h1>
        <p className={styles.subtitle}>Review and authorize lecture assets published by the instructors</p>
      </header>

      {pendingItems.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎉</div>
          <h3>All Clear!</h3>
          <p>No lectures or courses are currently pending for verification.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {pendingItems.map((item) => (
            <div key={item.id} className={styles.card}>
              
              {/* 📸 COURSE THUMBNAIL (If available) */}
              <div className={styles.imageWrapper}>
                {item.chapters?.courses?.thumbnail_url ? (
                  <img 
                    src={item.chapters.courses.thumbnail_url} 
                    alt="Course Cover" 
                    className={styles.courseThumbnail}
                  />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>📚 No Cover Image</div>
                )}
                <span className={styles.typeBadge}>{item.type}</span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <span className={styles.pendingBadge}>⏳ Pending Review</span>
                </div>

                {/* 🏷️ CONTEXT BADGES: Course & Chapter Tracking */}
                <div className={styles.contextRow}>
                  <span className={styles.courseBadge}>
                    🎯 {item.chapters?.courses?.title || "Unknown Course"}
                  </span>
                  <span className={styles.chapterBadge}>
                    📁 {item.chapters?.title || "Unknown Chapter"}
                  </span>
                </div>

                {/* 🎥 LECTURE DETAILS */}
                <h3 className={styles.contentTitle}>{item.title}</h3>
                
                <div className={styles.previewSection}>
                  <span className={styles.previewLabel}>Source Asset URL:</span>
                  <a 
                    href={item.payload || item.content_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={styles.previewLink}
                  >
                    View Submitted Content 🔗
                  </a>
                </div>

                {/*  ACTION BUTTONS */}
                <div className={styles.actionGroup}>
                  <button 
                    onClick={() => handleApprove(item.id)} 
                    className={styles.approveBtn}
                  >
                    ✅ Approve & Go Live
                  </button>
                  <button 
                    onClick={() => handleReject(item.id)} 
                    className={styles.rejectBtn}
                  >
                    ❌ Send Back to Draft
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};