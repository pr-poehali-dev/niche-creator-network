import { useState, useEffect } from "react";
import func2url from "../../backend/func2url.json";

export type GeoInfo = {
  city: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lon: number | null;
};

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function useGeo() {
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = window.localStorage.getItem("geo");
    if (cached) {
      try {
        setGeo(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        /* ignore */
      }
    }
    fetch(func2url["geolocate"])
      .then((r) => r.json())
      .then((d: GeoInfo) => {
        if (!active) return;
        if (d && (d.city || d.countryCode)) {
          setGeo(d);
          window.localStorage.setItem("geo", JSON.stringify(d));
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { geo, loading };
}
