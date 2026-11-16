import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected runtime error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[VIZRA ErrorBoundary] Uncaught UI exception:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#090909] text-white flex items-center justify-center p-6 font-inter"
          role="alert"
        >
          <div className="max-w-md w-full rounded-2xl bg-[#111111] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-[#EB3B2D]">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Studio View Encountered an Exception
              </h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                A component failed to render safely. Your saved local workspace threads and projects remain preserved.
              </p>
            </div>
            {this.state.errorMessage && (
              <pre className="p-3 rounded-xl bg-black/70 border border-white/5 text-[11px] font-mono text-red-300 whitespace-pre-wrap break-words max-h-28 overflow-auto">
                {this.state.errorMessage}
              </pre>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#EB3B2D] hover:bg-[#dc2626] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reload Studio</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Home size={13} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
