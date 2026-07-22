"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert } from "lucide-react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";

/**
 * OAuth / magic-link landing. Both flows redirect here with a `?code` (PKCE);
 * we exchange it for a session, then send the user into the app. Errors from
 * the provider arrive as `?error=…&error_description=…`.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSyncConfigured()) {
      router.replace("/app");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const providerError =
      params.get("error_description") || params.get("error");
    if (providerError) {
      setError(providerError);
      return;
    }

    const code = params.get("code");
    if (!code) {
      setError("লগইন কোড পাওয়া যায়নি।");
      return;
    }

    let cancelled = false;
    void getSupabase()
      .auth.exchangeCodeForSession(code)
      .then(({ error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          return;
        }
        router.replace("/app/settings");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      {error ? (
        <>
          <TriangleAlert size={40} className="text-gave" aria-hidden />
          <p className="font-semibold">লগইন সম্পূর্ণ হয়নি</p>
          <p className="text-sm text-text-muted">{error}</p>
          <Link
            href="/app/login"
            className="mt-2 flex min-h-tap items-center justify-center rounded-2xl bg-primary px-6 font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            আবার চেষ্টা করুন
          </Link>
        </>
      ) : (
        <>
          <Loader2
            size={40}
            className="animate-spin text-primary"
            aria-hidden
          />
          <p className="font-semibold">লগইন সম্পূর্ণ হচ্ছে…</p>
        </>
      )}
    </div>
  );
}
