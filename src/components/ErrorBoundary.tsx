import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  /** short label shown in the message, e.g. "this page" */
  scope?: string;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="m-6 rounded-lg border border-danger bg-danger-soft p-6">
        <h2 className="text-lg font-semibold text-danger">
          Something went wrong in {this.props.scope ?? 'this page'}.
        </h2>
        <p className="mt-2 text-sm">
          Your progress is saved. You can try again, or go back to the dashboard.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-surface p-3 text-xs">
          {this.state.error.message}
        </pre>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button variant="secondary" onClick={() => (window.location.hash = '#/')}>
            Home
          </Button>
        </div>
      </div>
    );
  }
}
