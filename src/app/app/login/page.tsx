"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { getSupabase, isSyncConfigured } from "@/lib/supabase";
import { BackLink } from "@/components/ledger/shared";

type Channel = "phone" | "email";

/** "01712345678" → "+8801712345678" (Bangladesh default); passes +… through. */
function normalizePhone(input: string): string {
  const trimmed = input.replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("01")) return `+88${trimmed}`;
  if (trimmed.startsWith("880")) return `+${trimmed}`;
  return trimmed;
}

export default function LoginPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("phone");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"enter" | "verify">("enter");
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

  const phone = channel === "phone";
  const target = phone ? normalizePhone(identifier) : identifier.trim();

  async function sendCode() {
    if (busy || !target) return;
    setBusy(true);
    setError(null);
    const { error: err } = await getSupabase().auth.signInWithOtp(
      phone ? { phone: target } : { email: target },
    );
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep("verify");
  }

  async function verifyCode() {
    if (busy || code.trim().length === 0) return;
    setBusy(true);
    setError(null);
    const token = code.trim();
    const { error: err } = await getSupabase().auth.verifyOtp(
      phone
        ? { phone: target, token, type: "sms" }
        : { email: target, token, type: "email" },
    );
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
        <BackLink href="/" />
        <h1 className="text-lg font-bold">লগইন / ব্যাকআপ চালু করুন</h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 py-2">
        {step === "enter" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["phone", "ফোন নম্বর"],
                  ["email", "ইমেইল"],
                ] as [Channel, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setChannel(value)}
                  aria-pressed={channel === value}
                  className={`min-h-tap rounded-2xl border font-semibold ${
                    channel === value
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-border bg-surface text-text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-text-muted">
                {phone ? "ফোন নম্বর" : "ইমেইল ঠিকানা"}
              </span>
              <input
                inputMode={phone ? "tel" : "email"}
                type={phone ? "tel" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={phone ? "01XXXXXXXXX" : "you@example.com"}
                className="min-h-tap rounded-2xl border border-border bg-surface px-4 outline-none focus:border-primary"
              />
            </label>
            <p className="text-sm text-text-muted">
              {phone
                ? "SMS-এ ৬ সংখ্যার কোড যাবে।"
                : "ইমেইলে ৬ সংখ্যার কোড যাবে।"}{" "}
              লগইন করলে আপনার খাতা ক্লাউডে ব্যাকআপ হবে এবং একাধিক ফোনে ব্যবহার
              করা যাবে।
            </p>
          </>
        ) : (
          <>
            <p className="text-text-muted">
              <span className="font-semibold text-text">{target}</span>-এ পাঠানো
              ৬ সংখ্যার কোডটি দিন
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="XXXXXX"
              className="min-h-14 rounded-2xl border-2 border-primary bg-surface px-4 text-center text-2xl font-bold tracking-[0.5em] outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setStep("enter");
                setCode("");
                setError(null);
              }}
              className="text-sm text-primary underline underline-offset-2"
            >
              নম্বর/ইমেইল বদলান বা আবার কোড পাঠান
            </button>
          </>
        )}

        {error && (
          <p className="rounded-2xl bg-gave-light px-4 py-3 text-sm text-gave">
            {error}
          </p>
        )}
      </main>

      <div className="sticky bottom-0 bg-background/95 py-4">
        <button
          type="button"
          onClick={step === "enter" ? sendCode : verifyCode}
          disabled={busy || (step === "enter" ? !target : !code.trim())}
          className="flex min-h-tap w-full items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-40"
        >
          {busy
            ? "অপেক্ষা করুন…"
            : step === "enter"
              ? "কোড পাঠান"
              : "যাচাই করুন"}
        </button>
        <Link
          href="/app"
          className="mt-2 flex min-h-tap items-center justify-center text-sm text-text-muted underline underline-offset-2"
        >
          পরে করবো — অফলাইনেই চালিয়ে যান
        </Link>
      </div>
    </div>
  );
}
