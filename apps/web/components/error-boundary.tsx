"use client";

import React, { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-sand dark:bg-espresso p-4">
            <div className="max-w-md w-full text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 dark:bg-error/20 mb-6">
                <Icon name="alert-circle" size={32} className="text-error" />
              </div>
              <h2 className="text-2xl font-bold text-espresso dark:text-cream mb-2">
                Oops, something went wrong
              </h2>
              <p className="text-text-body dark:text-text-muted mb-6">
                We're sorry for the inconvenience. Please try refreshing the page.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 bg-ember hover:bg-ember-hover text-cream font-semibold py-2 px-6 rounded-lg transition"
              >
                <Icon name="redo" size={16} />
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
