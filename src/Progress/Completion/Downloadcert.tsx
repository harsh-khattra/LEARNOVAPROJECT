import "./Downloadcert.css";
import React from "react";
import html2canvas from "html2canvas";

// ── Download Function ─────────────────────────────────────────────────────────

const downloadCertificate = async () => {
  const element = document.getElementById("certificate-content");
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  // PNG directly Chrome downloads mein jayega
  const link = document.createElement("a");
  link.download = "Sandeep_Kumar_Certificate.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const BlurredText = ({ width }: { width: number }) => (
  <span className="blur-text" style={{ width }} />
);

// ── Sub-components ────────────────────────────────────────────────────────────

const UdemyLogo: React.FC = () => (
  <div className="udemy-logo">
    <div className="udemy-u"></div>
    <span className="udemy-name"></span>
  </div>
);

const BeAbleBadge: React.FC = () => (
  <div className="badge-wrapper">
    <div className="ribbon-left" />
    <div className="badge-circle"></div>
    <div className="ribbon-right" />
  </div>
);

const Certificate: React.FC = () => (
  <div className="cert-box" id="certificate-content">
    <h1 className="cert-title">Certificate of Completion</h1>

    <p className="cert-body">
      This is to certify that <strong>Sandeep Kumar</strong> has successfully
      completed the course "Web Development Bootcamp", instructed by Rahul
      Sharma. Course Completion Date:{" "}
      {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
    </p>
    <p className="cert-date">
      course on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </p>

    <div className="cert-sigs">
      <div className="sig-block">
        <span className="sig-line" />
        <span style={{ fontSize: 11, color: "#777" }}>Instructor</span>
      </div>
      <span className="sig-amp">&amp;</span>
      <UdemyLogo />
    </div>

    <div className="cert-footer">
      <div className="cert-ids">
        <div>
          Certificate no: <BlurredText width={60} />
        </div>
        <div>
          Certificate url: <BlurredText width={80} />
        </div>
      </div>
      <BeAbleBadge />
    </div>
  </div>
);

const RecipientCard: React.FC = () => (
  <div className="recipient-card">
    <div className="avatar">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
    <div>
      <div className="recipient-name">Sandeep Kumar</div>
      <div className="recipient-role">
        Experienced Quality Manager · Six Sigma Coach
      </div>
    </div>
  </div>
);

const Sidebar: React.FC = () => {
  const [showShare, setShowShare] = React.useState(false);

  const shareUrl = window.location.href;
  const shareText = "I just completed 'Web Development Bootcamp' on Udemy! 🎉";

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <aside className="cert-sidebar">
      <div className="sidebar-section">
        <p className="sidebar-label">Certificate Recipient:</p>
        <RecipientCard />
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">About the Course:</p>

        <div className="course-info-box">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{
              width: "40px", height: "40px", background: "#a435f0",
              borderRadius: "6px", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>Web Development Bootcamp</div>
              <div style={{ fontSize: "11px", color: "#6a6f73", marginTop: "2px" }}>by Rahul Sharma</div>
            </div>
          </div>

          <p style={{ fontSize: "11px", color: "#6a6f73", lineHeight: 1.5, marginBottom: "10px" }}>
            Full-stack web development from HTML & CSS to React, Node.js, and databases.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[
              { val: "63.5", key: "Total hours" },
              { val: "54", key: "Sections" },
              { val: "★★★★★", key: "4.7 rating" },
              { val: "Jul '19", key: "Completed" },
            ].map((item) => (
              <div key={item.key} style={{
                background: "#f7f9fa", borderRadius: "6px",
                padding: "8px", textAlign: "center", border: "1px solid #d1d7dc",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: item.key === "4.7 rating" ? "#e59819" : "#1c1d1f" }}>
                  {item.val}
                </div>
                <div style={{ fontSize: "10px", color: "#6a6f73", marginTop: "1px" }}>{item.key}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="btn-row">
          <button className="cert-btn" onClick={downloadCertificate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>

          <div style={{ position: "relative" }}>
            <button className="cert-btn" onClick={() => setShowShare(!showShare)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>

            {showShare && (
              <div style={{
                position: "absolute", top: "40px", right: 0,
                background: "#fff", border: "1px solid #d1d7dc",
                borderRadius: "8px", padding: "8px", zIndex: 10,
                display: "flex", flexDirection: "column", gap: "6px", width: "160px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}>
                {/* LinkedIn */}
<a href={shareLinks.linkedin} target="_blank" rel="noreferrer"
  style={{ fontSize: "13px", color: "#0077b5", padding: "6px 8px", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
  onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077b5">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
  LinkedIn
</a>

{/* WhatsApp */}
<a href={shareLinks.whatsapp} target="_blank" rel="noreferrer"
  style={{ fontSize: "13px", color: "#25d366", padding: "6px 8px", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
  onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.17 1.541 5.943L.057 23.571a.75.75 0 0 0 .937.912l5.828-1.53A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.504-5.25-1.385l-.372-.214-3.863 1.015 1.034-3.772-.234-.384A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
  WhatsApp
</a>

{/* Twitter/X */}
<a href={shareLinks.twitter} target="_blank" rel="noreferrer"
  style={{ fontSize: "13px", color: "#000", padding: "6px 8px", borderRadius: "6px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
  onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
  Twitter
</a>
              </div>
            )}
          </div>
        </div>

        <p className="update-link">
          Update your certificate with your
          <br />
          correct name or preferred language
        </p>
      </div>
    </aside>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Downoadcert: React.FC = () => (
  <div className="cert-page">
    <div className="cert-layout">
      <div className="cert-left">
        <Certificate />
       <p className="cert-verify">
  This is to certify that Sandeep Kumar has successfully completed the
  course "Web Development Bootcamp", instructed by Rahul Sharma. Course
  Completion Date: {new Date("2019-07-11").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
</p>
      </div>
      <Sidebar />
    </div>
  </div>
);

export default Downoadcert;