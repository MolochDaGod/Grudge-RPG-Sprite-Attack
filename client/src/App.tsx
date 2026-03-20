import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PuterAuthProvider } from "@/contexts/PuterAuthContext";
import GrudgeFighter2D from "@/pages/GrudgeFighter2D";
import ToonAdmin from "@/pages/ToonAdmin";
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

function GameApp() {
  const [route, setRoute] = useState(window.location.hash);
  const [showStartupIntro, setShowStartupIntro] = useState(true);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  if (showStartupIntro) {
    return <StartupIntro onComplete={() => setShowStartupIntro(false)} />;
  }

  // /toonadmin route
  if (route === "#toonadmin" || route === "#/toonadmin") {
    return <ToonAdmin onBack={() => { window.location.hash = ""; }} />;
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
