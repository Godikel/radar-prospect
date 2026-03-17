import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";

const API_BASE = "https://leadgen-backend-production-4e93.up.railway.app";

const AuthCallback = () => {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState("");

  useEffect(() => {
    let handled = false;

    const processSession = async (session: any, needsPassword = false) => {
      if (handled) return;
      handled = true;
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user profile");
        const data = await res.json();
        const user = data.user || data;
        setSession(
          {
            id: user.id || session.user?.id,
            email: user.email || session.user?.email || "",
            name: user.name || session.user?.user_metadata?.full_name || "",
            role: user.role,
            useCases: user.useCases || [],
          },
          session.access_token,
          session.refresh_token || "",
        );
        if (needsPassword) {
          navigate("/auth/set-password", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed");
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      }
    };

    const handleAuth = async () => {
      // 1. Check for errors in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get("error_description") || hashParams.get("error");
      if (hashError) {
        setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        setTimeout(() => navigate("/login", { replace: true }), 3000);
        return;
      }

      // 2. Check for tokens in URL hash (invite links, magic links)
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      if (accessToken && refreshToken) {
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
          if (data.session) {
            const needsPassword = type === "invite" || type === "recovery";
            await processSession(data.session, needsPassword);
            return;
          }
        } catch (err: any) {
          console.error("Hash token session failed:", err);
        }
      }

      // 3. Check for PKCE code in URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (data.session) {
            const codeType = urlParams.get("type");
            const needsPassword = codeType === "invite" || codeType === "recovery";
            await processSession(data.session, needsPassword);
            return;
          }
        } catch (err: any) {
          console.error("Code exchange failed:", err);
        }
      }

      // 4. Fallback — try getSession
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await processSession(session);
        return;
      }

      // 5. Timeout if nothing worked
      setTimeout(() => {
        if (!handled) {
          setError("Sign-in timed out. Please try again.");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        }
      }, 10000);
    };

    handleAuth();
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
