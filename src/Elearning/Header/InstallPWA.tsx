import { useEffect, useState } from "react";
import "./installPWA.css";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

const InstallPWA = () => {
    console.log("InstallPWA Component Loaded");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [showBanner, setShowBanner] = useState(false);

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already running as installed app
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // User clicked Not Now recently?
    const lastHide = localStorage.getItem("hideInstallBanner");

    if (lastHide) {
      const diff = Date.now() - Number(lastHide);

      if (diff < ONE_DAY) {
        return;
      }
    }

    const beforeInstallHandler = (e: Event) => {
          console.log("beforeinstallprompt fired");
      e.preventDefault();

      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show banner after 5 seconds
      setTimeout(() => {
        setShowBanner(true);
      }, 2000);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);

      localStorage.removeItem("hideInstallBanner");

      console.log("PWA Installed");
    };

    window.addEventListener(
      "beforeinstallprompt",
      beforeInstallHandler
    );

    window.addEventListener(
      "appinstalled",
      installedHandler
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallHandler
      );

      window.removeEventListener(
        "appinstalled",
        installedHandler
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const result = await deferredPrompt.userChoice;

    console.log(result.outcome);

    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(
      "hideInstallBanner",
      Date.now().toString()
    );

    setShowBanner(false);
  };

  if (
    !showBanner ||
    !deferredPrompt ||
    isInstalled
  ) {
    return null;
  }

  return (
    <div className="install-banner">

      <div className="install-content">
        <h3>📱 Install Learnova</h3>

        <p>
          Install Learnova for faster access and an app-like experience.
        </p>
      </div>

      <div className="install-actions">

        <button
          className="later-btn"
          onClick={handleDismiss}
        >
          Not Now
        </button>

        <button
          className="install-btn"
          onClick={handleInstall}
        >
          Install
        </button>

      </div>

    </div>
  );
};

export default InstallPWA;