import { Component, type ErrorInfo, type ReactNode } from 'react';
import { HouseController } from './features/house/house-controller';

type State = { error: Error | null };

/** Keeps a render failure readable and recoverable instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('HOUSE.SYS render failure', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="boot-fallback" role="alert">
        <h1>The house atlas hit a rendering error</h1>
        <p>
          Nothing was saved or changed — this app only displays recorded
          inventory. Reloading restores the last view from the address bar.
        </p>
        <pre>{this.state.error.message}</pre>
        <p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>{' '}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '';
              window.location.reload();
            }}
          >
            Reload without the saved view
          </button>
        </p>
      </main>
    );
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <HouseController stageTone="ink" />
    </ErrorBoundary>
  );
}
