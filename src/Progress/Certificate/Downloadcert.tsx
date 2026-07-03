import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Downloadcert.css";

/* ---------------------------------------------------------------------- */
/*  Types                                                                  */
/* ---------------------------------------------------------------------- */

type ThemeKey = "gold" | "emerald" | "sapphire";

type CompletedCertificate = {
  id: string;
  courseName: string;
  credentialId: string;
  dateIssued: string;
  grade: string;
  instructorName: string;
  registrarName: string;
  verificationSlug: string;
};

type DownloadCertProps = {
  studentName?: string;
  institute?: string;
  certificates?: CompletedCertificate[];
  onDownloadPdf?: (certificate: CompletedCertificate, displayName: string) => void;
  onCopyVerificationLink?: (url: string) => void;
  onAddToLinkedIn?: (certificate: CompletedCertificate, displayName: string) => void;
};

/* ---------------------------------------------------------------------- */
/*  Mock / fallback data  (replace with real API call if needed)           */
/* ---------------------------------------------------------------------- */

const DEFAULT_CERTIFICATES: CompletedCertificate[] = [
  {
    id: "dsa-course",
    courseName: "DSA Course",
    credentialId: "LN-99231-DS",
    dateIssued: "June 20, 2026",
    grade: "98% (Distinction)",
    instructorName: "Dr. Angela Vy",
    registrarName: "Clara DeVigne",
    verificationSlug: "LN-99231-DS",
  },
  {
    id: "system-design",
    courseName: "System Design Fundamentals",
    credentialId: "LN-88120-SD",
    dateIssued: "May 3, 2026",
    grade: "94% (Distinction)",
    instructorName: "Dr. Angela Vy",
    registrarName: "Clara DeVigne",
    verificationSlug: "LN-88120-SD",
  },
];

const THEME_LABELS: Record<ThemeKey, string> = {
  gold: "Gold Classic",
  emerald: "Emerald",
  sapphire: "Sapphire",
};

const ZOOM_MIN = 60;
const ZOOM_MAX = 140;
const ZOOM_STEP = 10;

/* ---------------------------------------------------------------------- */
/*  Component                                                              */
/* ---------------------------------------------------------------------- */

export default function Downloadcert({
  studentName = "Sarah Jenkins",
  institute = "Learnova Institute",
  certificates = DEFAULT_CERTIFICATES,
  onDownloadPdf,
  onCopyVerificationLink,
  onAddToLinkedIn,
}: DownloadCertProps) {
  // ── 1. Read certificateId from URL ──────────────────────────────────
  //    Certificate.tsx navigates to:
  //    /learning/student/downloadcertificate/:certificateId
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();

  // ── 2. Find the matching certificate  ───────────────────────────────
  //    Match against `id` OR `credentialId` / `verificationSlug`
  //    so both patterns work without extra mapping.
  const initialCert = useMemo(() => {
    if (!certificateId) return certificates[0];
    return (
      certificates.find(
        (c) =>
          c.id === certificateId ||
          c.credentialId === certificateId ||
          c.verificationSlug === certificateId
      ) ?? certificates[0]
    );
  }, [certificates, certificateId]);

  const [selectedId, setSelectedId] = useState(initialCert?.id ?? "");
  const [displayName, setDisplayName] = useState(studentName);
  const [theme, setTheme] = useState<ThemeKey>("gold");
  const [zoom, setZoom] = useState(100);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const certificate = useMemo(
    () => certificates.find((c) => c.id === selectedId) ?? certificates[0],
    [certificates, selectedId]
  );

  const verificationUrl = certificate
    ? `learnova-verify.org/verify/${certificate.verificationSlug}`
    : "";

  function handleZoom(delta: number) {
    setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta)));
  }

  async function handleCopyLink() {
    if (!certificate) return;
    const fullUrl = `https://${verificationUrl}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      /* clipboard unavailable */
    }
    onCopyVerificationLink?.(fullUrl);
  }

  // ── 3. Guard: no certificate found ──────────────────────────────────
  if (!certificate) {
    return (
      <div className="dc-page">
        <div className="dc-empty">
          <p>No certificate found.</p>
          <button
            type="button"
            className="dc-btn dc-btn-secondary"
            onClick={() => navigate(-1)}
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dc-page" data-theme={theme}>

      {/* ── Back button ─────────────────────────────────────────────── */}
      <button
        type="button"
        className="dc-back-btn"
        onClick={() => navigate(-1)}
        aria-label="Back to certificates"
      >
        ← Back to certificates
      </button>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="dc-header">
        <div className="dc-header-glow" aria-hidden="true" />
        <div className="dc-header-main">
          <span className="dc-badge">
            <SparkIcon /> Dynamic Credential Issued
          </span>
          <h1 className="dc-heading">
            Congratulations, {displayName.split(" ")[0] || displayName}!{" "}
            <span aria-hidden="true">🎉</span>
          </h1>
          <p className="dc-subheading">
            Your performance criteria met 100% completion metrics. Switch between
            active courses and adjust designs below.
          </p>
        </div>

        {/* Dropdown — switch between all completed certs without going back */}
        <div className="dc-header-select">
          <label htmlFor="dc-cert-select">Select completed certificate</label>
          <div className="dc-select-wrap">
            <select
              id="dc-cert-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {certificates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseName}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>
        </div>
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="dc-toolbar">
        <div className="dc-toolbar-status">
          <span className="dc-dot" aria-hidden="true" />
          Verification live connection: Secure SSL
        </div>
        <div className="dc-zoom">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => handleZoom(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
          >
            −
          </button>
          <span>{zoom}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => handleZoom(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
          >
            +
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="dc-body">

        {/* Certificate viewer */}
        <div className="dc-viewer">
          <div
            className="dc-viewer-scale"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <CertificateCard
              studentName={displayName}
              institute={institute}
              certificate={certificate}
            />
          </div>
        </div>

        {/* Manage & customize panel */}
        <aside className="dc-panel">
          <h2 className="dc-panel-title">
            <WrenchIcon /> Manage &amp; customize
          </h2>

          {/* Display name */}
          <div className="dc-field">
            <label htmlFor="dc-display-name">Edit display name</label>
            <input
              id="dc-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="dc-field-hint">
              Updates live inside the certificate frame viewport above.
            </p>
          </div>

          {/* Theme */}
          <div className="dc-field">
            <span className="dc-field-label">Select theme style</span>
            <div className="dc-theme-row">
              {(Object.keys(THEME_LABELS) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`dc-theme-swatch ${theme === key ? "is-selected" : ""}`}
                  data-swatch={key}
                  onClick={() => setTheme(key)}
                  aria-pressed={theme === key}
                >
                  <span className="dc-swatch-dot" />
                  {THEME_LABELS[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="dc-actions">
            <button
              type="button"
              className="dc-btn dc-btn-primary"
              onClick={() => onDownloadPdf?.(certificate, displayName)}
            >
              <DownloadIcon /> Download PDF certificate
            </button>
            <button
              type="button"
              className="dc-btn dc-btn-secondary"
              onClick={handleCopyLink}
            >
              <LinkIcon />
              {copyState === "copied" ? "Link copied ✓" : "Copy verification link"}
            </button>
            <button
              type="button"
              className="dc-btn dc-btn-dark"
              onClick={() => onAddToLinkedIn?.(certificate, displayName)}
            >
              <BriefcaseIcon /> Add to LinkedIn profile
            </button>
          </div>

          {/* Auth card */}
          <div className="dc-auth-card">
            <div className="dc-auth-heading">
              <ShieldIcon /> Authenticity check
            </div>
            <span className="dc-auth-badge">Active SSL</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Certificate card (visual)                                              */
/* ---------------------------------------------------------------------- */

function CertificateCard({
  studentName,
  institute,
  certificate,
}: {
  studentName: string;
  institute: string;
  certificate: CompletedCertificate;
}) {
  return (
    <div className="dc-cert">
      <span className="dc-corner dc-corner-tl" aria-hidden="true" />
      <span className="dc-corner dc-corner-tr" aria-hidden="true" />
      <span className="dc-corner dc-corner-bl" aria-hidden="true" />
      <span className="dc-corner dc-corner-br" aria-hidden="true" />

      <div className="dc-cert-inner">
        <div className="dc-cert-brand">
          <span className="dc-brand-mark">{institute.charAt(0)}</span>
          <span className="dc-brand-name">{institute}</span>
        </div>

        <p className="dc-cert-eyebrow">Credential of accomplishment</p>
        <p className="dc-cert-lede">This is proudly awarded to</p>

        <h2 className="dc-cert-name">{studentName}</h2>

        <p className="dc-cert-desc">
          for successfully satisfying all academic curations, modular benchmarks, and
          hands-on assessment metrics for the masterclass program
        </p>

        <p className="dc-cert-course">{certificate.courseName}</p>
        <p className="dc-cert-grade">
          Completed with distinction • Grade: {certificate.grade}
        </p>

        <div className="dc-cert-signrow">
          <div className="dc-signature">
            <span className="dc-signature-name">{certificate.instructorName}</span>
            <span className="dc-signature-label">Instructor signature</span>
          </div>
          <div className="dc-seal">
            <SealIcon />
            <span className="dc-signature-label">Verified security seal</span>
          </div>
          <div className="dc-signature">
            <span className="dc-signature-name">{certificate.registrarName}</span>
            <span className="dc-signature-label">Registrar verification</span>
          </div>
        </div>

        <div className="dc-cert-footer">
          <div className="dc-footer-item">
            <span className="dc-footer-label">Credential ID</span>
            <span className="dc-footer-chip">{certificate.credentialId}</span>
          </div>
          <div className="dc-footer-item">
            <span className="dc-footer-label">Date issued</span>
            <span className="dc-footer-value">{certificate.dateIssued}</span>
          </div>
          <div className="dc-footer-item dc-footer-link">
            <span className="dc-footer-value">
              learnova-verify.org/verify/{certificate.verificationSlug}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Icons                                                                  */
/* ---------------------------------------------------------------------- */

function SparkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a4 4 0 1 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6z" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <polyline points="7 10 12 15 17 10" />
      <path d="M4 19h16" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17H7a5 5 0 0 1 0-10h2" />
      <path d="M15 7h2a5 5 0 0 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
    </svg>
  );
}
function SealIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="9" r="5.5" />
      <path d="M9 13.5 7 22l5-3 5 3-2-8.5" />
    </svg>
  );
}