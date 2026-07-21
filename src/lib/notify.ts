/**
 * Local notifications (Phase 3).
 *
 * Uses the browser Notification API to surface a due-summary reminder while
 * the app is open. This is intentionally NOT background Web Push — that needs
 * a push service + VAPID keys + a server round-trip, which is out of scope for
 * a free, offline-first v1 (see ROADMAP Phase 3 note). The permission and
 * display plumbing here is the foundation background push would build on.
 */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission():
  NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** Show a local notification, preferring the service worker registration
 *  (so a tap can focus/route the app) and falling back to a page notification. */
export async function showLocalNotification(
  title: string,
  body: string,
): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return false;
  }
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: "/icons/icon-192.png" });
      return true;
    }
    new Notification(title, { body, icon: "/icons/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}
