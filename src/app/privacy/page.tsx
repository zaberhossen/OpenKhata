"use client";

import { Logo } from "@/components/brand/logo";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CONTACT_EMAIL = "openkhata.bd@gmail.com";
const LAST_UPDATED = { en: "July 25, 2026", bn: "২৫ জুলাই, ২০২৬" };

type Lang = "en" | "bn";

interface Sec {
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Record<Lang, Sec[]> = {
  en: [
    {
      title: "1. Where your data lives",
      body: (
        <p>
          All of OpenKhata&apos;s bookkeeping data (customers, suppliers,
          transactions) is stored <b>only on your own device</b> by default (the
          browser&apos;s local database / IndexedDB). If you don&apos;t log in
          or enable backup, this data never leaves your phone — not even to our
          servers.
        </p>
      ),
    },
    {
      title: "2. Login (optional)",
      body: (
        <p>
          Only to enable backup, you may sign in with Google or an email magic
          link. We then store only your email address and an account ID (via our
          authentication provider, Supabase). We never store passwords.
        </p>
      ),
    },
    {
      title: "3. Backup options",
      body: (
        <>
          <p>After signing in, you choose one backup destination:</p>
          <p>
            <b>a) Your own Google Drive —</b> a JSON snapshot of your ledger is
            stored in <b>your own Google Drive</b>&apos;s hidden application
            folder (<code>appDataFolder</code>). This data{" "}
            <b>never reaches our servers</b> — only you and the OpenKhata app
            can read/write it.
          </p>
          <p>
            <b>b) OpenKhata Cloud —</b> optionally, your ledger is backed up to
            our cloud (Supabase) so it syncs across devices. This data is tied
            to your account and protected by Row-Level Security — only you can
            see your own data. This is an optional paid service.
          </p>
        </>
      ),
    },
    {
      title: "4. Google user data (Limited Use)",
      body: (
        <p>
          OpenKhata&apos;s use of information received from Google APIs adheres
          to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Google API Services User Data Policy
          </a>
          , including the <b>Limited Use</b> requirements. We use the{" "}
          <code>drive.appdata</code> scope solely to store your ledger backup in
          your own Drive&apos;s app folder. We do not view any of your other
          Drive files, we do not sell or share this data with third parties or
          for advertising, and we do not let humans read it.
        </p>
      ),
    },
    {
      title: "5. What we never do",
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li>Sell your data or share it with advertisers.</li>
          <li>Use any third-party trackers or ad networks.</li>
          <li>Send any data anywhere without your consent.</li>
        </ul>
      ),
    },
    {
      title: "6. Deleting your data",
      body: (
        <p>
          To delete local data, clear the app/browser data. To delete the Google
          Drive backup, go to drive.google.com → Settings → Manage apps →
          OpenKhata → &quot;Delete hidden app data&quot;. To delete your cloud
          account and data, email us below and we will erase all your
          server-side data.
        </p>
      ),
    },
    {
      title: "7. Contact",
      body: (
        <p>
          For any question or data request, email:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      ),
    },
  ],
  bn: [
    {
      title: "১. আপনার ডেটা কোথায় থাকে",
      body: (
        <p>
          ওপেনখাতার সব খাতার তথ্য (কাস্টমার, সরবরাহকারী, লেনদেন) ডিফল্টভাবে
          <b> শুধু আপনার নিজের ডিভাইসেই</b> (ব্রাউজারের লোকাল ডেটাবেস/IndexedDB)
          সংরক্ষিত হয়। লগইন না করলে বা ব্যাকআপ চালু না করলে এই তথ্য আপনার ফোন
          ছেড়ে কোথাও যায় না — আমাদের সার্ভারেও না।
        </p>
      ),
    },
    {
      title: "২. লগইন (ঐচ্ছিক)",
      body: (
        <p>
          শুধু ব্যাকআপ চালু করতে চাইলে আপনি Google অথবা ইমেইল ম্যাজিক-লিংক দিয়ে
          লগইন করতে পারেন। এতে আমরা শুধু আপনার ইমেইল ঠিকানা ও একটি অ্যাকাউন্ট
          আইডি সংরক্ষণ করি (আমাদের authentication প্রদানকারী Supabase-এর
          মাধ্যমে)। পাসওয়ার্ড আমরা রাখি না।
        </p>
      ),
    },
    {
      title: "৩. ব্যাকআপ পদ্ধতি",
      body: (
        <>
          <p>লগইনের পর আপনি একটি ব্যাকআপ গন্তব্য বেছে নেন:</p>
          <p>
            <b>ক) নিজের Google Drive —</b> আপনার খাতার একটি JSON স্ন্যাপশট
            <b> আপনার নিজের Google Drive</b>-এর লুকানো অ্যাপ-ফোল্ডারে (
            <code>appDataFolder</code>) সংরক্ষিত হয়। এই ডেটা{" "}
            <b>আমাদের সার্ভারে আসে না</b> — শুধু আপনি ও ওপেনখাতা অ্যাপটিই এটি
            পড়তে/লিখতে পারে।
          </p>
          <p>
            <b>খ) ওপেনখাতা ক্লাউড —</b> আপনি চাইলে খাতার তথ্য আমাদের ক্লাউডে
            (Supabase) ব্যাকআপ রাখতে পারেন, যাতে একাধিক ফোনে সিংক হয়। এই ডেটা
            আপনার অ্যাকাউন্টের সাথে যুক্ত থাকে এবং Row-Level Security দিয়ে
            সুরক্ষিত — শুধু আপনিই নিজের তথ্য দেখতে পান। এটি একটি ঐচ্ছিক পেইড
            সেবা।
          </p>
        </>
      ),
    },
    {
      title: "৪. Google ব্যবহারকারীর ডেটা (Limited Use)",
      body: (
        <p>
          OpenKhata-র Google API থেকে পাওয়া তথ্যের ব্যবহার Google-এর
          <b> Limited Use</b> নীতিসহ{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            API Services User Data Policy
          </a>{" "}
          মেনে চলে। আমরা <code>drive.appdata</code> স্কোপ শুধু আপনার নিজের
          Drive-এর অ্যাপ-ফোল্ডারে আপনার খাতার ব্যাকআপ রাখতে ব্যবহার করি। আমরা
          আপনার Drive-এর অন্য কোনো ফাইল দেখি না, এই ডেটা বিজ্ঞাপন বা তৃতীয়
          পক্ষের কাছে বিক্রি/শেয়ার করি না, এবং মানুষ দিয়ে পড়ি না।
        </p>
      ),
    },
    {
      title: "৫. আমরা যা করি না",
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li>আপনার খাতার তথ্য বিক্রি বা বিজ্ঞাপনদাতার সাথে শেয়ার করি না।</li>
          <li>
            কোনো থার্ড-পার্টি ট্র্যাকার/বিজ্ঞাপন নেটওয়ার্ক ব্যবহার করি না।
          </li>
          <li>আপনার সম্মতি ছাড়া কোনো ডেটা কোথাও পাঠাই না।</li>
        </ul>
      ),
    },
    {
      title: "৬. ডেটা মুছে ফেলা",
      body: (
        <p>
          লোকাল ডেটা মুছতে ব্রাউজার/অ্যাপের ডেটা ক্লিয়ার করুন। Google Drive
          ব্যাকআপ মুছতে drive.google.com → Settings → Manage apps → OpenKhata →
          &quot;Delete hidden app data&quot;। ক্লাউড অ্যাকাউন্ট ও ডেটা মুছতে
          নিচের ইমেইলে যোগাযোগ করুন — আমরা আপনার সব সার্ভার-ডেটা মুছে দেব।
        </p>
      ),
    },
    {
      title: "৭. যোগাযোগ",
      body: (
        <p>
          যেকোনো প্রশ্ন বা ডেটা-সংক্রান্ত অনুরোধে ইমেইল করুন:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      ),
    },
  ],
};

const INTRO: Record<Lang, string> = {
  en: "OpenKhata is an offline-first digital ledger. Your privacy matters to us — this policy explains clearly what data we collect, where we keep it, and how we use it.",
  bn: "ওপেনখাতা একটি অফলাইন-ফার্স্ট ডিজিটাল বাকির খাতা। আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ — এই পলিসিতে স্পষ্টভাবে বলা হয়েছে আমরা কী ডেটা নিই, কোথায় রাখি, আর কীভাবে ব্যবহার করি।",
};

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
      <header className="sticky top-0 z-20 -mx-4 flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link
          href="/"
          aria-label="Back"
          className="flex min-h-tap min-w-tap items-center justify-center rounded-full hover:bg-border/50"
        >
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <h1 className="flex-1 text-lg font-bold">
          {lang === "en" ? "Privacy Policy" : "প্রাইভেসি পলিসি"}
        </h1>
        <div className="flex overflow-hidden rounded-full border border-border text-sm font-semibold">
          {(["en", "bn"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={
                lang === l
                  ? "bg-primary px-3 py-1 text-white"
                  : "px-3 py-1 text-text-muted hover:bg-border/50"
              }
            >
              {l === "en" ? "EN" : "বাংলা"}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <p className="font-bold">OpenKhata · ওপেনখাতা</p>
            <p className="text-sm text-text-muted">
              {lang === "en" ? "Last updated" : "সর্বশেষ হালনাগাদ"}:{" "}
              {LAST_UPDATED[lang]}
            </p>
          </div>
        </div>

        <p className="mt-4 text-text-muted">{INTRO[lang]}</p>

        {SECTIONS[lang].map((s) => (
          <section key={s.title} className="mt-6">
            <h2 className="text-lg font-bold">{s.title}</h2>
            <div className="mt-2 space-y-2 text-text-muted">{s.body}</div>
          </section>
        ))}
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-text-muted">
        <Link href="/" className="hover:text-text">
          ← {lang === "en" ? "Back to OpenKhata" : "ওপেনখাতায় ফিরে যান"}
        </Link>
      </footer>
    </div>
  );
}
