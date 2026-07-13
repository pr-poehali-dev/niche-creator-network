import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  message?: string;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Перехватываем ошибку рендера, чтобы пользователь не увидел белый экран,
    // и логируем расширенный контекст (страница, устройство, время) —
    // это ускоряет диагностику сбоя без необходимости просить пользователя
    // вручную описывать шаги воспроизведения.
    const ctx = typeof window !== "undefined"
      ? { url: window.location.href, ua: navigator.userAgent, time: new Date().toISOString() }
      : {};
    console.error("[ErrorBoundary]", error?.message, error?.stack, info?.componentStack, ctx);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) { this.props.onReset(); return; }
    if (typeof window !== "undefined") window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="text-center max-w-md">
            <div className="font-montserrat font-extrabold text-2xl text-foreground mb-3">
              Щ<span className="text-gold">ИТ</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Что-то пошло не так. Попробуйте обновить страницу.
              <br />
              Something went wrong. Please reload the page.
            </p>
            {this.state.message && (
              <p className="text-[11px] text-destructive/80 mb-6 break-words font-mono bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
                {this.state.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 gold-gradient text-[hsl(220,20%,6%)] px-6 py-3 font-montserrat font-bold rounded-sm hover:opacity-90 transition-opacity"
            >
              ↻ Обновить / Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;