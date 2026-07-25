# Google OAuth verification — Drive backup (`drive.appdata`)

যতক্ষণ OAuth consent screen **Testing** মোডে আছে, শুধু আপনি যাদের **Test user**
হিসেবে যোগ করবেন তারাই Drive backup connect করতে পারবে (সর্বোচ্চ ১০০ জন)।
বাকিরা "app not verified / access denied" দেখবে।

**যে কেউ** Drive backup ব্যবহার করতে পারবে — এটা চালু করতে হলে consent screen
**Publish** করে Google-এর কাছে **verification** পাস করাতে হবে। OpenKhata শুধু
`.../auth/drive.appdata` চায় — এটা একটি **sensitive** scope (restricted নয়), তাই
**সাধারণত তৃতীয়-পক্ষের security assessment (CASA) লাগে না**, শুধু brand
verification + একটা demo video লাগে।

> ⚠️ console-এ scope-টা কোন শ্রেণিতে দেখাচ্ছে (Sensitive vs Restricted) মিলিয়ে
> নিন। যদি Google কোনো কারণে এটাকে **Restricted** দেখায়, তখন বছরে একবারের
> **CASA security assessment**-ও লাগবে (খরচসাপেক্ষ)। `drive.appdata`-তে সাধারণত
> লাগে না।

---

## Testing মোডে দ্রুত শুরু (verification ছাড়াই)

নিজে + কয়েকজন পরিচিত দিয়ে টেস্ট করতে verification লাগে না:

1. Google Cloud → **OAuth consent screen → Audience**।
2. **Test users → Add users** → নিজের ও টেস্টারদের Gmail যোগ করুন।
3. ব্যাস — এরা এখনই connect করতে পারবে ("unverified" সতর্কবার্তা পেরিয়ে
   "Advanced → Go to OpenKhata" চেপে)।

সীমা: ১০০ Test user, আর প্রতি টোকেন ৭ দিনে expire (মাঝে মাঝে reconnect লাগতে পারে)।

---

## Public verification — আগে যা যা তৈরি রাখবেন

### ১. ডোমেইন ও পেজ (একই ডোমেইনে হতে হবে)

- [ ] একটা **verified domain** — যেমন `open-khata.vercel.app` অথবা নিজস্ব ডোমেইন।
      Google **Search Console**-এ ownership verify করা থাকতে হবে, এবং consent
      screen-এর **Authorized domains**-এ যোগ থাকতে হবে।
- [ ] **App home page** — পাবলিকলি খোলা একটা পেজ (ল্যান্ডিং `/` কাজ করবে)।
- [ ] **Privacy Policy URL** — একই ডোমেইনে, পাবলিক। এতে স্পষ্ট লেখা থাকতে হবে
      অ্যাপ কী ডেটা নেয়, Google ডেটা কীভাবে ব্যবহার/শেয়ার হয়।
- [ ] **Terms of Service URL** — ঐচ্ছিক কিন্তু রাখা ভালো।

> Privacy Policy-তে অবশ্যই বলবেন: "OpenKhata ব্যবহারকারীর খাতার একটি JSON
> স্ন্যাপশট **ব্যবহারকারীর নিজের Google Drive-এর লুকানো `appDataFolder`-এ**
> ব্যাকআপ রাখে; এই ডেটা ডেভেলপারের সার্ভারে যায় না।"

### ২. Branding (OAuth consent screen → Branding)

- [ ] **App name**: ওপেনখাতা / OpenKhata
- [ ] **User support email**
- [ ] **App logo** — 120×120px, পরিষ্কার, ট্রেডমার্ক-মুক্ত
- [ ] **Developer contact email**

### ৩. Scope justification (Data access)

- [ ] scope: `https://www.googleapis.com/auth/drive.appdata`
- [ ] justification (English, স্পষ্ট)। নমুনা:
  > "OpenKhata is an offline-first bookkeeping PWA. Users may optionally back up
  > their own ledger to their own Google Drive. We use `drive.appdata` to store a
  > single JSON snapshot in the hidden application data folder so only OpenKhata
  > can read/write it. We never access the user's other files, and the data is
  > never sent to our servers."

### ৪. Demo video (YouTube, unlisted হলেও চলে)

Sensitive scope verify করতে Google একটা ভিডিও চায় যাতে দেখা যায়:

- [ ] অ্যাপের OAuth **consent screen** (App name সহ) স্পষ্ট দেখা যাচ্ছে
- [ ] ব্যবহারকারী কীভাবে Google দিয়ে অনুমতি দেয় (grant flow)
- [ ] অ্যাপে ঠিক **কোন scope** কীভাবে ব্যবহার হচ্ছে (Drive-এ ব্যাকআপ ও রিস্টোর)
- [ ] URL bar-এ আপনার verified domain দেখা যাচ্ছে

### ৫. সাবমিট

- [ ] OAuth consent screen → **Publish app** (Testing → In production)
- [ ] Verification ফর্ম পূরণ করে সাবমিট
- [ ] Google-এর রিভিউ: সাধারণত কয়েক দিন–কয়েক সপ্তাহ। এর মধ্যে Test user-রা
      কাজ চালিয়ে যেতে পারবে।

---

## দ্রুত রেফারেন্স

| দরকার                | Testing মোড            | Public (verified)              |
| -------------------- | ---------------------- | ------------------------------ |
| কে ব্যবহার করতে পারে | শুধু Test users (≤১০০) | যে কেউ                         |
| Verification         | লাগে না                | লাগে (branding + video)        |
| CASA security audit  | না                     | না (`drive.appdata` sensitive) |
| "unverified" warning | দেখায়                 | দেখায় না                      |

**পরামর্শ:** Test user মোডে launch করে দিন এখনই; ব্যবহারকারী বাড়লে তখন
verification সাবমিট করুন। App ও লোকাল ব্যবহার এতে কোনোভাবেই আটকায় না — শুধু
Drive backup ফিচারটা Test user-দের মধ্যে সীমিত থাকে।
