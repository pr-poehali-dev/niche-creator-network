import Icon from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { type Section } from "@/lib/shared";

type Tab = {
  id: Section | "new-request";
  key: Parameters<ReturnType<typeof useLang>["tr"]>[0];
  icon: string;
  primary?: boolean;
};

// Нижняя панель вкладок для телефона.
//
// Так устроены все приложения, которыми человек пользуется каждый день:
// Instagram, Telegram, Авито, Профи. Главные разделы — под большим пальцем,
// одно касание, без поиска. Раньше на телефоне всё пряталось в меню-
// «гамбургер» в правом верхнем углу: туда одной рукой не дотянуться, а
// пока не откроешь меню — не видно, что на сайте вообще есть.
//
// Пять вкладок — предел: шестая уже не помещается под палец на узком
// экране. Центральная — главное действие площадки: оставить заявку.
const GUEST_TABS: Tab[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "specialists", key: "tabSpecialists", icon: "Users" },
  { id: "new-request", key: "tabNewRequest", icon: "Plus", primary: true },
  { id: "blog", key: "navBlog", icon: "BookOpen" },
  { id: "dashboard", key: "tabProfile", icon: "CircleUser" },
];

const CLIENT_TABS: Tab[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "services", key: "navSearch", icon: "Search" },
  { id: "new-request", key: "tabNewRequest", icon: "Plus", primary: true },
  { id: "resumes", key: "navResumes", icon: "BriefcaseBusiness" },
  { id: "dashboard", key: "tabProfile", icon: "CircleUser" },
];

// Исполнителю заявку создавать незачем — он их получает. В центре вместо
// неё «Сообщество»: переписка с коллегами, ради которой заходят каждый день.
const PROVIDER_TABS: Tab[] = [
  { id: "home", key: "navHome", icon: "Home" },
  { id: "chat", key: "navChat", icon: "MessageSquare" },
  { id: "community", key: "navCommunity", icon: "Users", primary: true },
  { id: "courses", key: "navCourses", icon: "GraduationCap" },
  { id: "dashboard", key: "tabProfile", icon: "CircleUser" },
];

export default function MobileTabBar({
  active,
  role,
  isAuthed,
  onGo,
  onCabinet,
}: {
  active: Section;
  role: "client" | "provider" | null;
  isAuthed: boolean;
  onGo: (s: Section) => void;
  onCabinet: () => void;
}) {
  const { tr } = useLang();
  const tabs = !isAuthed ? GUEST_TABS : role === "provider" ? PROVIDER_TABS : CLIENT_TABS;

  const press = (tab: Tab) => {
    if (tab.id === "new-request") {
      window.dispatchEvent(new CustomEvent("shchit:new-request"));
      return;
    }
    // Гость нажал «Профиль» — открываем вход, а не пустой кабинет.
    if (tab.id === "dashboard" && !isAuthed) {
      onCabinet();
      return;
    }
    onGo(tab.id);
  };

  return (
    <nav
      aria-label={tr("tabBarLabel")}
      className="md:hidden fixed bottom-0 inset-x-0 z-[80] bg-card/95 backdrop-blur-md border-t border-border"
      // Отступ под системную полоску «домой» на iPhone без кнопки:
      // без него вкладки оказывались под жестом сворачивания.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          if (tab.primary) {
            return (
              <li key={tab.id} className="flex items-center justify-center">
                <button
                  onClick={() => press(tab)}
                  aria-label={tr(tab.key)}
                  aria-current={isActive ? "page" : undefined}
                  className="w-12 h-12 -mt-5 rounded-full gold-gradient text-[hsl(28,20%,7%)] flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-background active:scale-95 transition-transform"
                >
                  <Icon name={tab.icon} size={22} strokeWidth={2.25} />
                </button>
              </li>
            );
          }
          return (
            <li key={tab.id}>
              <button
                onClick={() => press(tab)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? "text-gold" : "text-muted-foreground active:text-foreground"}`}
              >
                <Icon name={tab.icon} size={21} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[10px] font-montserrat font-semibold leading-none max-w-full truncate px-0.5">
                  {tr(tab.key)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
