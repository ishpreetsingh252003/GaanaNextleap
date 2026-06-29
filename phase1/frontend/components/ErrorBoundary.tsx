"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary – catches unhandled render errors in child trees
 * and displays a graceful fallback UI instead of a blank page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <p className="text-4xl mb-4">⚠️</p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              An unexpected error occurred. Please refresh the page and try
              again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
