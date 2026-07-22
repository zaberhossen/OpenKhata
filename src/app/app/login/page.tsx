"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Mail, Phone, MailCheck } from "lucide-react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { BackLink } from "@/components/ledger/shared";

/** "01712345678" -> "+8801712345678" (Bangladesh default); passes +… through. */
function normalizePhone(input: string): string {
  const trimmed = input.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;
  if (trimmed.startsWith("880")) return `+${trimmed}`;
  return trimmed;
}

/** Google's multicolour "G" as a self-contained SVG (no external asset). */
function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const [showPhone, setShowPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [code, setCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"enter" | "verify">("enter");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSyncConfigured()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
        <header className="flex items-center gap-2 py-3">
          <BackLink href="/app" />
          <h1 className="text-lg font-bold">লগইন</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-24 text-center">
          <CloudOff size={40} className="text-text-muted" aria-hidden />
          <p className="font-semibold">ক্লাউড ব্যাকআপ চালু নেই</p>
          <p className="text-sm text-text-muted">
            এই ডিপ্লয়মেন্টে Supabase কনফিগার করা হয়নি। আপনার সব ডেটা এই ফোনেই
            নিরাপদে আছে। সেটআপ নির্দেশনা: রিপোর <code>supabase/README.md</code>
          </p>
        </div>
      </div>
    );
  }

  const callbackUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

  async function signInWithGoogle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl(),
        queryParams: { prompt: "select_account" },
      },
    });
    // On success the browser redirects to Google, so we only reach here on error.
    if (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    const target = email.trim();
    if (busy || !target) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      email: target,
      options: { emailRedirectTo: callbackUrl() },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setEmailSent(true);
  }

  async function sendPhoneCode() {
    const target = normalizePhone(phoneInput);
    if (busy || !target) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOtp({
      phone: target,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPhoneStep("verify");
  }

  async function verifyPhoneCode() {
    const token = code.trim();
    if (busy || !token) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.verifyOtp({
      phone: normalizePhone(phoneInput),
      token,
      type: "sms",
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace("/app/settings");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center gap-2 py-3">
        <BackLink href="/app" />
        <h1 className="text-lg font-bold">লগইন / ব্যাকআপ চালু করুন</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        <p className="text-sm text-text-muted">
          লগইন করলে আপনার খাতা ক্লাউডে ব্যাকআপ হবে এবং একাধিক ফোনে ব্যবহার করা
          যাবে। কোনো পাসওয়ার্ড লাগে না।
        </p>

        {/* Google */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={busy}
          className="flex min-h-tap w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface font-bold text-text shadow-sm hover:bg-background disabled:opacity-40"
        >
          <GoogleGlyph />
          Google দিয়ে চালিয়ে যান
        </button>

        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span className="h-px flex-1 bg-border" />
          অথবা
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Email magic link */}
        {emailSent ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-got bg-got-light/40 p-5 text-center">
            <MailCheck size={32} className="text-got" aria-hidden />
            <p className="font-semibold">ইমেইল চেক করুন</p>
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text">{email.trim()}</span>-এ
              একটি লগইন লিংক পাঠানো হয়েছে। লিংকে ক্লিক করলেই লগইন হয়ে যাবে।
            </p>
            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setError(null);
              }}
              className="mt-1 text-sm text-primary underline underline-offset-2"
            >
              ইমেইল বদলান বা আবার পাঠান
            </button>
          </div>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Mail size={15} aria-hidden />
              ইমেইল দিয়ে লগইন লিংক
            </span>
            <input
              inputMode="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={sendMagicLink}
              disabled={busy || !email.trim()}
              className="mt-1 flex min-h-tap items-center justify-center rounded-2xl bg-primary font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
            >
              {busy ? "অপেক্ষা করুন…" : "লগইন লিংক পাঠান"}
            </button>
          </label>
        )}

        {/* Phone OTP (secondary) */}
        {!showPhone ? (
          <button
            type="button"
            onClick={() => setShowPhone(true)}
            className="flex min-h-tap items-center justify-center gap-1.5 text-sm text-text-muted underline underline-offset-2"
          >
            <Phone size={15} aria-hidden />
            ফোন নম্বর দিয়ে লগইন করুন
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Phone size={15} aria-hidden />
              ফোন নম্বরে OTP
            </span>
            {phoneStep === "enter" ? (
              <>
                <input
                  inputMode="tel"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="min-h-tap rounded-2xl border border-border bg-background px-4 outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={sendPhoneCode}
                  disabled={busy || !phoneInput.trim()}
                  className="min-h-tap rounded-2xl border border-primary font-semibold text-primary hover:bg-primary-light disabled:opacity-40"
                >
                  {busy ? "অপেক্ষা করুন…" : "SMS কোড পাঠান"}
                </button>
              </>
            ) : (
              <>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="XXXXXX"
                  className="min-h-14 rounded-2xl border-2 border-primary bg-background px-4 text-center text-2xl font-bold tracking-[0.5em] outline-none"
                />
                <button
                  type="button"
                  onClick={verifyPhoneCode}
                  disabled={busy || !code.trim()}
                  className="min-h-tap rounded-2xl bg-primary font-bold text-white hover:bg-primary-dark disabled:opacity-40"
                >
                  {busy ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep("enter");
                    setCode("");
                    setError(null);
                  }}
                  className="text-sm text-primary underline underline-offset-2"
                >
                  নম্বর বদলান বা আবার কোড পাঠান
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-2xl bg-gave-light px-4 py-3 text-sm text-gave">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 bg-background/95 py-4">
        <Link
          href="/app"
          className="flex min-h-tap items-center justify-center text-sm text-text-muted underline underline-offset-2"
        >
          পরে করবো — অফলাইনেই চালিয়ে যান
        </Link>
      </div>
    </div>
  );
}
