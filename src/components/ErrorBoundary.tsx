import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Перехватываем ошибку рендера, чтобы пользователь не увидел белый экран,
    // и логируем её для диагностики.
    console.error("[ErrorBoundary]", error?.message, error?.stack, info?.componentStack);
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
            <p className="text-muted-foreground mb-6">
              Что-то пошло не так. Попробуйте обновить страницу.
              <br />
              Something went wrong. Please reload the page.
            </p>
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