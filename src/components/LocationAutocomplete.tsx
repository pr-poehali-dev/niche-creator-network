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
  lang: string;
  // "city" — подсказки городов и областей/штатов/провинций (регион нужен, если
  // специалист зарегистрирован не в самом городе, а в области рядом).
  // "country" — подсказки только стран, без городов и регионов.
  field: "city" | "country";
};

const SUPPORTED_GEO_LANGS = new Set(["ru", "en", "fr", "de", "ja", "ar", "he"]);

// Кэш подсказок на время сессии: пользователь часто стирает и дописывает
// название города, а также возвращается к прежнему запросу — повторно
// дёргать функцию за тем же ответом незачем.
const suggestCache = new Map<string, LocationSuggestion[]>();
const SUGGEST_CACHE_LIMIT = 200;

function cacheSuggestions(key: string, items: LocationSuggestion[]) {
  if (suggestCache.size >= SUGGEST_CACHE_LIMIT) {
    const oldest = suggestCache.keys().next().value;
    if (oldest !== undefined) suggestCache.delete(oldest);
  }
  suggestCache.set(key, items);
}

// Подсказки городов, областей/штатов/провинций и стран по мере ввода —
// клиент по-прежнему вводит локацию вручную, но получает готовые варианты
// (в том числе соседние с крупными городами), чтобы не ошибиться в написании.
// Результаты переводятся на язык интерфейса пользователя независимо от того,
// на каком языке набран запрос (например, поиск города в Германии из японского интерфейса).
export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, icon, lang, field }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Не отправляем запрос, если поле уже закрыто/убрано с экрана.
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const geoLang = SUPPORTED_GEO_LANGS.has(lang) ? lang : "en";
    const key = `${field}::${geoLang}::${term.toLowerCase()}`;

    // Уже спрашивали это раньше — отвечаем из кэша, без обращения к серверу.
    const cached = suggestCache.get(key);
    if (cached) {
      setItems(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Пауза побольше: запрос уходит, когда человек закончил печатать,
    // а не после каждой буквы.
    debounceRef.current = setTimeout(() => {
      const reqId = ++requestIdRef.current;
      fetch(`${func2url["geocode-search"]}?q=${encodeURIComponent(term)}&lang=${geoLang}&field=${field}`)
        .then((r) => r.json())
        .then((d) => {
          const list: LocationSuggestion[] = Array.isArray(d.items) ? d.items : [];
          cacheSuggestions(key, list);
          // Игнорируем ответ, если пользователь уже набрал что-то другое.
          if (reqId === requestIdRef.current) setItems(list);
        })
        .catch(() => { if (reqId === requestIdRef.current) setItems([]); })
        .finally(() => { if (reqId === requestIdRef.current) setLoading(false); });
    }, 600);
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