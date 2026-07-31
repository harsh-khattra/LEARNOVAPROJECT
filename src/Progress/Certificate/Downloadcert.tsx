import  { useMemo, useState,useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./Downloadcert.css";
// import React, { useMemo, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

// Shape of the data we expect in `navigate(path, { state })`
// when the user clicks "View Certificate" on a course card.
type DownloadCertLocationState = {
  certificate?: CompletedCertificate;
  studentName?: string;
  institute?: string;
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
/*  Mock / fallback data  (used only if nothing else matches)              */
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


// const ZOOM_STEP = 10;

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

  // ── 1b. Read whatever the "View Certificate" click passed along ─────
  //    This is the source of truth: whichever course card was clicked,
  //    its exact certificate object rides along in router state, so we
  //    don't have to depend on matching ids against a static list.
  const location = useLocation();
  const locationState = (location.state ?? {}) as DownloadCertLocationState;

  // ── 2. Decide which certificate to show, in priority order:  ────────
  //    a) certificate passed via navigate(path, { state }) — most reliable
  //    b) certificate matched from the `certificates` list using the
  //       :certificateId URL param (id / credentialId / verificationSlug)
  //    c) first certificate in the list as a last-resort fallback
  const initialCert = useMemo(() => {
    if (locationState.certificate) return locationState.certificate;

    if (certificateId) {
      const match = certificates.find(
        (c) =>
          c.id === certificateId ||
          c.credentialId === certificateId ||
          c.verificationSlug === certificateId
      );
      if (match) return match;
    }

    return certificates[0];
  }, [certificates, certificateId, locationState.certificate]);

const selectedId = initialCert?.id ?? "";
 const displayName = locationState.studentName ?? studentName;
  const certRef = useRef<HTMLDivElement>(null);
const [downloading, setDownloading] = useState(false);
  const [activeInstitute] = useState(locationState.institute ?? institute);
const theme: ThemeKey = "gold";
  const [zoom] = useState(100);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  // If the certificate came from router state (not from the static list),
  // it might not exist inside `certificates`. So we resolve the certificate
  // to actually render from either the state object or the list lookup.

  




  const certificate = useMemo(() => {
    if (locationState.certificate && locationState.certificate.id === selectedId) {
      return locationState.certificate;
    }
    return certificates.find((c) => c.id === selectedId) ?? initialCert;
  }, [certificates, selectedId, locationState.certificate, initialCert]);


async function handleDownloadPdf() {
  if (!certRef.current || !certificate) return;
  setDownloading(true);
  try {
const canvas = await html2canvas(certRef.current, {
  scale: 3,
  useCORS: true,
  backgroundColor: "#ffffff",
});

    const imgData = canvas.toDataURL("image/png");

    // Certificate ka aspect ratio landscape hota hai, isliye landscape PDF
const pdf = new jsPDF({
  orientation: canvas.width > canvas.height ? "landscape" : "portrait",
  unit: "px",
  format: [canvas.width, canvas.height],
});

pdf.addImage(
  imgData,
  "PNG",
  0,
  0,
  canvas.width,
  canvas.height,
  undefined,
  "FAST"
);



    const fileSafeName = displayName.replace(/\s+/g, "_");
    const fileSafeCourse = certificate.courseName.replace(/\s+/g, "_");
    pdf.save(`Certificate_${fileSafeName}_${fileSafeCourse}.pdf`);

    onDownloadPdf?.(certificate, displayName); // agar parent bhi kuch karna chahe, wo bhi chal jayega
  } catch (err) {
    console.error("PDF generation failed:", err);
  } finally {
    setDownloading(false);
  }
}




  const verificationUrl = certificate
    ? `learnova-verify.org/verify/${certificate.verificationSlug}`
    : "";

 

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
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
     

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="dc-body">

        {/* Certificate viewer */}
        <div className="dc-viewer">
         <div
  className="dc-viewer-scale"
  style={{ transform: `scale(${zoom / 100})` }}
>
  <div ref={certRef}>
    <CertificateCard
      studentName={displayName}
      institute={activeInstitute}
      certificate={certificate}
    />
  </div>
</div>
        </div>

        {/* Manage & customize panel */}
        <aside className="dc-panel">
          {/* Actions */}
          <div className="dc-actions">
      <button
  type="button"
  className="dc-btn dc-btn-primary"
  onClick={handleDownloadPdf}
  disabled={downloading}
>
  Download PDF
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
  onClick={() => {
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME`;

    window.open(url, "_blank", "noopener,noreferrer");

    onAddToLinkedIn?.(certificate, displayName);
  }}
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