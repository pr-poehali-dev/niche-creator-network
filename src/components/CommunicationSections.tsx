import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authHeaders } from "@/lib/authToken";
import { cleanText } from "@/lib/moderation";
import { useAutoTranslate } from "@/lib/autotranslate";
import { trackGoal, GOALS } from "@/lib/analytics";
import { ReportModal } from "@/components/ReviewsAndReports";
import { FaqAccordion } from "@/components/LandingSections";
import { L, shortName } from "@/lib/shared";
import { serviceCategories } from "@/lib/servicesCatalog";
import func2url from "../../backend/func2url.json";

export function DirectChatSection({ target, chatInput, setChatInput, onBack }: { target: { name: string; title: string; avatar?: string | null; pairKey?: string }; chatInput: string; setChatInput: (v: string) => void; onBack: () => void }) {
  const { lang, tr } = useLang();
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<{ me: boolean; text: string; time: string }[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  // Переписка закрыта: дружба не подтверждена или её разорвали.
  const [blocked, setBlocked] = useState(false);
  const dmEndRef = useRef<HTMLDivElement | null>(null);
  // Ссылка на актуальный список — нужна опросу, чтобы понять, пришло ли
  // что-то новое, не пересоздавая при этом сам цикл опроса.
  const msgsRef = useRef(msgs);
  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  // Автоперевод переписки: собеседники могут писать на разных языках, включая
  // те, которых нет в интерфейсе. Мемоизация обязательна — иначе новый массив
  // на каждый рендер зацикливает хук.
  const incoming = useMemo(() => msgs.filter((m) => !m.me).map((m) => m.text), [msgs]);
  const { resolve: trMsg, isTranslated } = useAutoTranslate(incoming);
  const initial = (target.name || "?").trim()[0] || "?";
  const myDmId = user ? `u${user.id}` : "";

  // Если есть pairKey (переписка с другом) — используем реальный backend DM,
  // иначе оставляем локальную демо-переписку (совместимость со старым поведением).
  const loadDm = useCallback(() => {
    if (!target.pairKey) return Promise.resolve();
    return fetch(`${func2url["messages"]}?kind=dm&pair=${encodeURIComponent(target.pairKey)}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        // Дружбу могли разорвать, пока окно было открыто — тогда сервер
        // закрывает переписку, и человек должен понять почему.
        if (d.error === "not_friends") { setBlocked(true); return; }
        setBlocked(false);
        if (Array.isArray(d.messages)) {
          const next = d.messages.map((m: { fromId: string; text: string; createdAt: string | null }) => ({
            me: m.fromId === myDmId,
            text: m.text,
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }) : "",
          }));
          // Обновляем состояние только если переписка реально изменилась:
          // иначе каждые несколько секунд пересоздавался бы список сообщений
          // и перезапускался автоперевод — лишняя нагрузка на ровном месте.
          setMsgs((prev) => (
            prev.length === next.length && prev.every((p, i) => p.text === next[i].text && p.me === next[i].me)
              ? prev
              : next
          ));
        }
      })
      .catch(() => {});
  }, [target.pairKey, myDmId, lang]);

  useEffect(() => { loadDm(); }, [loadDm]);

  // Прокрутка к последнему сообщению: иначе новое пришедшее оказывается
  // ниже видимой области и человек его не замечает.
  useEffect(() => { dmEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Новые сообщения подтягиваются сами, пока окно чата открыто.
  // Два правила экономии, без которых открытый чат жёг бы вызовы функции:
  //  - вкладка не видна → опрос полностью остановлен;
  //  - в переписке тишина → интервал растёт с 5 до 30 секунд, а на первое же
  //    новое сообщение сбрасывается обратно, так что живой диалог остаётся
  //    быстрым.
  useEffect(() => {
    if (!target.pairKey || blocked) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let delay = 5000;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      const before = msgsRef.current;
      await loadDm();
      const changed = msgsRef.current !== before;
      delay = changed ? 5000 : Math.min(delay * 1.5, 30000);
      if (!stopped && !document.hidden) timer = setTimeout(tick, delay);
    };
    const stop = () => { stopped = true; if (timer) { clearTimeout(timer); timer = null; } };
    const start = () => {
      stopped = false;
      if (!timer) timer = setTimeout(tick, delay);
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { delay = 5000; loadDm(); start(); }
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [target.pairKey, blocked, loadDm]);

  const send = async () => {
    const text = cleanText(chatInput.trim());
    if (!text || blocked) return;
    if (target.pairKey) {
      const toId = target.pairKey.split(":").find((p) => p !== myDmId) || "";
      const res = await fetch(func2url["messages"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "dm_send", pair: target.pairKey, toId, text }),
      }).catch(() => null);
      // Дружбу разорвали между открытием окна и отправкой — показываем причину,
      // а не молча теряем сообщение.
      if (res && res.status === 403) { setBlocked(true); return; }
      setChatInput("");
      loadDm();
      return;
    }
    const time = new Date().toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
    setMsgs((m) => [...m, { me: true, text, time }]);
    setChatInput("");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <button aria-label="Назад" onClick={onBack} className="text-xs text-muted-foreground hover:text-gold transition-colors font-montserrat flex items-center gap-1 mb-4">
        <Icon name="ArrowLeft" size={13} />{tr("back")}
      </button>
      <div className="border border-border rounded-sm bg-card overflow-hidden flex flex-col" style={{ height: "600px" }}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm overflow-hidden gold-gradient flex items-center justify-center shrink-0">
            {target.avatar ? <img src={target.avatar} alt={shortName(target.name)} loading="lazy" className="w-full h-full object-cover" /> : <span className="font-montserrat font-bold text-sm text-[hsl(28,20%,7%)]">{initial}</span>}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-montserrat font-semibold text-foreground truncate">{shortName(target.name)}</div>
            <div className="text-[11px] text-muted-foreground truncate">{target.title}</div>
          </div>
          <div className="flex items-center gap-3 ms-auto">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">{tr("online")}</span>
            </div>
            <button onClick={() => setReportOpen(true)} className="text-muted-foreground hover:text-destructive transition-colors" title={tr("reportBtn")}>
              <Icon name="Flag" size={15} />
            </button>
          </div>
        </div>

        {reportOpen && <ReportModal targetType="message" targetId={target.name} onClose={() => setReportOpen(false)} />}

        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
          {msgs.length === 0 && (
            <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">{tr("dcEmpty")}</div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-sm px-3.5 py-2 ${m.me ? "gold-gradient text-[hsl(28,20%,7%)]" : "bg-secondary text-foreground"}`}>
                <div className="text-sm leading-relaxed">{m.me ? m.text : trMsg(m.text)}</div>
                <div className={`text-[10px] mt-1 flex items-center gap-1.5 ${m.me ? "text-[hsl(28,20%,7%)]/70" : "text-muted-foreground"}`}>
                  {m.time}
                  {!m.me && isTranslated(m.text) && (
                    <span className="inline-flex items-center gap-1" title={tr("autoTranslated")}>
                      <Icon name="Languages" size={10} />
                      {tr("autoTranslated")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={dmEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          {blocked ? (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-secondary/50 border border-border rounded-sm px-3.5 py-3">
              <Icon name="Lock" size={15} className="text-gold shrink-0" />
              <span className="leading-relaxed">{tr("dcNotFriends")}</span>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder={tr("writeMessage")}
                className="flex-1 bg-secondary border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
              />
              <button aria-label={tr("writeMessage")} onClick={send} className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
                <Icon name="Send" size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatSection({ chatInput, setChatInput }: { chatInput: string; setChatInput: (v: string) => void }) {
  const { lang, tr } = useLang();
  const rooms = [{ id: "general", title: { ru: "Общий чат", en: "General" } }, ...serviceCategories.map((c) => ({ id: c.id, title: c.title }))];
  const [room, setRoom] = useState("general");
  const [msgs, setMsgs] = useState<{ author: string; text: string; createdAt: string | null }[]>([]);
  // Имя автора больше не передаётся с фронтенда: сервер берёт его из сессии,
  // иначе подпись в чате можно было подделать.
  const endRef = useRef<HTMLDivElement | null>(null);
  // Общий чат международный: сообщения переводятся на язык интерфейса,
  // включая языки, которых нет в списке сайта.
  const chatTexts = useMemo(() => msgs.map((m) => m.text), [msgs]);
  const { resolve: trMsg, isTranslated } = useAutoTranslate(chatTexts);

  const loadMsgs = useCallback((r: string) => {
    fetch(`${func2url["messages"]}?kind=chat&room=${r}`)
      .then((res) => res.json())
      .then((d) => { if (Array.isArray(d.messages)) setMsgs(d.messages); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadMsgs(room); }, [room, loadMsgs]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const text = cleanText(chatInput.trim());
    if (!text) return;
    setChatInput("");
    await fetch(func2url["messages"], {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: "chat_send", room, text }),
    });
    loadMsgs(room);
  };

  const fmtTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }) : "";
  const activeRoom = rooms.find((r) => r.id === room) || rooms[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <div className="tag-security mb-3 inline-block">{tr("community")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("proChat")}</h2>
      </div>
      <div className="border border-border rounded-sm bg-card overflow-hidden" style={{ height: "600px" }}>
        <div className="flex h-full">
          <div className="w-60 border-e border-border flex-col hidden md:flex">
            <div className="p-4 border-b border-border">
              <div className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest">{tr("channels")}</div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {rooms.map((r) => (
                <button key={r.id} onClick={() => setRoom(r.id)} className={`w-full text-left px-4 py-3 cursor-pointer hover:bg-secondary transition-colors border-b border-border last:border-0 ${room === r.id ? "bg-secondary" : ""}`}>
                  <div className={`text-xs font-montserrat font-medium ${room === r.id ? "text-gold" : "text-foreground"}`}>{L(r.title, lang)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="text-sm font-montserrat font-semibold text-foreground truncate">{L(activeRoom.title, lang)}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {msgs.length === 0 && <div className="text-sm text-muted-foreground text-center py-10">{tr("chatEmpty")}</div>}
              {msgs.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center shrink-0 font-montserrat font-bold text-xs text-[hsl(28,20%,7%)]">
                    {(m.author || "?")[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-montserrat font-semibold text-foreground">{m.author}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtTime(m.createdAt)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{trMsg(m.text)}</div>
                    {isTranslated(m.text) && (
                      <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                        <Icon name="Languages" size={10} />
                        {tr("autoTranslated")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder={tr("writeMessage")}
                  className="flex-1 bg-secondary border border-border rounded-sm px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors"
                />
                <button aria-label="Отправить" onClick={send} className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export function ContactsSection() {
  const { tr } = useLang();
  const [fbName, setFbName] = useState("");
  const [fbEmail, setFbEmail] = useState("");
  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbState, setFbState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => { trackGoal(GOALS.openContacts); }, []);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fbEmail.trim());
  const canSend = emailValid && fbMessage.trim().length > 0 && fbState !== "sending";

  const subjects = [tr("subjVerify"), tr("subjPayment"), tr("subjTech"), tr("subjComplaint"), tr("subjOther")];

  const sendFeedback = async () => {
    if (!canSend) return;
    setFbState("sending");
    try {
      const res = await fetch(func2url["feedback"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fbName.trim(),
          email: fbEmail.trim(),
          subject: fbSubject || subjects[0],
          message: fbMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("send failed");
      setFbState("sent");
      setFbName(""); setFbEmail(""); setFbSubject(""); setFbMessage("");
    } catch {
      setFbState("error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="tag-security mb-3 inline-block">{tr("support")}</div>
        <h2 className="font-montserrat font-bold text-3xl text-foreground mb-2">{tr("contactsTitle")}</h2>
        <p className="text-muted-foreground text-sm">{tr("contactsDesc")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-border rounded-sm bg-card p-8">
          <div className="text-sm font-montserrat font-bold text-foreground mb-6">{tr("writeSupport")}</div>
          {fbState === "sent" ? (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center mb-4 glow-gold-sm">
                <Icon name="CheckCircle2" size={26} className="text-[hsl(28,20%,7%)]" />
              </div>
              <div className="font-montserrat font-bold text-base text-foreground mb-1">{tr("feedbackSentTitle")}</div>
              <div className="text-sm text-muted-foreground mb-6">{tr("feedbackSentDesc")}</div>
              <button onClick={() => setFbState("idle")} className="border border-gold text-gold text-xs font-montserrat font-semibold px-5 py-2.5 hover:bg-gold hover:text-[hsl(28,20%,7%)] transition-all rounded-sm">
                {tr("feedbackSendAnother")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("name")}</label>
                <input value={fbName} onChange={(e) => { setFbName(e.target.value); setFbState("idle"); }} placeholder={tr("yourName")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">Email</label>
                <input type="email" value={fbEmail} onChange={(e) => { setFbEmail(e.target.value); setFbState("idle"); }} placeholder="your@email.com" className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors" />
              </div>
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("subject")}</label>
                <select value={fbSubject} onChange={(e) => setFbSubject(e.target.value)} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition-colors">
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-montserrat font-semibold text-foreground uppercase tracking-widest block mb-2">{tr("message")}</label>
                <textarea rows={4} value={fbMessage} onChange={(e) => { setFbMessage(e.target.value); setFbState("idle"); }} placeholder={tr("describeQuestion")} className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold transition-colors resize-none" />
              </div>
              {fbState === "error" && (
                <div className="flex items-center gap-2 text-sm text-destructive"><Icon name="CircleAlert" size={16} />{tr("feedbackError")}</div>
              )}
              <button onClick={sendFeedback} disabled={!canSend} className="w-full gold-gradient text-[hsl(28,20%,7%)] py-3.5 font-montserrat font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {fbState === "sending" ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {tr("sendMessage")}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {[
            { icon: "Mail", title: tr("emailSupport"), val: "shieldpspl@yandex.ru", desc: tr("emailSupportDesc") },
            { icon: "MapPin", title: tr("legalAddress"), val: "Московская обл., г. Электросталь, пос. Всеволодово", desc: "ИП Давыдов Алексей Владимирович · ОГРНИП 320222500068242 · ИНН 222111361597" },
          ].map((c) => (
            <div key={c.title} className="border border-border rounded-sm bg-card p-5 flex gap-4 card-lift">
              <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
                <Icon name={c.icon} size={18} className="text-[hsl(28,20%,7%)]" />
              </div>
              <div>
                <div className="text-xs font-montserrat font-semibold text-muted-foreground uppercase tracking-widest mb-1">{c.title}</div>
                <div className="font-montserrat font-bold text-sm text-foreground mb-0.5">{c.val}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
              </div>
            </div>
          ))}

          <div className="border border-gold/30 rounded-sm bg-card p-5 flex gap-4">
            <div className="w-10 h-10 gold-gradient rounded flex items-center justify-center shrink-0">
              <Icon name="Clock" size={18} className="text-[hsl(28,20%,7%)]" />
            </div>
            <div>
              <div className="text-xs font-montserrat font-semibold text-gold uppercase tracking-widest mb-1">{tr("feedbackReplyTitle")}</div>
              <div className="text-xs text-muted-foreground">{tr("feedbackReplyDesc")}</div>
            </div>
          </div>
        </div>
      </div>

      <FaqAccordion
        tag={tr("contactFaqTag")}
        title={tr("contactFaqTitle")}
        items={[
          { q: "contactFaq1Q", a: "contactFaq1A" },
          { q: "contactFaq2Q", a: "contactFaq2A" },
          { q: "contactFaq3Q", a: "contactFaq3A" },
          { q: "contactFaq4Q", a: "contactFaq4A" },
          { q: "contactFaq5Q", a: "contactFaq5A" },
        ]}
      />
    </div>
  );
}