import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      severity: "error",
      event: "admin_render_failed",
      message: error.message,
      componentStack: info.componentStack?.slice(0, 1000),
    }));
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="app-fatal-error" role="alert">
          <h1>Não foi possível carregar o painel</h1>
          <p>Seus dados não foram alterados. Atualize a página para tentar novamente.</p>
          <button type="button" onClick={() => window.location.reload()}>Recarregar página</button>
        </main>
      );
    }
    return this.props.children;
  }
}
