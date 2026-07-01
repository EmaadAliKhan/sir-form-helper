/** Default country code for Sanathnagar / India voter forms. */
export const DEFAULT_WHATSAPP_COUNTRY_CODE = "91";

/** Strip leading country code for display in a +91-prefixed input. */
export function localMobileDigits(input: string, countryCode = DEFAULT_WHATSAPP_COUNTRY_CODE): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith(countryCode) && digits.length > countryCode.length) {
    return digits.slice(countryCode.length);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Normalize to international WhatsApp digits (no +), e.g. 919876543210. */
export function normalizeWhatsAppPhone(
  input: string,
  countryCode = DEFAULT_WHATSAPP_COUNTRY_CODE
): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 10) {
    return digits.slice(0, countryCode.length + 10);
  }

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `${countryCode}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0") && /^0[6-9]/.test(digits)) {
    return `${countryCode}${digits.slice(1)}`;
  }

  if (digits.length >= 11) {
    return digits;
  }

  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  return null;
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIOSDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export type WhatsAppLinkSet = {
  app: string;
  web: string;
  api: string;
};

export function buildWhatsAppLinks(phone: string, message: string): WhatsAppLinkSet {
  const text = encodeURIComponent(message);
  return {
    app: `whatsapp://send?phone=${phone}&text=${text}`,
    web: `https://wa.me/${phone}?text=${text}`,
    api: `https://api.whatsapp.com/send?phone=${phone}&text=${text}`,
  };
}

function openUrl(href: string, newTab: boolean): void {
  if (newTab) {
    const win = window.open(href, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.assign(href);
    }
    return;
  }
  window.location.assign(href);
}

/**
 * Open WhatsApp chat with pre-filled text.
 *
 * Must run synchronously inside the click handler — deferring with await/setTimeout breaks
 * mobile deep links and desktop popup permission.
 *
 * Mobile: HTTPS api.whatsapp.com opens the native app (universal link). Avoid Android
 * intent:// URLs — they duplicate the `text` param via browser_fallback_url.
 * Desktop: wa.me in a new tab.
 */
export function openWhatsAppChat(phone: string, message: string): void {
  const links = buildWhatsAppLinks(phone, message);

  if (isMobileDevice()) {
    // New tab keeps this page alive so save() + PDF download can finish after the hand-off to the app.
    const win = window.open(links.api, "_blank", "noopener,noreferrer");
    if (!win) {
      openUrl(links.api, false);
    }
    return;
  }

  openUrl(links.web, true);
}

/** Trigger PDF download without opening a new browser tab. */
export function triggerPdfDownload(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
