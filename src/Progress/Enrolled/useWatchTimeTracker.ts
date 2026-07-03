import { useEffect, useRef } from "react";
import { SupabaseClient } from "../../Helper/Supabase";

/* ──────────────────────────────────────────────────────────────────────────
   useWatchTimeTracker
   Tracks real watch time (play → pause/stop) for either:
     - a YouTube video, via the YouTube IFrame Player API, or
     - a native HTML5 <video> element

   IMPORTANT — why YouTube uses a div, not an iframe ref:
   The YouTube IFrame API takes over the DOM node you give it and replaces
   it with its own iframe internally. If that node is something React is
   also rendering/managing (e.g. an <iframe> with a `src` controlled by
   React), React's virtual DOM gets out of sync with the real DOM — on the
   next re-render or unmount, React tries to remove a node that YouTube
   already swapped out, throwing:
     "Failed to execute 'removeChild' on 'Node': ..."
   The fix: give YouTube an *empty plain <div>* that React renders once and
   never updates again. YouTube can do whatever it wants inside that div;
   React never looks inside it again, so there's no conflict.

   It saves progress to Supabase's `watch_sessions` table:
     - a "heartbeat" every HEARTBEAT_SECONDS while actively playing
     - a final flush on pause / unmount / page close

   Usage:
     const { bindYouTubeContainer, bindVideoElement } =
       useWatchTimeTracker({ courseId, contentId });

     // for YouTube — pass the embed URL (without enablejsapi, handled internally):
     <div ref={bindYouTubeContainer(youtubeEmbedUrl)} className="main-html5-player" />

     // for native video:
     <video ref={bindVideoElement} src={url} ... />
   ────────────────────────────────────────────────────────────────────────── */

const HEARTBEAT_SECONDS = 15;

interface UseWatchTimeTrackerOptions {
  courseId: string | null | undefined;
  contentId: string | null | undefined;
  enabled?: boolean;
}

export function useWatchTimeTracker({
  courseId,
  contentId,
  enabled = true,
}: UseWatchTimeTrackerOptions) {
  const pendingSecondsRef = useRef(0);
  const playStartedAtRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);

  const ytPlayerRef = useRef<any>(null);
  const ytContainerElRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------------- core save logic --------------------------- */

  async function flushToSupabase() {
    if (playStartedAtRef.current !== null) {
      const elapsed = (Date.now() - playStartedAtRef.current) / 1000;
      pendingSecondsRef.current += elapsed;
      playStartedAtRef.current = Date.now();
    }

    const secondsToSave = Math.round(pendingSecondsRef.current);
    console.log("[watch-tracker] flushToSupabase called, secondsToSave =", secondsToSave, "courseId =", courseId);
    if (secondsToSave <= 0 || !courseId) {
      console.log("[watch-tracker] skipping flush (no seconds or no courseId)");
      return;
    }

    pendingSecondsRef.current = 0;

    try {
      const {
        data: { user },
      } = await SupabaseClient.auth.getUser();
      if (!user) {
        console.log("[watch-tracker] no user found, skipping insert");
        return;
      }

      const { error } = await SupabaseClient.from("watch_sessions").insert({
        student_id: user.id,
        course_id: courseId,
        lesson_id: contentId ?? null,
        seconds_watched: secondsToSave,
      });

      if (error) {
        console.error("[watch-tracker] insert error:", error);
      } else {
        console.log("[watch-tracker] insert SUCCESS:", secondsToSave, "seconds saved");
      }
    } catch (err) {
      console.error("watch_sessions insert failed:", err);
    }
  }

  function handlePlay() {
    if (playStartedAtRef.current === null) {
      playStartedAtRef.current = Date.now();
    }
    if (heartbeatIntervalRef.current === null) {
      heartbeatIntervalRef.current = window.setInterval(
        flushToSupabase,
        HEARTBEAT_SECONDS * 1000
      );
    }
  }

  function handlePauseOrEnd() {
    if (playStartedAtRef.current !== null) {
      const elapsed = (Date.now() - playStartedAtRef.current) / 1000;
      pendingSecondsRef.current += elapsed;
      playStartedAtRef.current = null;
    }
    if (heartbeatIntervalRef.current !== null) {
      window.clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    flushToSupabase();
  }

  /* --------------------------- native <video> ----------------------------- */

  function bindVideoElement(el: HTMLVideoElement | null) {
    if (!el) return;
    el.addEventListener("play", handlePlay);
    el.addEventListener("pause", handlePauseOrEnd);
    el.addEventListener("ended", handlePauseOrEnd);
  }

  /* ------------------------------ YouTube ---------------------------------- */

  function loadYouTubeApiScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).YT && (window as any).YT.Player) {
        resolve();
        return;
      }
      const existing = document.getElementById("youtube-iframe-api");
      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof previousCallback === "function") previousCallback();
        resolve();
      };
      if (!existing) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    });
  }

  function destroyYtPlayer() {
    if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
      try {
        ytPlayerRef.current.destroy();
      } catch {
        /* no-op */
      }
    }
    ytPlayerRef.current = null;
  }

  /**
   * Returns a ref-callback bound to a specific YouTube video ID. Pass the
   * raw video ID (not a full embed URL) — this function builds the player
   * directly via the API's `videoId` option rather than an iframe `src`,
   * which is the officially supported way to instantiate it.
   */
  function bindYouTubeContainer(videoId: string | null | undefined) {
    return (el: HTMLDivElement | null) => {
      if (!el || !videoId) return;
      ytContainerElRef.current = el;

      loadYouTubeApiScript().then(() => {
        // Guard against the container having been unmounted by the time
        // the API script finishes loading.
        if (!ytContainerElRef.current) return;

        destroyYtPlayer();

        ytPlayerRef.current = new (window as any).YT.Player(el, {
          videoId,
          playerVars: { rel: 0 },
          events: {
            onStateChange: (event: any) => {
              const YT = (window as any).YT;
              console.log("[watch-tracker] YouTube state change:", event.data);
              if (event.data === YT.PlayerState.PLAYING) {
                console.log("[watch-tracker] PLAYING -> handlePlay()");
                handlePlay();
              } else if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.ENDED
              ) {
                console.log("[watch-tracker] PAUSED/ENDED -> handlePauseOrEnd()");
                handlePauseOrEnd();
              }
            },
          },
        });
      });
    };
  }

  /* ------------------------------ lifecycle -------------------------------- */

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      handlePauseOrEnd();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      handlePauseOrEnd();
      destroyYtPlayer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, contentId, enabled]);

  return { bindYouTubeContainer, bindVideoElement, flushNow: flushToSupabase };
}