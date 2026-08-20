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
    if (!target.pairKey) return;
    fetch(`${func2url["messages"]}?kind=dm&pair=${encodeURIComponent(target.pairKey)}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.messages)) {
          setMsgs(d.messages.map((m: { fromId: string; text: string; createdAt: string | null }) => ({
            me: m.fromId === myDmId,
            text: m.text,
            time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" }) : "",
          })));
        }
      })
      .catch(() => {});
  }, [target.pairKey, myDmId, lang]);

  useEffect(() => { loadDm(); }, [loadDm]);

  const send = async () => {
    const text = cleanText(chatInput.trim());
    if (!text) return;
    if (target.pairKey) {
      const toId = target.pairKey.split(":").find((p) => p !== myDmId) || "";
      await fetch(func2url["messages"], {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ action: "dm_send", pair: target.pairKey, fromName: user?.name || "", toId, text }),
      }).catch(() => {});
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
  );
}

export function ChatSection({ chatInput, setChatInput }: { chatInput: string; setChatInput: (v: string) => void }) {
  const { lang, tr } = useLang();
  const { user } = useAuth();
  const rooms = [{ id: "general", title: { ru: "Общий чат", en: "General" } }, ...serviceCategories.map((c) => ({ id: c.id, title: c.title }))];
  const [room, setRoom] = useState("general");
  const [msgs, setMsgs] = useState<{ author: string; text: string; createdAt: string | null }[]>([]);
  const me = user ? `user-${user.id}` : "guest";
  const myName = user?.name || tr("chatGuestName");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "chat_send", room, authorId: me, authorName: myName, text }),
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

type ForumTopic = { id: number; category: string; title: string; author: string; views: number; replies: number; createdAt: string | null };
type ForumPost = { author: string; text: string; createdAt: string | null };

export function ForumSection() {
  const { lang, tr } = useLang();
  const { user } = useAuth();
  const me = user ? `user-${user.id}` : "guest";
  const myName = user?.name || tr("chatGuestName");
  const [cat, setCat] = useState("");
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("");
  const [openTopic, setOpenTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [reply, setReply] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  // Форум международный: переводим и заголовки тем, и тексты ответов.
  const forumTexts = useMemo(
    () => [...topics.map((tp) => tp.title), ...posts.map((pp) => pp.text)],
    [topics, posts],
  );
  const { resolve: trForum, isTranslated: forumTranslated } = useAutoTranslate(forumTexts);

  const loadTopics = useCallback((c: string) => {
    fetch(`${func2url["messages"]}?kind=forum${c ? `&category=${c}` : ""}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.topics)) setTopics(d.topics); })
      .catch(() => {});
  }, []);

  useEffect(() => { if (!openTopic) loadTopics(cat); }, [cat, openTopic, loadTopics]);

  const loadTopic = (t: ForumTopic) => {
    setOpenTopic(t);
    fetch(`${func2url["messages"]}?kind=forum_topic&topicId=${t.id}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.posts)) setPosts(d.posts); })
      .catch(() => {});
  };

  const createTopic = async () => {
    const title = cleanText(newTitle.trim());
    if (!title) return;
    await fetch(func2url["messages"], {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forum_create", category: newCat, title, authorId: me, authorName: myName }),
    });
    setNewTitle(""); setNewCat(""); setNewOpen(false);
    loadTopics(cat);
  };

  const sendReply = async () => {
    if (!openTopic) return;
    const text = cleanText(reply.trim());
    if (!text) return;
    setReply("");
    await fetch(func2url["messages"], {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forum_reply", topicId: openTopic.id, authorId: me, authorName: myName, text }),
    });
    fetch(`${func2url["messages"]}?kind=forum_topic&topicId=${openTopic.id}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.posts)) setPosts(d.posts); });
  };

  const catTitle = (id: string) => { const c = serviceCategories.find((x) => x.id === id); return c ? L(c.title, lang) : id || "—"; };
  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }) : "";

  const moderate = async (topicId: number, action: "forum_delete" | "forum_block") => {
    if (action === "forum_delete" && !window.confirm(tr("forumDeleteConfirm"))) return;
    await fetch(func2url["messages"], {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": localStorage.getItem("shchit_auth_token") || "" },
      body: JSON.stringify({ action, topicId }),
    });
    loadTopics(cat);
  };

  if (openTopic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setOpenTopic(null); setPosts([]); }} className="text-xs text-muted-foreground hover:text-gold transition-colors font-montserrat flex items-center gap-1">
            <Icon name="ArrowLeft" size={13} />{tr("forumBackToList")}
          </button>
          <button onClick={() => setReportOpen(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-montserrat flex items-center gap-1">
            <Icon name="Flag" size={13} />{tr("reportBtn")}
          </button>
        </div>
        {reportOpen && <ReportModal targetType="forum_topic" targetId={String(openTopic.id)} onClose={() => setReportOpen(false)} />}
        <div className="mb-2"><span className="tag-security">{catTitle(openTopic.category)}</span></div>
        <h2 className="font-montserrat font-bold text-2xl text-foreground mb-1">{openTopic.title}</h2>
        <div className="text-xs text-muted-foreground mb-6">{openTopic.author} · {fmtDate(openTopic.createdAt)}</div>

        <div className="space-y-3 mb-6">
          {posts.length === 0 && <div className="text-sm text-muted-foreground border border-dashed border-border rounded-sm py-8 text-center">{tr("forumNoPosts")}</div>}
          {posts.map((p, i) => (
            <div key={i} className="border border-border rounded-sm bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 gold-gradient rounded-sm flex items-center justify-center text-xs font-montserrat font-bold text-[hsl(28,20%,7%)]">{(p.author || "?")[0]}</div>
                <span className="text-xs font-montserrat font-semibold text-foreground">{p.author}</span>
                <span className="text-[10px] text-muted-foreground ms-auto">{fmtDate(p.createdAt)}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{trForum(p.text)}</p>
              {forumTranslated(p.text) && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <Icon name="Languages" size={10} />
                  {tr("autoTranslated")}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border border-border rounded-sm bg-card p-4">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder={tr("forumReplyPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold resize-none mb-2" />
          <button onClick={sendReply} disabled={!reply.trim()} className="gold-gradient text-[hsl(28,20%,7%)] px-5 py-2 text-xs font-montserrat font-bold rounded-sm disabled:opacity-50">{tr("forumReplyBtn")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="tag-security mb-3 inline-block">{tr("discussions")}</div>
          <h2 className="font-montserrat font-bold text-3xl text-foreground">{tr("proForum")}</h2>
        </div>
        <button onClick={() => setNewOpen((o) => !o)} className="gold-gradient text-[hsl(28,20%,7%)] px-5 py-2.5 text-xs font-montserrat font-bold rounded-sm self-start flex items-center gap-1.5">
          <Icon name={newOpen ? "X" : "Plus"} size={14} />{newOpen ? tr("cancel") : tr("createTopic")}
        </button>
      </div>

      {newOpen && (
        <div className="border border-gold/30 rounded-sm bg-secondary/40 p-4 mb-6 space-y-3">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("pdCaseCat")}</label>
            <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-gold">
              <option value="">{tr("forumAllCats")}</option>
              {serviceCategories.map((c) => <option key={c.id} value={c.id}>{L(c.title, lang)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">{tr("forumNewTopicTitle")}</label>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={tr("forumNewTopicPh")} className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold" />
          </div>
          <button onClick={createTopic} disabled={!newTitle.trim()} className="gold-gradient text-[hsl(28,20%,7%)] px-4 py-2 text-xs font-montserrat font-bold rounded-sm disabled:opacity-50">{tr("forumCreateBtn")}</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setCat("")} className={`px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border transition-colors ${cat === "" ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-border text-muted-foreground hover:text-gold"}`}>{tr("forumAllCats")}</button>
        {serviceCategories.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id === cat ? "" : c.id)} className={`px-3 py-1.5 text-xs font-montserrat font-semibold rounded-sm border transition-colors ${cat === c.id ? "gold-gradient text-[hsl(28,20%,7%)] border-transparent" : "border-border text-muted-foreground hover:text-gold"}`}>{L(c.title, lang)}</button>
        ))}
      </div>

      <div className="space-y-3">
        {topics.length === 0 && <div className="text-sm text-muted-foreground border border-dashed border-border rounded-sm py-12 text-center">{tr("forumEmpty")}</div>}
        {topics.map((tp) => (
          <div key={tp.id} className="border border-border rounded-sm bg-card p-4 card-lift">
            <div className="md:grid grid-cols-12 gap-4 items-center">
              <div className="col-span-8 cursor-pointer" onClick={() => loadTopic(tp)}>
                <div className="flex items-center gap-2 mb-1"><span className="tag-security">{catTitle(tp.category)}</span></div>
                <div className="font-montserrat font-semibold text-sm text-foreground mt-2">{trForum(tp.title)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{tp.author} · {fmtDate(tp.createdAt)}</div>
              </div>
              <div className="col-span-2 text-center mt-3 md:mt-0 cursor-pointer" onClick={() => loadTopic(tp)}>
                <div className="text-xs font-montserrat font-bold text-foreground">{tp.replies}</div>
                <div className="text-[10px] text-muted-foreground">{tr("repliesLower")}</div>
              </div>
              <div className="col-span-2 text-center cursor-pointer" onClick={() => loadTopic(tp)}>
                <div className="text-xs font-montserrat font-bold text-foreground">{tp.views}</div>
                <div className="text-[10px] text-muted-foreground">{tr("viewsLower")}</div>
              </div>
            </div>
            {user?.isAdmin && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => moderate(tp.id, "forum_block")} className="flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-muted-foreground hover:text-amber-400 transition-colors">
                  <Icon name="Ban" size={12} />{tr("forumBlock")}
                </button>
                <button onClick={() => moderate(tp.id, "forum_delete")} className="flex items-center gap-1.5 text-[11px] font-montserrat font-semibold text-muted-foreground hover:text-destructive transition-colors">
                  <Icon name="Trash2" size={12} />{tr("forumDelete")}
                </button>
              </div>
            )}
          </div>
        ))}
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
