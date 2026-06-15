import { useState, useEffect } from "react";
import func2url from "../../backend/func2url.json";

export type LS = { ru: string; en: string };

export type ProviderContacts = {
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  telegram: string | null;
  website: string | null;
};

export type ProviderVerification = {
  fullName?: string;
  legalStatus?: string;
  license?: string;
  licenses?: (string | { number?: string; date?: string; authority?: string })[];
  registry?: string;
  documents?: { title: string; url?: string }[];
  bio?: string;
  services?: { key: string; price?: string }[];
};

export type ServicePrices = Record<string, string>;

export type Provider = {
  slug: string;
  name: LS;
  title: LS;
  city: LS;
  lat: number | null;
  lon: number | null;
  price: LS;
  rating: number;
  reviews: number;
  cases: number;
  experience: number;
  img: string | null;
  tags: { ru: string[]; en: string[] };
  verified: boolean;
  active: boolean;
  contacts: ProviderContacts | null;
  verification: ProviderVerification | null;
  gender?: "m" | "f";
  isPseudonym?: boolean;
  age?: number | null;
  licenseVerified?: boolean;
  licensed?: boolean;
  timezone?: string | null;
  alwaysAvailable?: boolean;
  quietStart?: string | null;
  quietEnd?: string | null;
  country?: LS | null;
  plan?: string | null;
};

export function isPremium(p: Provider): boolean {
  return (p.plan || "").toLowerCase() === "premium";
}

const ORG_STATUSES = ["ип", "ооо", "ip", "ooo", "llc", "sole proprietor"];

export function isLicensed(p: Provider): boolean {
  if (typeof p.licensed === "boolean") return p.licensed;
  if (!p.verified || !p.licenseVerified) return false;
  const v = p.verification;
  if (!v) return false;
  const hasLicense = !!v.license || (Array.isArray(v.licenses) && v.licenses.length > 0);
  if (!hasLicense) return false;
  const status = (v.legalStatus || "").toLowerCase();
  return ORG_STATUSES.some((s) => status.includes(s));
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function isQuietNow(p: Provider): boolean {
  if (p.alwaysAvailable) return false;
  if (!p.quietStart || !p.quietEnd) return false;
  const tz = p.timezone;
  let now: Date;
  try {
    const localeStr = new Date().toLocaleString("en-US", tz ? { timeZone: tz } : {});
    now = new Date(localeStr);
  } catch {
    now = new Date();
  }
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = p.quietStart.split(":").map(Number);
  const [eh, em] = p.quietEnd.split(":").map(Number);
  const start = sh * 60 + (sm || 0);
  const end = eh * 60 + (em || 0);
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

export function providerLocalTime(p: Provider): string | null {
  if (!p.timezone) return null;
  try {
    return new Date().toLocaleTimeString("ru-RU", { timeZone: p.timezone, hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(func2url["providers"])
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.providers)) setProviders(d.providers);
        if (d.servicePrices && typeof d.servicePrices === "object") setServicePrices(d.servicePrices);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { providers, servicePrices, loading };
}