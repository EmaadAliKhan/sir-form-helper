import { assetPath } from "./assetPath";
import { DEFAULT_SETTINGS, type AppSettings } from "./types";

const SETTINGS_KEY = "sir_app_settings";
const SITE_CONFIG_CACHE_KEY = "sir_site_config_fetched";

export interface SiteConfig {
  show_2025_search: boolean;
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  show_2025_search: false,
};

let siteConfigPromise: Promise<SiteConfig> | null = null;

async function fetchSiteConfig(): Promise<SiteConfig> {
  try {
    const res = await fetch(assetPath("/site-config.json"), { cache: "no-store" });
    if (!res.ok) return DEFAULT_SITE_CONFIG;
    const data = (await res.json()) as Partial<SiteConfig>;
    return { ...DEFAULT_SITE_CONFIG, ...data };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export function getSiteConfig(): Promise<SiteConfig> {
  if (!siteConfigPromise) {
    siteConfigPromise = fetchSiteConfig().then((config) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(config));
      }
      return config;
    });
  }
  return siteConfigPromise;
}

function readLocalSettings(): Partial<AppSettings> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    return null;
  }
}

export function saveLocalSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function getAppSettings(isAdmin = false): Promise<AppSettings> {
  const siteConfig = await getSiteConfig();
  const local = readLocalSettings() ?? {};
  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...local,
    show_2025_search: isAdmin
      ? (local.show_2025_search ?? siteConfig.show_2025_search)
      : siteConfig.show_2025_search,
  };
  return merged;
}

export function downloadSiteConfig(show2025Search: boolean): void {
  const blob = new Blob(
    [JSON.stringify({ show_2025_search: show2025Search }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "site-config.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function invalidateSiteConfigCache(): void {
  siteConfigPromise = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SITE_CONFIG_CACHE_KEY);
  }
}
