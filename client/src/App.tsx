import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PuterAuthProvider } from "@/contexts/PuterAuthContext";
import GrudgeFighter2D from "@/pages/GrudgeFighter2D";

function GameApp() {
  // Launch directly into the 2D fighter — no login, no tutorial
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
