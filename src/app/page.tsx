import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  WifiOff,
  BadgeDollarSign,
  Github,
  ShieldCheck,
  Zap,
  BarChart3,
  Share2,
  Bell,
  ArrowRight,
  Smartphone,
  Heart,
} from "lucide-react";

const REPO_URL = "https://github.com/zaberhossen/OpenKhata";
const DONATE_URL = process.env.NEXT_PUBLIC_DONATE_URL;

export const metadata: Metadata = {
  title: "ওপেনখাতা — ফ্রি ডিজিটাল বাকির খাতা",
  description:
    "ছোট ব্যবসার জন্য ফ্রি ও ওপেন-সোর্স ডিজিটাল বাকির খাতা — নেট ছাড়াই চলে, ডেটা কখনো হারায় না। ২-৩ ট্যাপে লেনদেন লিখুন।",
};

const FEATURES = [
  {
    icon: WifiOff,
    title: "সম্পূর্ণ অফলাইন",
    body: "নেট থাকুক বা না থাকুক, খাতা সবসময় চলে। ডেটা আপনার ফোনেই নিরাপদে থাকে।",
  },
  {
    icon: Zap,
    title: "২-৩ ট্যাপে এন্ট্রি",
    body: "দিলাম / পেলাম — কয়েক সেকেন্ডে একটা লেনদেন। বড় বোতাম, সহজ স্ক্রিন।",
  },
  {
    icon: Bell,
    title: "বাকির রিমাইন্ডার",
    body: "বাকি কাস্টমারকে এক ট্যাপে WhatsApp/SMS-এ ভদ্র রিমাইন্ডার পাঠান।",
  },
  {
    icon: BarChart3,
    title: "রিপোর্ট ও হিসাব",
    body: "দৈনিক/মাসিক সারাংশ, কাস্টমার অনুযায়ী হিসাব, CSV ও প্রিন্ট।",
  },
  {
    icon: Share2,
    title: "হিসাব শেয়ার",
    body: "প্রতি কাস্টমারের পূর্ণ লেনদেনের হিসাব সরাসরি শেয়ার করুন।",
  },
  {
    icon: Smartphone,
    title: "পেমেন্ট QR",
    body: "নিজের বিকাশ/নগদ নম্বর QR হিসেবে দেখিয়ে টাকা নিন।",
  },
];

const BADGES = [
  { icon: BadgeDollarSign, label: "লোকাল ফ্রি" },
  { icon: Github, label: "ওপেন-সোর্স" },
  { icon: ShieldCheck, label: "ডেটা আপনার" },
];

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4">
      <header className="sticky top-0 z-20 -mx-4 flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-5">
        <Logo className="h-11 w-11 shrink-0" />
        <span className="flex-1 text-lg font-bold">ওপেনখাতা</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex min-h-tap min-w-tap items-center justify-center rounded-full text-text-muted hover:bg-border/50"
        >
          <Github size={22} aria-hidden />
        </a>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center py-10 text-center sm:py-16">
          <Logo className="mb-6 h-20 w-20 sm:h-24 sm:w-24" />
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            কাগজের বাকির খাতা ছেড়ে
            <br />
            <span className="text-primary">ডিজিটাল খাতায়</span> আসুন
          </h1>
          <p className="mt-4 max-w-xl text-text-muted">
            ছোট ব্যবসার জন্য ফ্রি ও ওপেন-সোর্স ডিজিটাল বাকির খাতা। নেট ছাড়াই
            চলে, ডেটা কখনো হারায় না — ২-৩ ট্যাপে লেনদেন লিখুন।
          </p>

          <Link
            href="/app"
            className="mt-8 flex min-h-tap items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-lg font-bold text-white shadow-lg hover:bg-primary-dark"
          >
            অ্যাপ চালু করুন
            <ArrowRight size={20} aria-hidden />
          </Link>
          <p className="mt-3 text-sm text-text-muted">
            ইনস্টল লাগে না — ব্রাউজারেই চলে। ফোনে &quot;Add to Home Screen&quot;
            দিয়ে অ্যাপের মতো ব্যবহার করুন।
          </p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {BADGES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold"
              >
                <Icon size={16} className="text-primary" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section className="grid gap-3 py-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <Icon size={20} aria-hidden />
              </div>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm text-text-muted">{body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Why */}
        <section className="my-6 rounded-2xl border border-border bg-surface p-6 text-center">
          <h2 className="text-xl font-bold">কেন ওপেনখাতা?</h2>
          <p className="mx-auto mt-3 max-w-xl text-text-muted">
            বিদ্যমান অ্যাপগুলো proprietary, বিজ্ঞাপন-ভরা, আর ডেটা lock-in করে
            রাখে। ওপেনখাতা কমিউনিটি-মালিকানাধীন — কোডটা সবার, চিরকাল ফ্রি।
          </p>
          <Link
            href="/app"
            className="mt-6 inline-flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-primary px-6 font-bold text-primary hover:bg-primary-light"
          >
            এখনই শুরু করুন
            <ArrowRight size={18} aria-hidden />
          </Link>
        </section>

        {/* Backup positioning */}
        <section className="my-6 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-center text-xl font-bold">
            ব্যাকআপ — আপনার পছন্দ
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-text-muted">
            অ্যাপ চালাতে লগইন লাগে না — সব ডেটা আপনার ফোনেই। ফোন হারালেও যেন
            ডেটা না হারায়, তাই চাইলে ব্যাকআপ চালু করুন:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-4">
              <p className="font-bold">নিজের Google Drive</p>
              <p className="mt-1 text-sm text-text-muted">
                আপনার নিজের ড্রাইভে ব্যাকআপ — সম্পূর্ণ ফ্রি, ডেটা আপনারই থাকে।
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="font-bold">ওপেনখাতা ক্লাউড</p>
              <p className="mt-1 text-sm text-text-muted">
                আমাদের সার্ভারে নিরাপদ ব্যাকআপ ও একাধিক ফোনে সিংক — ফ্রি
                ট্রায়াল, পরে অল্প সার্ভিস চার্জ।
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col items-center gap-2 py-8 text-center text-sm text-text-muted">
        {DONATE_URL && (
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 flex min-h-tap items-center justify-center gap-2 rounded-2xl border border-primary px-6 font-bold text-primary hover:bg-primary-light"
          >
            <Heart size={18} aria-hidden />
            ওপেনখাতাকে সহায়তা করুন
          </a>
        )}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-text"
        >
          <Github size={16} aria-hidden />
          GitHub-এ কোড দেখুন
        </a>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-text">
            প্রাইভেসি পলিসি
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-text">
            সেবার শর্তাবলি
          </Link>
        </div>
        <p>MIT লাইসেন্স · অ্যাপ চিরকাল ফ্রি</p>
      </footer>
    </div>
  );
}
