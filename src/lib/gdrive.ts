import { BACKUP_FILENAME } from "./backup";

/**
 * Google Drive backup transport (Growth phase). Uses Google Identity Services
 * (GIS) to get a short-lived access token for the `drive.appdata` scope, then
 * talks to the Drive REST API directly. The backup file lives in the hidden,
 * app-scoped `appDataFolder` — only OpenKhata can see it. Requires network;
 * degrades to a clear "not configured" state without a client ID.
 *
 * Tokens are cached in memory (~1h) and can be refreshed silently (no popup)
 * once the user has granted access, which is what makes the automatic,
 * WhatsApp-style backup possible while the app is open.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
// `openid email` lets us show which account is connected; drive.appdata is the
// backup scope. Adding email is non-sensitive and doesn't change verification.
const SCOPE = "openid email https://www.googleapis.com/auth/drive.appdata";
const GIS_SRC = "https://accounts.google.com/gsi/client";

export function isDriveConfigured(): boolean {
  return Boolean(CLIENT_ID);
}

/** Thrown when a silent token can't be obtained — the user must re-grant. */
export class NeedsReconnectError extends Error {
  constructor(message = "Google Drive-এ আবার সংযোগ দিন।") {
    super(message);
    this.name = "NeedsReconnectError";
  }
}

// Minimal shape of the GIS token client we rely on.
interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}
interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
}
interface GoogleGis {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        prompt?: string;
        // Pre-selects this Google account in the consent/chooser UI so the
        // backup lands in the same account the user logged in with.
        hint?: string;
        callback: (resp: TokenResponse) => void;
        error_callback?: (err: { type?: string }) => void;
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

// In-memory access-token cache (never persisted — tokens are short-lived).
let cachedToken: { value: string; expiresAt: number } | null = null;
const TOKEN_SKEW_MS = 120_000; // refresh 2 min before expiry

/** Forget the cached token (used on disconnect). */
export function clearDriveToken(): void {
  cachedToken = null;
}

/**
 * Get a Drive access token. `interactive: true` may show a Google consent
 * popup (call only from a user gesture). `interactive: false` refreshes
 * silently and throws `NeedsReconnectError` if consent is required. `hint` is
 * the user's login email — passed so Google pre-selects that account, keeping
 * the backup in the same account the user signed in with.
 */
export async function getAccessToken(
  { interactive, hint }: { interactive: boolean; hint?: string } = {
    interactive: true,
  },
): Promise<string> {
  if (!CLIENT_ID) throw new Error("Google Drive কনফিগার করা নেই।");
  if (cachedToken && cachedToken.expiresAt - TOKEN_SKEW_MS > Date.now()) {
    return cachedToken.value;
  }
  await loadGis();
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      ...(hint ? { hint } : {}),
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          const err = resp.error || "টোকেন পাওয়া যায়নি।";
          reject(interactive ? new Error(err) : new NeedsReconnectError());
          return;
        }
        cachedToken = {
          value: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
        };
        resolve(resp.access_token);
      },
      // Fires for popup-level failures (e.g. blocked, or silent needs consent).
      error_callback: () => {
        reject(
          interactive
            ? new Error("Google অনুমতি নেওয়া গেল না।")
            : new NeedsReconnectError(),
        );
      },
    });
    // Empty prompt = silent; default = allow the consent UI when needed.
    client.requestAccessToken(interactive ? {} : { prompt: "" });
  });
}

/** The signed-in Google account's email (for display), or null. */
export async function getConnectedEmail(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  } catch {
    return null;
  }
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

/** Whether a backup already exists in the user's Drive appDataFolder. */
export async function hasRemoteBackup(token: string): Promise<boolean> {
  return (await findBackupId(token)) !== null;
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
