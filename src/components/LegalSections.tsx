// Страница юридического документа: оглавление, разделы, блок вопросов.
// Открывают единицы, а текст — самый объёмный на сайте, поэтому грузится
// по требованию.

import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { FaqAccordion } from "@/components/LandingSections";
import type { LegalDoc } from "@/lib/legalDocs";
import type { Section } from "@/lib/shared";

export function LegalDocSection({ doc, setActive, showFaq }: { doc: LegalDoc; setActive: (s: Section) => void; showFaq?: boolean }) {
  const { tr } = useLang();
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border border-gold/30 rounded-sm glass-card p-8 md:p-10 mb-8 relative overflow-hidden security-glow ambient-gold">
        <div className="absolute inset-0 grid-line-bg opacity-30" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center shrink-0 glow-gold-sm">
            <Icon name={doc.icon} fallback="FileText" size={30} className="text-[hsl(28,20%,7%)]" />
          </div>
          <div>
            <div className="tag-security mb-3 inline-block">{tr(doc.tag)}</div>
            <h1 className="font-montserrat font-extrabold text-3xl md:text-4xl text-foreground mb-2">{tr(doc.title)}</h1>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon name="Calendar" size={12} className="text-gold" />
              {tr("polUpdated")}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <div className="lg:sticky lg:top-24 border border-border rounded-sm bg-card p-5">
            <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest mb-4">{tr("polNav")}</div>
            {doc.sections.map((s, i) => (
              <a key={s.title} href={`#lgl-${i}`} className="flex items-center gap-2 py-2 border-b border-border last:border-0 cursor-pointer group">
                <span className="font-montserrat font-bold text-[10px] text-gold w-4">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xs text-muted-foreground group-hover:text-gold transition-colors">{tr(s.title).replace(/^\d+\.\s*/, "")}</span>
              </a>
            ))}
          </div>
        </aside>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="border border-border rounded-sm bg-card p-6 md:p-8 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(doc.intro)}</p>
          </div>

          <div className="space-y-5 stagger">
            {doc.sections.map((s, i) => (
              <div key={s.title} id={`lgl-${i}`} className="border border-border rounded-sm bg-card p-6 md:p-7 card-lift scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 gold-gradient rounded flex items-center justify-center shrink-0 glow-gold-sm">
                    <span className="font-montserrat font-extrabold text-sm text-[hsl(28,20%,7%)]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div>
                    <h2 className="font-montserrat font-bold text-base text-foreground mb-2">{tr(s.title)}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(s.text)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showFaq && (
            <FaqAccordion
              tag={tr("privFaqTag")}
              title={tr("privFaqTitle")}
              items={[
                { q: "privFaq1Q", a: "privFaq1A" },
                { q: "privFaq2Q", a: "privFaq2A" },
                { q: "privFaq3Q", a: "privFaq3A" },
                { q: "privFaq4Q", a: "privFaq4A" },
                { q: "privFaq5Q", a: "privFaq5A" },
              ]}
            />
          )}

          <div className="mt-8 border border-gold/30 rounded-sm bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="Building2" size={16} className="text-gold shrink-0" />
              <h2 className="font-montserrat font-bold text-sm text-foreground uppercase tracking-widest">{tr("reqTitle")}</h2>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
              <div className="font-semibold text-foreground">{tr("reqName")}</div>
              <div>{tr("reqOgrnip")} · {tr("reqInn")}</div>
              <div>{tr("reqAddress")}</div>
              <div>{tr("reqTaxOffice")}</div>
            </div>
          </div>

          <div className="mt-6 border border-border rounded-sm bg-card/60 p-5 flex items-start gap-3">
            <Icon name="Info" size={16} className="text-gold mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{tr("lglDisclaimer")}</p>
          </div>

          <div className="mt-6 border border-gold/30 rounded-sm glass-card p-8 text-center security-glow">
            <Icon name="LifeBuoy" size={32} className="text-gold mx-auto mb-4" />
            <h2 className="font-montserrat font-bold text-xl text-foreground mb-2">{tr("polContactTitle")}</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">{tr("polContactText")}</p>
            <button
              onClick={() => setActive("contacts")}
              className="gold-gradient text-[hsl(28,20%,7%)] px-8 py-3 font-montserrat font-bold text-sm rounded-sm"
            >
              {tr("polContactBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
