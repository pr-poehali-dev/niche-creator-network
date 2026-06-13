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
  registry?: string;
};

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
};

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch(func2url["providers"])
      .then((r) => r.json())
      .then((d) => {
        if (alive && Array.isArray(d.providers)) setProviders(d.providers);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { providers, loading };
}