import { useRef, useState } from "react";
import type { FC } from "react";
 import "./Sharemodal.css";

interface ShareModalProps {
  link?: string;
  onClose?: () => void;
}

interface ShareLinkConfig {
  name: string;
  icon: FC;
  getUrl: (link: string) => string;
}

const FacebookIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="#1877F2">
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
  </svg>
);

const TwitterIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="#1DA1F2">
    <path d="M22 5.92c-.74.33-1.53.55-2.36.65a4.1 4.1 0 0 0 1.8-2.27c-.8.47-1.68.81-2.6 1a4.07 4.07 0 0 0-6.94 3.71A11.55 11.55 0 0 1 3.4 4.84a4.06 4.06 0 0 0 1.26 5.43 4.04 4.04 0 0 1-1.84-.5 4.07 4.07 0 0 0 3.26 4.04 4.1 4.1 0 0 1-1.83.07 4.07 4.07 0 0 0 3.8 2.83A8.18 8.18 0 0 1 2 18.57a11.53 11.53 0 0 0 6.24 1.83c7.49 0 11.59-6.21 11.59-11.6l-.01-.53A8.36 8.36 0 0 0 22 5.92z" />
  </svg>
);

const LinkedInIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);

const EmailIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth={1.6}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const CloseIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
  
);

const SHARE_LINKS: ShareLinkConfig[] = [
  {
    name: "FACEBOOK",
    icon: FacebookIcon,
    getUrl: (link) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
  },
  {
    name: "TWITTER",
    icon: TwitterIcon,
    getUrl: (link) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}`,
  },
  {
    name: "LINKEDIN",
    icon: LinkedInIcon,
    getUrl: (link) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
  },
  {
    name: "EMAIL",
    icon: EmailIcon,
    getUrl: (link) => `mailto:?body=${encodeURIComponent(link)}`,
  },
];

const ShareModal: FC<ShareModalProps> = ({
  link = "http://localhost:5173/learning/student/coursecompletion",
  onClose = () => {},
}) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    inputRef.current?.select();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // clipboard API unavailable; selection still lets the user copy manually
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="share-overlay">
      <div className="share-modal">
        <button className="share-modal__close" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>

        <h2 className="share-modal__title">Share </h2>

        <div className="share-grid">
          {SHARE_LINKS.map(({ name, icon: Icon, getUrl }) => (
            <a
              key={name}
              href={getUrl(link)}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn"
            >
              <Icon />
              <span className="share-btn__label">{name}</span>
            </a>
          ))}
        </div>

        <div className="share-link-row">
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={link}
            className="share-link-row__input"
          />
          <button
            onClick={handleCopy}
            className={`copy-btn${copied ? " copied" : ""}`}
          >
            {copied ? "COPIED" : "COPY LINK"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;