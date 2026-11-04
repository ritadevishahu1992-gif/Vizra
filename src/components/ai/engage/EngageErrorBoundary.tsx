import React, { Component, ErrorInfo, ReactNode } from 'react';
import { EngageLifecycleState } from '../../../types/engage';
import { logSafeInteractionEvent } from '../../../services/engageEventLogger';

interface EngageErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  lifecycleState?: EngageLifecycleState;
  hasStreamedTokens?: boolean;
  resetKey?: string | number;
}

interface EngageErrorBoundaryState {
  hasError: boolean;
}

export class EngageErrorBoundary extends Component<
  EngageErrorBoundaryProps,
  EngageErrorBoundaryState
> {
  public state: EngageErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(_error: Error): EngageErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidUpdate(prevProps: EngageErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      (prevProps.resetKey !== this.props.resetKey ||
        (prevProps.lifecycleState !== this.props.lifecycleState &&
          this.props.lifecycleState === 'generating'))
    ) {
      this.setState({ hasError: false });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const isWaitingForFirstToken =
      this.props.lifecycleState === 'generating' ||
      (this.props.lifecycleState === 'streaming' && !this.props.hasStreamedTokens);

    logSafeInteractionEvent('engage_error_boundary_triggered', {
      lifecycleState: this.props.lifecycleState,
      hasStreamedTokens: Boolean(this.props.hasStreamedTokens),
      fallbackRendered: isWaitingForFirstToken,
      reason: error.name || 'RenderError',
    });

    console.warn(
      '[VIZRA Engage] Fail-safe boundary caught render error:',
      error.message,
      errorInfo
    );
  }

  public render(): ReactNode {
    const { lifecycleState, hasStreamedTokens, fallback, children } = this.props;

    // Never display fallback if lifecycle has ended or is in an error/cancelled/idle state
    if (
      lifecycleState === 'idle' ||
      lifecycleState === 'completed' ||
      lifecycleState === 'cancelled' ||
      lifecycleState === 'failed'
    ) {
      return null;
    }

    if (this.state.hasError) {
      // If tokens are already streaming, silently collapse so response text is never obstructed
      if (hasStreamedTokens) {
        return null;
      }

      return (
        fallback ?? (
          <div
            className="flex items-center gap-2 text-xs font-mono text-neutral-400 py-2"
            role="status"
            aria-live="polite"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d] animate-pulse motion-reduce:animate-none" />
            <span>OMNIA 1.0 is synthesizing…</span>
          </div>
        )
      );
    }

    return children;
  }
}
