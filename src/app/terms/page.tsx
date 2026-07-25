"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const CONTACT_EMAIL = "zaber@10minuteschool.com";
const LAST_UPDATED = { en: "July 25, 2026", bn: "২৫ জুলাই, ২০২৬" };

type Lang = "en" | "bn";

interface Sec {
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Record<Lang, Sec[]> = {
  en: [
    {
      title: "1. The service",
      body: (
        <p>
          OpenKhata is a free, open-source bookkeeping app. The app and local
          use are free forever. Backing up to your own Google Drive is free.
          &quot;OpenKhata Cloud&quot; (backup &amp; multi-device sync on our
          servers) is an optional paid service, offered with a free trial.
        </p>
      ),
    },
    {
      title: "2. Your responsibilities",
      body: (
        <p>
          You are responsible for the accuracy of the data you enter and for
          keeping your account credentials safe. OpenKhata is a record-keeping
          tool — it does not move money or provide financial, tax, or legal
          advice.
        </p>
      ),
    },
    {
      title: "3. Payments & refunds",
      body: (
        <p>
          Paid cloud plans are billed as described at purchase. You can cancel
          anytime; your local data always remains on your device. For billing
          questions or refund requests, contact us at the email below.
        </p>
      ),
    },
    {
      title: "4. No warranty",
      body: (
        <p>
          The software is provided &quot;as is&quot;, without warranty of any
          kind, under the{" "}
          <a
            href="https://opensource.org/license/mit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            MIT License
          </a>
          . To the maximum extent permitted by law, we are not liable for any
          data loss or damages arising from use of the app. Please keep a
          backup.
        </p>
      ),
    },
    {
      title: "5. Changes",
      body: (
        <p>
          We may update these terms and the service over time. Continued use
          after changes means you accept the updated terms.
        </p>
      ),
    },
    {
      title: "6. Contact",
      body: (
        <p>
          Questions? Email:{" "}
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
      title: "১. সেবা",
      body: (
        <p>
          ওপেনখাতা একটি ফ্রি, ওপেন-সোর্স বাকির খাতা অ্যাপ। অ্যাপ ও লোকাল ব্যবহার
          চিরকাল ফ্রি। নিজের Google Drive-এ ব্যাকআপও ফ্রি। &quot;ওপেনখাতা
          ক্লাউড&quot; (আমাদের সার্ভারে ব্যাকআপ ও একাধিক ফোনে সিংক) একটি ঐচ্ছিক
          পেইড সেবা, ফ্রি ট্রায়ালসহ।
        </p>
      ),
    },
    {
      title: "২. আপনার দায়িত্ব",
      body: (
        <p>
          আপনি যে তথ্য লেখেন তার সঠিকতা এবং আপনার অ্যাকাউন্টের নিরাপত্তা আপনার
          দায়িত্ব। ওপেনখাতা শুধু হিসাব রাখার টুল — এটি টাকা লেনদেন করে না এবং
          আর্থিক, কর বা আইনি পরামর্শ দেয় না।
        </p>
      ),
    },
    {
      title: "৩. পেমেন্ট ও রিফান্ড",
      body: (
        <p>
          পেইড ক্লাউড প্ল্যান কেনার সময় বর্ণিত শর্তে বিল করা হয়। যেকোনো সময়
          বাতিল করতে পারেন; আপনার লোকাল ডেটা সবসময় আপনার ফোনেই থাকে। বিলিং বা
          রিফান্ড সংক্রান্ত প্রশ্নে নিচের ইমেইলে যোগাযোগ করুন।
        </p>
      ),
    },
    {
      title: "৪. কোনো ওয়ারেন্টি নেই",
      body: (
        <p>
          সফটওয়্যারটি{" "}
          <a
            href="https://opensource.org/license/mit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            MIT License
          </a>{" "}
          এর অধীনে &quot;যেমন আছে তেমন&quot; দেওয়া হয়, কোনো ওয়ারেন্টি ছাড়া।
          আইন-অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত, অ্যাপ ব্যবহারে কোনো ডেটা হারানো বা
          ক্ষতির জন্য আমরা দায়ী নই। অনুগ্রহ করে ব্যাকআপ রাখুন।
        </p>
      ),
    },
    {
      title: "৫. পরিবর্তন",
      body: (
        <p>
          সময়ের সাথে এই শর্তাবলি ও সেবা হালনাগাদ হতে পারে। পরিবর্তনের পরও
          ব্যবহার চালিয়ে গেলে বুঝে নেওয়া হবে আপনি নতুন শর্ত মেনে নিয়েছেন।
        </p>
      ),
    },
    {
      title: "৬. যোগাযোগ",
      body: (
        <p>
          প্রশ্ন থাকলে ইমেইল করুন:{" "}
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

export default function TermsPage() {
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
          {lang === "en" ? "Terms of Service" : "সেবার শর্তাবলি"}
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
