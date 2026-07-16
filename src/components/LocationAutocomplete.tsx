import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

export type LocationSuggestion = {
  name: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lon: number | null;
  type: "city" | "region" | "country";
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: LocationSuggestion) => void;
  placeholder: string;
  icon: string;
  lang: "ru" | "en" | string;
};

// Подсказки городов, областей/штатов/провинций и стран по мере ввода —
// клиент по-прежнему вводит локацию вручную, но получает готовые варианты
// (в том числе соседние с крупными городами), чтобы не ошибиться в написании.
export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, icon, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const geoLang = lang === "ru" ? "ru" : "en";
      fetch(`${func2url["geocode-search"]}?q=${encodeURIComponent(q.trim())}&lang=${geoLang}`)
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d.items)) setItems(d.items); })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 350);
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <div className="flex items-center gap-2 border border-border focus-within:border-gold bg-card rounded-sm px-3 transition-colors">
        <Icon name={icon} fallback="MapPin" size={15} className="text-gold shrink-0" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            fetchSuggestions(e.target.value);
          }}
          onFocus={() => { if (items.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        />
        {loading && <Icon name="Loader" size={14} className="text-muted-foreground animate-spin shrink-0" />}
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-50 top-full inset-x-0 mt-1 border border-border rounded-sm bg-card shadow-lg overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
          {items.map((it, i) => (
            <button
              key={`${it.name}-${it.region}-${it.country}-${i}`}
              onClick={() => {
                onChange(it.name);
                onSelect?.(it);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-start hover:bg-secondary transition-colors border-b border-border last:border-0"
            >
              <Icon
                name={it.type === "country" ? "Globe" : it.type === "region" ? "Map" : "MapPin"}
                size={14}
                className="text-gold shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-montserrat font-semibold text-foreground truncate">{it.name}</div>
                {(it.region || it.country) && (
                  <div className="text-[11px] text-muted-foreground truncate">
                    {[it.region, it.country].filter(Boolean).join(", ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
