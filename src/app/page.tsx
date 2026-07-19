export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4">
      <header className="flex items-center gap-3 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-white">
          খ
        </div>
        <div>
          <h1 className="text-xl font-bold">ওপেনখাতা</h1>
          <p className="text-sm text-text-muted">ডিজিটাল বাকির খাতা</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">স্বাগতম! 👋</h2>
          <p className="mt-2 text-text-muted">
            কাগজের খাতার বদলে ২-৩ ট্যাপে লেনদেন লিখুন। নেট ছাড়াই চলে, আপনার
            ডেটা কখনো হারাবে না — সম্পূর্ণ ফ্রি ও ওপেন-সোর্স।
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4" aria-label="লেনদেন">
          <button
            type="button"
            disabled
            className="flex min-h-tap flex-col items-center justify-center gap-1 rounded-2xl bg-gave-light py-6 text-gave opacity-60"
          >
            <span className="text-2xl font-bold">দিলাম ↑</span>
            <span className="text-sm">শীঘ্রই আসছে</span>
          </button>
          <button
            type="button"
            disabled
            className="flex min-h-tap flex-col items-center justify-center gap-1 rounded-2xl bg-got-light py-6 text-got opacity-60"
          >
            <span className="text-2xl font-bold">পেলাম ↓</span>
            <span className="text-sm">শীঘ্রই আসছে</span>
          </button>
        </section>

        <section className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-text-muted">
          খাতা (লেজার) ফিচার তৈরি হচ্ছে — অগ্রগতি দেখুন{" "}
          <a
            href="https://github.com/zaberhossen/OpenKhata/blob/main/ROADMAP.md"
            className="font-semibold text-primary underline underline-offset-2"
          >
            রোডম্যাপে
          </a>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-text-muted">
        <a
          href="https://github.com/zaberhossen/OpenKhata"
          className="underline underline-offset-2"
        >
          GitHub-এ ওপেন-সোর্স
        </a>{" "}
        · MIT লাইসেন্স
      </footer>
    </div>
  );
}
