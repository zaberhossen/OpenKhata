import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const CONTACT_EMAIL = "zaber@10minuteschool.com";
const LAST_UPDATED = "২৫ জুলাই, ২০২৬";

export const metadata: Metadata = {
  title: "প্রাইভেসি পলিসি — ওপেনখাতা",
  description:
    "ওপেনখাতা কীভাবে আপনার ডেটা সংগ্রহ, সংরক্ষণ ও ব্যবহার করে — সম্পূর্ণ স্বচ্ছ বিবরণ।",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4">
      <header className="sticky top-0 z-20 -mx-4 flex shrink-0 items-center gap-2 border-b border-border bg-background px-4 py-3">
        <Link
          href="/"
          aria-label="ফিরে যান"
          className="flex min-h-tap min-w-tap items-center justify-center rounded-full hover:bg-border/50"
        >
          <ArrowLeft size={22} aria-hidden />
        </Link>
        <h1 className="text-lg font-bold">প্রাইভেসি পলিসি</h1>
      </header>

      <main className="flex-1 py-4">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <p className="font-bold">ওপেনখাতা</p>
            <p className="text-sm text-text-muted">
              সর্বশেষ হালনাগাদ: {LAST_UPDATED}
            </p>
          </div>
        </div>

        <p className="mt-4 text-text-muted">
          ওপেনখাতা একটি অফলাইন-ফার্স্ট ডিজিটাল বাকির খাতা। আপনার গোপনীয়তা
          আমাদের কাছে গুরুত্বপূর্ণ — এই পলিসিতে স্পষ্টভাবে বলা হয়েছে আমরা কী
          ডেটা নিই, কোথায় রাখি, আর কীভাবে ব্যবহার করি।
        </p>

        <Section title="১. আপনার ডেটা কোথায় থাকে">
          <p>
            ওপেনখাতার সব খাতার তথ্য (কাস্টমার, সরবরাহকারী, লেনদেন) ডিফল্টভাবে
            <b> শুধু আপনার নিজের ডিভাইসেই</b> (ব্রাউজারের লোকাল
            ডেটাবেস/IndexedDB) সংরক্ষিত হয়। লগইন না করলে বা ব্যাকআপ চালু না
            করলে এই তথ্য আপনার ফোন ছেড়ে কোথাও যায় না — আমাদের সার্ভারেও না।
          </p>
        </Section>

        <Section title="২. লগইন (ঐচ্ছিক)">
          <p>
            শুধু ব্যাকআপ চালু করতে চাইলে আপনি Google অথবা ইমেইল ম্যাজিক-লিংক
            দিয়ে লগইন করতে পারেন। এতে আমরা শুধু আপনার ইমেইল ঠিকানা ও একটি
            অ্যাকাউন্ট আইডি সংরক্ষণ করি (আমাদের authentication প্রদানকারী
            Supabase-এর মাধ্যমে)। পাসওয়ার্ড আমরা রাখি না।
          </p>
        </Section>

        <Section title="৩. ব্যাকআপ পদ্ধতি">
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
        </Section>

        <Section title="৪. Google ব্যবহারকারীর ডেটা (Limited Use)">
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
        </Section>

        <Section title="৫. আমরা যা করি না">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              আপনার খাতার তথ্য বিক্রি বা বিজ্ঞাপনদাতার সাথে শেয়ার করি না।
            </li>
            <li>
              কোনো থার্ড-পার্টি ট্র্যাকার/বিজ্ঞাপন নেটওয়ার্ক ব্যবহার করি না।
            </li>
            <li>আপনার সম্মতি ছাড়া কোনো ডেটা কোথাও পাঠাই না।</li>
          </ul>
        </Section>

        <Section title="৬. ডেটা মুছে ফেলা">
          <p>
            লোকাল ডেটা মুছতে ব্রাউজার/অ্যাপের ডেটা ক্লিয়ার করুন। Google Drive
            ব্যাকআপ মুছতে drive.google.com → Settings → Manage apps → OpenKhata
            → &quot;Delete hidden app data&quot;। ক্লাউড অ্যাকাউন্ট ও ডেটা মুছতে
            নিচের ইমেইলে যোগাযোগ করুন — আমরা আপনার সব সার্ভার-ডেটা মুছে দেব।
          </p>
        </Section>

        <Section title="৭. যোগাযোগ">
          <p>
            যেকোনো প্রশ্ন বা ডেটা-সংক্রান্ত অনুরোধে ইমেইল করুন:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-text-muted">
        <Link href="/" className="hover:text-text">
          ← ওপেনখাতায় ফিরে যান
        </Link>
      </footer>
    </div>
  );
}
