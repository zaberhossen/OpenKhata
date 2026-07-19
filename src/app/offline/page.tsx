export const metadata = {
  title: "অফলাইন — ওপেনখাতা",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-5xl">📴</div>
      <h1 className="text-xl font-bold">আপনি এখন অফলাইনে</h1>
      <p className="text-text-muted">
        চিন্তা নেই — ওপেনখাতা নেট ছাড়াই কাজ করার জন্য তৈরি। এই পেজটি এখনো
        ক্যাশে নেই, নেট ফিরলে আবার চেষ্টা করুন।
      </p>
    </div>
  );
}
