import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  consumeGrudgeAuth,
  getPendingRoute,
  clearPendingRoute,
  requireGrudgeAuth,
} from "@/lib/grudgeAuth";
import { isAuthenticated } from "@/lib/grudgeBackend";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    consumeGrudgeAuth();

    if (!isAuthenticated()) {
      setStatus("error");
      const t = window.setTimeout(() => requireGrudgeAuth(), 1500);
      return () => window.clearTimeout(t);
    }

    setStatus("success");
    const route = getPendingRoute();
    clearPendingRoute();
    const t = window.setTimeout(() => {
      window.history.replaceState(null, "", "/");
      window.location.hash = route;
      window.location.reload();
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
            <p className="text-amber-300/80 text-sm">Completing Grudge sign-in…</p>
          </>
        )}
        {status === "success" && (
          <p className="text-amber-300 text-sm">Welcome — entering the arena…</p>
        )}
        {status === "error" && (
          <p className="text-red-400 text-sm">Sign-in failed — redirecting to login…</p>
        )}
      </div>
    </div>
  );
}