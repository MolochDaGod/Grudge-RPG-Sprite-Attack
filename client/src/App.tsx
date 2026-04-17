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

  // Cross-app routing: engine / gdevelop
  if (route === "engine") {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center gap-3 p-3 bg-slate-900/90 border-b border-white/10">
          <button onClick={goHome} className="text-white/70 hover:text-white text-sm">← Back to Hub</button>
          <span className="text-amber-300 font-bold">The Engine — 3D Game</span>
        </div>
        <iframe src="https://dungeon-crawler-quest.vercel.app/editor" className="w-full" style={{ height: 'calc(100vh - 48px)', border: 'none' }} title="The Engine" />
      </div>
    );
  }

  if (route === "gdevelop") {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex items-center gap-3 p-3 bg-slate-900/90 border-b border-white/10">
          <button onClick={goHome} className="text-white/70 hover:text-white text-sm">← Back to Hub</button>
          <span className="text-amber-300 font-bold">GDevelop Studio</span>
        </div>
        <iframe src="https://gdevelop-assistant.vercel.app" className="w-full" style={{ height: 'calc(100vh - 48px)', border: 'none' }} title="GDevelop Studio" />
      </div>
    );
  }

  // Fighter game route
  if (route === "fighter") {
    return <GrudgeFighter2D onBack={goHome} />;
  }

  // Default: Landing Hub with nav cards
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-amber-300 font-serif tracking-wide">Grudge Studio</h1>
        <p className="text-white/50 mt-2">by Racalvin The Pirate King</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full">
        <button onClick={() => { window.location.hash = "fighter"; }} className="group bg-slate-900/80 border border-amber-400/20 rounded-xl p-8 text-center hover:border-amber-400/60 hover:bg-slate-800/80 transition-all">
          <div className="text-4xl mb-4">⚔️</div>
          <h2 className="text-xl font-bold text-amber-300 group-hover:text-amber-200">Grudge Smash</h2>
          <p className="text-sm text-white/50 mt-2">2D sprite fighting • 10 fighters + assists • Online PvP</p>
        </button>
        <button onClick={() => { window.location.hash = "engine"; }} className="group bg-slate-900/80 border border-emerald-400/20 rounded-xl p-8 text-center hover:border-emerald-400/60 hover:bg-slate-800/80 transition-all">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-xl font-bold text-emerald-300 group-hover:text-emerald-200">The Engine</h2>
          <p className="text-sm text-white/50 mt-2">3D BabylonJS • Dungeon Crawler • Map Editor</p>
        </button>
        <button onClick={() => { window.location.hash = "gdevelop"; }} className="group bg-slate-900/80 border border-purple-400/20 rounded-xl p-8 text-center hover:border-purple-400/60 hover:bg-slate-800/80 transition-all">
          <div className="text-4xl mb-4">🛠️</div>
          <h2 className="text-xl font-bold text-purple-300 group-hover:text-purple-200">GDevelop Studio</h2>
          <p className="text-sm text-white/50 mt-2">Game launcher • Asset gallery • Services hub</p>
        </button>
      </div>
      <div className="flex gap-4 text-xs text-white/30">
        <a href="#toonadmin" className="hover:text-white/60">ToonAdmin</a>
        <a href="#mapadmin" className="hover:text-white/60">MapAdmin</a>
        <a href="https://grudgewarlords.com" className="hover:text-white/60" target="_blank" rel="noreferrer">grudgewarlords.com</a>
      </div>
    </div>
  );
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
