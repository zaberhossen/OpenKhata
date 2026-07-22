import { BACKUP_FILENAME } from "./backup";

/**
 * Google Drive backup transport (Growth phase). Uses Google Identity Services
 * (GIS) to get a short-lived access token for the `drive.appdata` scope, then
 * talks to the Drive REST API directly. The backup file lives in the hidden,
 * app-scoped `appDataFolder` — only OpenKhata can see it. Requires network;
 * degrades to a clear "not configured" state without a client ID.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GIS_SRC = "https://accounts.google.com/gsi/client";

export function isDriveConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

// Minimal shape of the GIS token client we rely on.
interface TokenResponse {
  access_token?: string;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
  callback: (resp: TokenResponse) => void;
}
interface GoogleGis {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (resp: TokenResponse) => void;
      }) => TokenClient;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleGis;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined")
    return Promise.reject(new Error("no window"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("Google স্ক্রিপ্ট লোড করা গেল না (নেট চেক করুন)।"));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

/** Interactive: get a Drive access token (may show a Google consent popup). */
export async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID) throw new Error("Google Drive কনফিগার করা নেই।");
  await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error || "টোকেন পাওয়া যায়নি।"));
          return;
        }
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

async function driveFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  }
  return res;
}

/** File id of the existing backup in appDataFolder, or null. */
async function findBackupId(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${BACKUP_FILENAME}'`);
  const res = await driveFetch(
    token,
    `/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`,
  );
  const json = (await res.json()) as { files?: { id: string }[] };
  return json.files?.[0]?.id ?? null;
}

/** Upload (create or overwrite) the backup content to appDataFolder. */
export async function uploadBackup(
  token: string,
  content: string,
): Promise<void> {
  const existingId = await findBackupId(token);
  const boundary = "openkhata-boundary";
  const metadata = existingId
    ? { name: BACKUP_FILENAME }
    : { name: BACKUP_FILENAME, parents: ["appDataFolder"] };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    `${content}\r\n` +
    `--${boundary}--`;

  await driveFetch(
    token,
    existingId
      ? `/upload/drive/v3/files/${existingId}?uploadType=multipart`
      : `/upload/drive/v3/files?uploadType=multipart`,
    {
      method: existingId ? "PATCH" : "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
}

/** Download the backup JSON string, or null if none exists yet. */
export async function downloadBackup(token: string): Promise<string | null> {
  const id = await findBackupId(token);
  if (!id) return null;
  const res = await driveFetch(token, `/drive/v3/files/${id}?alt=media`);
  return res.text();
}
