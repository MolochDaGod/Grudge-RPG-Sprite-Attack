import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PuterAuthProvider } from "@/contexts/PuterAuthContext";
import GrudgeFighter2D from "@/pages/GrudgeFighter2D";
import ToonAdmin from "@/pages/ToonAdmin";
import MapAdmin from "@/pages/MapAdmin";

// ── Grudge Unified Auth ──
const GRUDGE_AUTH_URL = 'https://id.grudge-studio.com/auth';
(function consumeGrudgeAuth() {
  if (!location.hash || !location.hash.includes('token=')) return;
  const hash = new URLSearchParams(location.hash.slice(1));
  const token = hash.get('token');
  if (!token) return;
  localStorage.setItem('grudge_auth_token', token);
  if (hash.get('grudgeId')) localStorage.setItem('grudge_id', hash.get('grudgeId')!);
  if (hash.get('name')) localStorage.setItem('grudge_username', hash.get('name')!);
  window.history.replaceState(null, '', location.pathname + location.search);
})();

export function requireGrudgeAuth() {
  if (localStorage.getItem('grudge_auth_token')) return true;
  const redirect = encodeURIComponent(window.location.href);
  window.location.href = `${GRUDGE_AUTH_URL}?redirect=${redirect}&app=rpg-sprite-attack`;
  return false;
}
function StartupIntro({ onComplete }: { onComplete: () => void }) {
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSkip(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onComplete}
        onError={onComplete}
      >
        <source src="/startup-intro.mp4" type="video/mp4" />
      </video>

      {showSkip && (
        <button
          type="button"
          onClick={onComplete}
          className="absolute right-4 top-4 rounded-md border border-white/30 bg-black/60 px-4 py-2 text-sm font-semibold tracking-wide text-white hover:bg-black/80"
          data-testid="button-skip-startup-intro"
        >
          Skip Intro
        </button>
      )}
    </div>
  );
}

function getActiveRoute(): string {
  // Support both path-based (/toonadmin) and hash-based (#toonadmin) routing
  const path = window.location.pathname.replace(/^\//, "").toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  return hash || path;
}

function GameApp() {
  const [route, setRoute] = useState(getActiveRoute);
  const [showStartupIntro, setShowStartupIntro] = useState(() => {
    // Skip intro entirely when navigating directly to admin pages
    const r = getActiveRoute();
    return r !== "toonadmin" && r !== "mapadmin";
  });

  useEffect(() => {
    const update = () => setRoute(getActiveRoute());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  if (showStartupIntro) {
    return <StartupIntro onComplete={() => setShowStartupIntro(false)} />;
  }

  const goHome = () => {
    window.history.pushState(null, "", "/");
    window.location.hash = "";
    setRoute("");
  };

  // /toonadmin route
  if (route === "toonadmin") {
    return <ToonAdmin onBack={goHome} />;
  }

  // /mapadmin route
  if (route === "mapadmin") {
    return <MapAdmin onBack={goHome} />;
  }

  return <GrudgeFighter2D onBack={() => window.location.reload()} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <PuterAuthProvider>
            <GameApp />
            <Toaster />
          </PuterAuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
